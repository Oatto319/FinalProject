import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room, PeerEvaluation, User } from '@/lib/models';
import { getSessionUser } from '@/lib/auth';
import { isRoomEnded } from '@/lib/room-status';
import { programmingTypeTable } from '@/lib/mbti-programming';
import { serviceTypeTable } from '@/lib/mbti-service';
import { presentationTypeTable } from '@/lib/mbti-presentation';
import { designTypeTable } from '@/lib/mbti-design';
import type { MbtiTypeInfo } from '@/lib/mbti';

const CRITERIA_KEYS = [
  'contribution', 'responsibility', 'communication', 'problemSolving', 'cooperation',
  'creativity', 'initiative', 'timeManagement', 'adaptability', 'qualityOfWork',
  'teamwork',
] as const;
type CriteriaKey = typeof CRITERIA_KEYS[number];

const CRITERIA_LABELS: Record<CriteriaKey, string> = {
  contribution: 'การมีส่วนร่วม',
  responsibility: 'ความรับผิดชอบ',
  communication: 'การสื่อสาร',
  problemSolving: 'การแก้ไขปัญหา',
  cooperation: 'ความร่วมมือ',
  creativity: 'ความคิดสร้างสรรค์',
  initiative: 'ความคิดริเริ่ม',
  timeManagement: 'การบริหารเวลา',
  adaptability: 'ความยืดหยุ่น',
  qualityOfWork: 'คุณภาพงาน',
  teamwork: 'การทำงานเป็นทีม',
};

const TYPE_TABLES: Record<string, Record<string, MbtiTypeInfo>> = {
  programming: programmingTypeTable,
  service: serviceTypeTable,
  presentation: presentationTypeTable,
  design: designTypeTable,
};

function resolveTableKey(template: string): keyof typeof TYPE_TABLES {
  const t = (template ?? '').toLowerCase();
  if (t.includes('service')) return 'service';
  if (t.includes('presentation')) return 'presentation';
  if (t.includes('design')) return 'design';
  return 'programming';
}

interface RoomMemberLite { name: string; gmail?: string; }
interface MatchedGroupLite { id: number; name: string; leaderId?: string; members: RoomMemberLite[]; }
interface RoomLite {
  roomId: string; title: string; template?: string;
  matchedGroups?: MatchedGroupLite[];
  deadline?: Date | null; matchedAt?: Date | null; endedManually?: boolean; updatedAt: Date;
}

// GET /api/summary → สรุปผลของทุกโปรเจกต์ที่ผู้ใช้ทำจบแล้ว (MBTI, จุดเด่น, หัวหน้าทีม, คะแนนประเมินที่ได้รับ)
export async function GET(req: NextRequest) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ projects: [] }, { status: 401 });

  const gmail = sessionUser.gmail.toLowerCase();

  const rawRooms = await Room.find({ matchDone: true, 'matchedGroups.members.gmail': gmail })
    .select('roomId title template matchedGroups deadline matchedAt endedManually updatedAt')
    .sort({ updatedAt: -1 })
    .lean<RoomLite[]>();

  const endedRooms = rawRooms.filter((r) => isRoomEnded(r));
  if (endedRooms.length === 0) return NextResponse.json({ projects: [] });

  // ดึงคะแนนประเมินที่ "ได้รับ" ในแต่ละห้องเหล่านี้ในครั้งเดียว
  const evals = await PeerEvaluation.find(
    { toGmail: gmail, roomId: { $in: endedRooms.map((r) => r.roomId) } },
    { roomId: 1, scores: 1, _id: 0 }
  ).lean<{ roomId: string; scores: Record<CriteriaKey, number> }[]>();

  const evalsByRoom = new Map<string, Record<CriteriaKey, number>[]>();
  for (const e of evals) {
    const list = evalsByRoom.get(e.roomId) ?? [];
    list.push(e.scores);
    evalsByRoom.set(e.roomId, list);
  }

  // types ทั้งหมดที่ผู้ใช้เคยทำแบบทดสอบไว้ (เก็บใน User.types เป็น { [template]: { code, ... } })
  const userDoc = await User.findOne({ gmail }, { types: 1 }).lean<{ types?: Record<string, { code?: string }> }>();
  const types = userDoc?.types ?? {};

  const projects = endedRooms.map((room) => {
    const group = (room.matchedGroups ?? []).find((g) => g.members.some((m) => m.gmail === gmail));
    const tableKey = resolveTableKey(room.template ?? 'programming');
    const code = types[tableKey]?.code ?? null;
    const info = code ? TYPE_TABLES[tableKey][code] : null;

    const scoresList = evalsByRoom.get(room.roomId) ?? [];
    const avg = (key: CriteriaKey) =>
      scoresList.length ? scoresList.reduce((s, v) => s + v[key], 0) / scoresList.length : null;

    const byCriteria = CRITERIA_KEYS.map((key) => ({
      key,
      label: CRITERIA_LABELS[key],
      score: avg(key) !== null ? Math.round((avg(key) as number) * 10) / 10 : null,
    }));

    const overall = scoresList.length
      ? Math.round((CRITERIA_KEYS.reduce((s, k) => s + (avg(k) as number), 0) / CRITERIA_KEYS.length) * 10) / 10
      : null;

    return {
      roomId: room.roomId,
      title: room.title,
      template: tableKey,
      teamName: group?.name ?? null,
      mbti: code ? { code, title: info?.title ?? '', jobs: info?.jobs ?? [] } : null,
      isLeader: !!group && group.leaderId === sessionUser.name,
      evaluation: {
        count: scoresList.length,
        overall,
        byCriteria,
      },
    };
  });

  return NextResponse.json({ projects });
}