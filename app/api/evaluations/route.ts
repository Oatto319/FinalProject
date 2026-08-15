import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room, PeerEvaluation } from '@/lib/models';
import { getSessionUser } from '@/lib/auth';
import { getPendingEvaluations } from '@/lib/evaluation';
import { isRoomEnded } from '@/lib/room-status';
import { CRITERIA_KEYS } from '@/lib/peer-evaluation';

const COMMENT_MAX_LEN = 1000;

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
  const { roomId, toGmail, scores, comment } = body;
  if (typeof roomId !== 'string' || typeof toGmail !== 'string' || !scores || typeof scores !== 'object') {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
  }

  for (const key of CRITERIA_KEYS) {
    const v = scores[key];
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 5) {
      return NextResponse.json({ error: 'คะแนนต้องเป็นจำนวนเต็ม 1-5' }, { status: 400 });
    }
  }

  // ความคิดเห็นเป็นข้อความเพิ่มเติม — ไม่บังคับ แต่ต้องเป็น string และไม่ยาวเกินกำหนด
  if (comment !== undefined && comment !== null && typeof comment !== 'string') {
    return NextResponse.json({ error: 'ความคิดเห็นต้องเป็นข้อความ' }, { status: 400 });
  }
  const trimmedComment = typeof comment === 'string' ? comment.trim().slice(0, COMMENT_MAX_LEN) : '';

  const room = await Room.findOne({ roomId });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  // แบบประเมินเปิดหลังห้องจบเท่านั้น (matchDone + endedManually/เลยกำหนดส่ง/เลย 7 วัน) — กันแก้ทีมกลางคันแล้ว
  // แบบประเมินอ้างอิง groupId ที่ผูกไว้ ณ ตอนส่งไม่ตรงกับทีมจริงหลัง host ปรับทีมทีหลัง
  // (endedManually เป็นหนึ่งในเงื่อนไขที่ทำให้ isRoomEnded เป็นจริง คือตัว "เปิด" ไม่ใช่ตัว "ปิด" การประเมิน)
  if (!isRoomEnded(room)) {
    return NextResponse.json({ error: 'ห้องนี้ยังไม่จบกิจกรรม ยังไม่สามารถส่งแบบประเมินได้' }, { status: 400 });
  }

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
    {
      $set: {
        groupId: group.id,
        scores: Object.fromEntries(CRITERIA_KEYS.map((k) => [k, scores[k]])),
        comment: trimmedComment,
      },
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({ evaluation: saved });
}