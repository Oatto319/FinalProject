import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';
import { getSessionUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getPendingEvaluations } from '@/lib/evaluation';

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;
const MAX_TOTAL_MEMBERS = 300;
const MAX_GROUP_SIZE = 50;

// POST /api/rooms → create room (host identity comes from the session, not the body)
export async function POST(req: NextRequest) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!checkRateLimit(`create-room:${sessionUser.gmail}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'สร้างห้องบ่อยเกินไป กรุณาลองใหม่ในอีกสักครู่' }, { status: 429 });
  }

  const pending = await getPendingEvaluations(sessionUser.gmail);
  if (pending.length > 0) {
    return NextResponse.json(
      { error: 'มีแบบประเมินเพื่อนร่วมทีมค้างอยู่ กรุณาทำให้เสร็จก่อนสร้างห้องใหม่', pending },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { roomId, title, description, totalMembers, groupSize, deadline, template, matchMode } = body;
  if (!roomId || !title) return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
  if (String(title).length > TITLE_MAX_LENGTH) {
    return NextResponse.json({ error: `ชื่อห้องต้องไม่เกิน ${TITLE_MAX_LENGTH} ตัวอักษร` }, { status: 400 });
  }
  if (description && String(description).length > DESCRIPTION_MAX_LENGTH) {
    return NextResponse.json({ error: `รายละเอียดต้องไม่เกิน ${DESCRIPTION_MAX_LENGTH} ตัวอักษร` }, { status: 400 });
  }
  if (!(Number(totalMembers) >= 1) || Number(totalMembers) > MAX_TOTAL_MEMBERS) {
    return NextResponse.json({ error: `จำนวนคนทั้งหมดต้องอยู่ระหว่าง 1-${MAX_TOTAL_MEMBERS} คน` }, { status: 400 });
  }
  if (!(Number(groupSize) >= 1) || Number(groupSize) > MAX_GROUP_SIZE) {
    return NextResponse.json({ error: `จำนวนคนต่อกลุ่มต้องอยู่ระหว่าง 1-${MAX_GROUP_SIZE} คน` }, { status: 400 });
  }
  let deadlineDate: Date | null = null;
  if (deadline) {
    deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      return NextResponse.json({ error: 'วันสิ้นสุดไม่ถูกต้อง' }, { status: 400 });
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) {
      return NextResponse.json({ error: 'วันสิ้นสุดต้องไม่ใช่วันที่ผ่านมาแล้ว' }, { status: 400 });
    }
  }

  // เจ้าของห้องที่เป็น "user" (นักเรียน) สร้างห้องเพื่อร่วมทีมด้วยตัวเอง จึงนับเป็นสมาชิกและพร้อมจับกลุ่มทันที
  // ส่วนเจ้าของห้องที่เป็น "host" (อาจารย์) ยังคงมีหน้าที่ควบคุมห้องเท่านั้น ไม่นับเป็นสมาชิก
  const hostRole = sessionUser.role === 'host' ? 'host' : 'user';
  const selfMember = { name: sessionUser.name, avatarSeed: sessionUser.avatarSeed, avatarImage: sessionUser.avatarImage, gmail: sessionUser.gmail };

  try {
    const room = await Room.create({
      roomId, title, description, totalMembers, groupSize, deadline: deadlineDate, template, matchMode,
      hostName: sessionUser.name,
      hostGmail: sessionUser.gmail,
      hostAvatarSeed: sessionUser.avatarSeed,
      hostAvatarImage: sessionUser.avatarImage,
      hostRole,
      members: hostRole === 'user' ? [selfMember] : [],
      readyUsers: hostRole === 'user' ? [sessionUser.name] : [],
    });
    return NextResponse.json({ room: room.toObject() }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'Room ID นี้ถูกใช้ไปแล้ว กรุณาลองใหม่' }, { status: 409 });
    }
    throw err;
  }
}
