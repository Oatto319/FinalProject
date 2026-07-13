import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room, PeerEvaluation } from '@/lib/models';
import { getSessionUser } from '@/lib/auth';
import { getPendingEvaluations } from '@/lib/evaluation';

const CRITERIA_KEYS = ['decision', 'creative', 'emotion', 'teamwork', 'responsibility'] as const;

// GET /api/evaluations → รายการห้องที่จบแล้วและยังมีเพื่อนร่วมกลุ่มที่ยังไม่ได้ประเมิน
export async function GET(req: NextRequest) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pending = await getPendingEvaluations(sessionUser.gmail);
  return NextResponse.json({ pending, hasPending: pending.length > 0 });
}

// POST /api/evaluations → ส่งแบบประเมินเพื่อนร่วมทีม 1 คน (upsert ต่อคู่ roomId+fromGmail+toGmail)
export async function POST(req: NextRequest) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { roomId, toGmail, scores } = body;
  if (typeof roomId !== 'string' || typeof toGmail !== 'string' || !scores || typeof scores !== 'object') {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
  }

  for (const key of CRITERIA_KEYS) {
    const v = scores[key];
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 5) {
      return NextResponse.json({ error: 'คะแนนต้องเป็นจำนวนเต็ม 1-5' }, { status: 400 });
    }
  }

  const room = await Room.findOne({ roomId });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const fromGmail = sessionUser.gmail.toLowerCase();
  const target = toGmail.toLowerCase();
  if (target === fromGmail) return NextResponse.json({ error: 'ไม่สามารถประเมินตัวเองได้' }, { status: 400 });

  const group = (room.matchedGroups ?? []).find(
    (g: { members: { gmail?: string }[] }) =>
      g.members.some((m) => m.gmail === fromGmail) && g.members.some((m) => m.gmail === target)
  );
  if (!group) return NextResponse.json({ error: 'ไม่ได้อยู่กลุ่มเดียวกันในห้องนี้' }, { status: 403 });

  const saved = await PeerEvaluation.findOneAndUpdate(
    { roomId, fromGmail, toGmail: target },
    { $set: { groupId: group.id, scores: Object.fromEntries(CRITERIA_KEYS.map((k) => [k, scores[k]])) } },
    { upsert: true, new: true }
  );

  return NextResponse.json({ evaluation: saved });
}
