import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';
import { getSessionUser, isRoomHost, isRoomMember } from '@/lib/auth';
import { fetchMemberEvalScores } from '@/lib/room-member-data';

// GET /api/rooms/:roomId/member-eval-scores?groupId=1    → คะแนนสะสมของสมาชิกกลุ่มนั้น (เรียกตอนแนะนำหัวหน้าทีม)
// GET /api/rooms/:roomId/member-eval-scores               → คะแนนสะสมของทุกกลุ่มที่จับไปแล้วในห้องนี้
// GET /api/rooms/:roomId/member-eval-scores?source=members → คะแนนสะสมของทุกคนในห้อง (pre-match, ใช้ตอนจับกลุ่ม)
//
// ค่าเฉลี่ยคำนวณจากแบบประเมินเพื่อนร่วมทีมของแต่ละคน "ข้ามทุกห้อง/ทุกโปรเจกต์ที่เคยผ่านมา" (ตาม toGmail เป็นหลัก)
// ไม่จำกัดแค่ห้องปัจจุบัน — เพราะทั้งสอง endpoint ด้านบนถูกเรียกตอนจับกลุ่ม/เลือกหัวหน้าของห้องนี้
// ซึ่งเกิดขึ้น "ก่อน" ที่แบบประเมินของห้องนี้เองจะถูกสร้าง (แบบประเมินเปิดหลังห้องจบเท่านั้น)
// การจำกัดด้วย roomId ปัจจุบันจึงทำให้ query นี้ว่างเปล่าเสมอ — คะแนนที่มีความหมายต้องมาจากผลงานในห้อง/โปรเจกต์ก่อนหน้านี้เท่านั้น
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ scores: {} }, { status: 401 });

  const { roomId } = await params;
  const { searchParams } = new URL(req.url);
  const groupIdParam = searchParams.get('groupId');
  const source = searchParams.get('source');

  const room = await Room.findOne({ roomId });
  if (!room) return NextResponse.json({ scores: {} }, { status: 404 });

  const caller = { gmail: sessionUser.gmail, name: sessionUser.name };
  if (!isRoomHost(caller, room) && !isRoomMember(caller, room)) {
    return NextResponse.json({ scores: {} }, { status: 403 });
  }

  let allMembers: { name: string; gmail?: string }[];

  if (source === 'members') {
    allMembers = (room.members ?? []) as { name: string; gmail?: string }[];
  } else {
    const groupId = groupIdParam !== null ? parseInt(groupIdParam, 10) : null;
    const allGroups: { members: { name: string; gmail?: string }[] }[] =
      groupId !== null && !Number.isNaN(groupId)
        ? (room.matchedGroups ?? []).filter((g: { id: number }) => g.id === groupId)
        : (room.matchedGroups ?? []);
    allMembers = allGroups.flatMap((g) => g.members);
  }

  const scores = await fetchMemberEvalScores(allMembers);

  return NextResponse.json({ scores });
}