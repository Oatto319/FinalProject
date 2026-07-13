import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room, PeerEvaluation } from '@/lib/models';
import { getSessionUser, isRoomHost, isRoomMember } from '@/lib/auth';

const CRITERIA_KEYS = ['decision', 'creative', 'emotion', 'teamwork', 'responsibility'] as const;
type CriteriaKey = typeof CRITERIA_KEYS[number];

// GET /api/rooms/:roomId/member-eval-scores?groupId=1    → คะแนนประเมินย้อนหลังเฉพาะกลุ่มนั้น (post-match)
// GET /api/rooms/:roomId/member-eval-scores               → คะแนนประเมินย้อนหลังทุกคนในห้อง (post-match)
// GET /api/rooms/:roomId/member-eval-scores?source=members → คะแนนประเมินย้อนหลังทุกคนในห้อง (pre-match, ใช้ตอนจับกลุ่ม)
//
// ค่าเฉลี่ยคำนวณจากประวัติแบบประเมินเพื่อนร่วมทีมทุกห้องในอดีต (ไม่ใช่แค่ห้องนี้) เพื่อสะท้อนพฤติกรรมสะสมของแต่ละคน
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

  const gmails = allMembers.filter((m) => m.gmail).map((m) => m.gmail!.toLowerCase());
  const evals = gmails.length
    ? await PeerEvaluation.find({ toGmail: { $in: gmails } }, { toGmail: 1, scores: 1, _id: 0 }).lean<
        { toGmail: string; scores: Record<CriteriaKey, number> }[]
      >()
    : [];

  const byGmail = new Map<string, Record<CriteriaKey, number>[]>();
  for (const e of evals) {
    const list = byGmail.get(e.toGmail) ?? [];
    list.push(e.scores);
    byGmail.set(e.toGmail, list);
  }

  const scores: Record<string, { overall: number; leadership: number; count: number }> = {};
  for (const member of allMembers) {
    if (!member.gmail) continue;
    const list = byGmail.get(member.gmail.toLowerCase());
    if (!list || list.length === 0) continue;

    const avg = (key: CriteriaKey) => list.reduce((sum, s) => sum + s[key], 0) / list.length;
    const overallAvg = CRITERIA_KEYS.reduce((sum, k) => sum + avg(k), 0) / CRITERIA_KEYS.length;
    const leadershipAvg = (avg('decision') + avg('teamwork') + avg('responsibility')) / 3;

    scores[member.name] = {
      overall: Math.round(overallAvg * 20),
      leadership: Math.round(leadershipAvg * 20),
      count: list.length,
    };
  }

  return NextResponse.json({ scores });
}
