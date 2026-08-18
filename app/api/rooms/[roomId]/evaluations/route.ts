import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room, PeerEvaluation } from '@/lib/models';
import { getSessionUser, isRoomHost } from '@/lib/auth';
import { CRITERIA_KEYS, type CriteriaKey } from '@/lib/peer-evaluation';

interface MatchedGroupLite { members: { gmail?: string; name: string }[]; }

// GET /api/rooms/:roomId/evaluations → คะแนน+คอมเมนต์ของแบบประเมินในห้องนี้ (host เท่านั้น)
// ไม่ส่ง fromGmail กลับไปเด็ดขาด — ผู้ประเมินยังคงไม่ระบุตัวตนเหมือนเดิม แค่เปิดให้ host เห็นคอมเมนต์ที่เก็บไว้
// (เดิมเก็บ comment ไว้ใน DB แต่ไม่มี endpoint ไหนอ่านออกมาใช้เลย)
export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ members: {} }, { status: 401 });

  const { roomId } = await params;
  const room = await Room.findOne({ roomId }).lean<{ matchedGroups?: MatchedGroupLite[]; hostGmail?: string; hostName: string }>();
  if (!room) return NextResponse.json({ members: {} }, { status: 404 });

  const caller = { gmail: sessionUser.gmail, name: sessionUser.name };
  if (!isRoomHost(caller, room)) return NextResponse.json({ members: {} }, { status: 403 });

  const nameByGmail = new Map<string, string>();
  for (const g of room.matchedGroups ?? []) {
    for (const m of g.members ?? []) if (m.gmail) nameByGmail.set(m.gmail, m.name);
  }

  const evals = await PeerEvaluation.find(
    { roomId },
    { toGmail: 1, scores: 1, comment: 1, createdAt: 1, _id: 0 }
  ).lean<{ toGmail: string; scores: Record<CriteriaKey, number>; comment: string; createdAt: Date }[]>();

  const members: Record<string, { name: string; entries: { overall: number; comment: string; createdAt: Date }[] }> = {};
  for (const e of evals) {
    const name = nameByGmail.get(e.toGmail) ?? e.toGmail;
    const overall = Math.round((CRITERIA_KEYS.reduce((sum, k) => sum + e.scores[k], 0) / CRITERIA_KEYS.length) * 10) / 10;
    if (!members[e.toGmail]) members[e.toGmail] = { name, entries: [] };
    members[e.toGmail].entries.push({ overall, comment: e.comment ?? '', createdAt: e.createdAt });
  }
  for (const key of Object.keys(members)) members[key].entries.sort((a, b) => a.overall - b.overall);

  return NextResponse.json({ members });
}
