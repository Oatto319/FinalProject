import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room, PeerEvaluation, User } from '@/lib/models';
import { getSessionUser } from '@/lib/auth';
import { isRoomEnded } from '@/lib/room-status';
import { CRITERIA_KEYS, type CriteriaKey, trimOutliers } from '@/lib/peer-evaluation';
import { fetchMemberTypes, memberKey } from '@/lib/room-member-data';
import { categoryKeyForCode } from '@/lib/type-composition';
import { programmingTypeTable } from '@/lib/mbti-programming';
import { serviceTypeTable } from '@/lib/mbti-service';
import { presentationTypeTable } from '@/lib/mbti-presentation';
import { designTypeTable } from '@/lib/mbti-design';
import type { MbtiTypeInfo } from '@/lib/mbti';

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

interface RoomMemberLite { name: string; gmail?: string; avatarSeed?: number; avatarImage?: string | null; }
interface MatchedGroupLite { id: number; name: string; leaderId?: string; members: RoomMemberLite[]; }
interface RoomLite {
  roomId: string; title: string; template?: string; hostGmail?: string;
  matchedGroups?: MatchedGroupLite[];
  typeComposition?: Record<string, number>;
  deadline?: Date | null; matchedAt?: Date | null; endedManually?: boolean; updatedAt: Date;
}
interface HostRoomLite {
  roomId: string; matchDone: boolean; endedManually?: boolean;
  deadline?: Date | null; matchedAt?: Date | null; updatedAt: Date;
  members?: unknown[]; matchedGroups?: MatchedGroupLite[];
}

interface CriteriaScoreResult { key: CriteriaKey; label: string; score: number | null; }

// จำนวนคู่ "ประเมิน" ที่ควรเกิดขึ้นในกลุ่ม — สมาชิกทุกคนประเมินเพื่อนร่วมทีมทุกคน (ไม่รวมตัวเอง)
function expectedEvalPairs(size: number): number {
  return size * (size - 1);
}

// สรุปผลระดับทีมสำหรับมุมมอง host เท่านั้น — เป็น aggregate (ค่าเฉลี่ย/จำนวนนับ) ไม่มีข้อมูลรายคน
// เพื่อไม่ให้ขัดกับ anonymity ที่ trimOutliers ตั้งใจสร้างไว้ตอนประมวลผลคะแนนประเมิน
interface HostTeamSummary {
  id: number;
  name: string;
  memberCount: number;
  avgEvaluation: number | null;
  typeCounts: Record<string, number>;
  members: { name: string; avatarSeed: number; avatarImage: string | null }[];
  leaderName: string | null;
}

interface EvalCompletion { done: number; total: number; rate: number | null; }

// ภาพรวมข้ามทุกห้องที่ผู้ใช้เคยสร้าง (ไม่ว่าจะจับกลุ่มแล้วหรือยัง) — คนละชุดกับ "overall" ของสมาชิกทีมด้านบน
interface HostOverview {
  totalRooms: number;
  ended: number;
  active: number;
  notMatched: number;
  totalStudents: number;
  totalTeams: number;
  avgEvaluation: number | null;
  evalRate: number | null;
}

// เฉลี่ยเฉพาะค่าที่เป็นตัวเลขจริง — แบบประเมินรุ่นเก่าอาจไม่มีครบทุกเกณฑ์ ถ้าเผลอเอา undefined ไปบวกจะได้ NaN
// แล้ว JSON.stringify จะแปลงเป็น null ทำให้หน้าเว็บโชว์คะแนนว่างทั้งที่มีผลประเมินอยู่
function summarizeScores(scoresList: Record<CriteriaKey, number>[]): { count: number; overall: number | null; byCriteria: CriteriaScoreResult[] } {
  // count คือจำนวนผู้ประเมินจริงทั้งหมด (ไม่ตัด) — trimOutliers มีผลแค่กับตัวเลขคะแนนที่เอาไปเฉลี่ยเท่านั้น
  const trimmed = trimOutliers(scoresList);
  const avg = (key: CriteriaKey): number | null => {
    const nums = trimmed.map((v) => v?.[key]).filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
    return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : null;
  };

  const byCriteria = CRITERIA_KEYS.map((key) => {
    const a = avg(key);
    return { key, label: CRITERIA_LABELS[key], score: a === null ? null : Math.round(a * 10) / 10 };
  });

  const scored = byCriteria.filter((c): c is CriteriaScoreResult & { score: number } => c.score !== null);
  const overall = scored.length
    ? Math.round((scored.reduce((s, c) => s + c.score, 0) / scored.length) * 10) / 10
    : null;

  return { count: scoresList.length, overall, byCriteria };
}

// GET /api/summary → สรุปผลของทุกโปรเจกต์ที่ผู้ใช้จับกลุ่มไปแล้ว (MBTI, จุดเด่น, หัวหน้าทีม, คะแนนประเมินที่ได้รับ)
// ครอบคลุมทั้ง (1) ผู้ใช้ที่เป็นสมาชิกทีมในห้องนั้น และ (2) host ที่คุมห้องแต่ไม่ได้ร่วมทีมเอง
// (host ไม่ถูกใส่เข้า room.members ตอนสร้างห้อง จึงต้องดึงด้วย hostGmail แยกต่างหาก มิเช่นนั้นห้องที่ host จบไปแล้วจะไม่ขึ้นในสรุปผลเลย)
//
// เดิมกรองเฉพาะห้องที่ isRoomEnded() เป็น true ทำให้หน้าสรุปผลว่างเปล่าเสมอจนกว่าจะเลย deadline /
// host กดจบกิจกรรม / ครบ 7 วัน — ตอนนี้คืนห้องที่จับกลุ่มแล้วทั้งหมดพร้อมธง `ended` ให้หน้าเว็บแสดงสถานะแทน
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) return NextResponse.json({ projects: [], error: 'Unauthorized' }, { status: 401 });

    const gmail = sessionUser.gmail.toLowerCase();
    const profile = {
      name: sessionUser.name,
      avatarSeed: sessionUser.avatarSeed,
      avatarImage: sessionUser.avatarImage,
      role: sessionUser.role,
    };

    // ภาพรวมของ "ห้องที่ตัวเองสร้าง" ทั้งหมด รวมห้องที่ยังไม่ได้ match ด้วย — คนละ scope กับ query ด้านล่าง
    // ที่จำกัดแค่ห้องที่จับกลุ่มแล้ว จึงต้องแยก query เพื่อไม่ให้ห้องที่ยังรอ match หายไปจากภาพรวม
    const allHostRooms = await Room.find({ hostGmail: gmail })
      .select('roomId matchDone endedManually deadline matchedAt updatedAt members matchedGroups')
      .lean<HostRoomLite[]>();

    let hostOverview: HostOverview | null = null;
    if (allHostRooms.length > 0) {
      let ended = 0, active = 0, notMatched = 0, totalStudents = 0, totalTeams = 0, expectedEvals = 0;
      const matchedRoomIds: string[] = [];
      for (const r of allHostRooms) {
        totalStudents += (r.members ?? []).length;
        if (!r.matchDone) { notMatched++; continue; }
        matchedRoomIds.push(r.roomId);
        const groups = r.matchedGroups ?? [];
        totalTeams += groups.length;
        for (const g of groups) expectedEvals += expectedEvalPairs((g.members ?? []).length);
        if (isRoomEnded(r)) ended++; else active++;
      }

      const overviewEvals = matchedRoomIds.length
        ? await PeerEvaluation.find(
            { roomId: { $in: matchedRoomIds } },
            { scores: 1, _id: 0 }
          ).lean<{ scores: Record<CriteriaKey, number> }[]>()
        : [];

      hostOverview = {
        totalRooms: allHostRooms.length,
        ended,
        active,
        notMatched,
        totalStudents,
        totalTeams,
        avgEvaluation: summarizeScores(overviewEvals.map((e) => e.scores)).overall,
        evalRate: expectedEvals > 0 ? Math.round((overviewEvals.length / expectedEvals) * 100) : null,
      };
    }

    const rooms = await Room.find({
      matchDone: true,
      $or: [{ 'matchedGroups.members.gmail': gmail }, { hostGmail: gmail }],
    })
      .select('roomId title template matchedGroups typeComposition deadline matchedAt endedManually updatedAt hostGmail')
      .sort({ updatedAt: -1 })
      .lean<RoomLite[]>();

    if (rooms.length === 0) return NextResponse.json({ profile, overall: summarizeScores([]), projects: [], hostOverview });

    const isMember = (room: RoomLite) =>
      (room.matchedGroups ?? []).some((g) => (g.members ?? []).some((m) => m.gmail === gmail));
    const memberRooms = rooms.filter(isMember);
    const hostOnlyRooms = rooms.filter((r) => r.hostGmail === gmail && !isMember(r));

    // คะแนนประเมินที่ "ได้รับ" ในห้องที่ผู้ใช้เป็นสมาชิกทีมเอง
    const memberEvals = memberRooms.length
      ? await PeerEvaluation.find(
          { toGmail: gmail, roomId: { $in: memberRooms.map((r) => r.roomId) } },
          { roomId: 1, scores: 1, _id: 0 }
        ).lean<{ roomId: string; scores: Record<CriteriaKey, number> }[]>()
      : [];

    // ห้องที่เป็นแค่เจ้าของกิจกรรม: ไม่มีผลประเมิน "ส่วนตัว" ของ host ให้ดู จึงรวมคะแนนของ "ทุกคน" ในห้องเป็นภาพรวมแทน
    // ดึง groupId มาด้วยเพื่อสรุปผลแยกรายทีมได้ (ยังคงเป็นค่าเฉลี่ยของทีม ไม่ใช่รายคน — ไม่ขัดกับ anonymity ของ trimOutliers)
    const hostEvals = hostOnlyRooms.length
      ? await PeerEvaluation.find(
          { roomId: { $in: hostOnlyRooms.map((r) => r.roomId) } },
          { roomId: 1, groupId: 1, scores: 1, _id: 0 }
        ).lean<{ roomId: string; groupId: number; scores: Record<CriteriaKey, number> }[]>()
      : [];

    const groupByRoom = (list: { roomId: string; scores: Record<CriteriaKey, number> }[]) => {
      const map = new Map<string, Record<CriteriaKey, number>[]>();
      for (const e of list) {
        const bucket = map.get(e.roomId) ?? [];
        bucket.push(e.scores);
        map.set(e.roomId, bucket);
      }
      return map;
    };
    // คะแนนเฉลี่ยรวมของผู้ใช้เอง ข้ามทุกห้องที่เคยเป็นสมาชิก — ใช้ตรรกะเฉลี่ยเดียวกับต่อห้อง (summarizeScores)
    // เพื่อไม่ให้เลขตัวใหญ่ด้านบนกับเลขรายห้องด้านล่างคำนวณคนละแบบกัน
    const overall = summarizeScores(memberEvals.map((e) => e.scores));

    const memberEvalsByRoom = groupByRoom(memberEvals);
    const hostEvalsByRoom = groupByRoom(hostEvals);

    const hostEvalsByRoomAndGroup = new Map<string, Record<CriteriaKey, number>[]>();
    for (const e of hostEvals) {
      const key = `${e.roomId}:${e.groupId}`;
      const bucket = hostEvalsByRoomAndGroup.get(key) ?? [];
      bucket.push(e.scores);
      hostEvalsByRoomAndGroup.set(key, bucket);
    }

    // MBTI type ของสมาชิกทุกคนในห้องที่ host คุม — ใช้สรุปความหลากหลายรายทีม (aggregate เท่านั้น ไม่โชว์รายคน)
    const memberTypesByRoom = new Map<string, Record<string, { code?: string }>>();
    for (const room of hostOnlyRooms) {
      const allMembers = (room.matchedGroups ?? []).flatMap((g) => g.members ?? []);
      if (allMembers.length === 0) continue;
      memberTypesByRoom.set(room.roomId, await fetchMemberTypes(room.template ?? 'programming', allMembers));
    }

    // types ทั้งหมดที่ผู้ใช้เคยทำแบบทดสอบไว้ (เก็บใน User.types เป็น { [template]: { code, ... } })
    const userDoc = await User.findOne({ gmail }, { types: 1 }).lean<{ types?: Record<string, { code?: string }> }>();
    const types = userDoc?.types ?? {};

    const memberProjects = memberRooms.map((room) => {
      const group = (room.matchedGroups ?? []).find((g) => (g.members ?? []).some((m) => m.gmail === gmail));
      const tableKey = resolveTableKey(room.template ?? 'programming');
      const code = types[tableKey]?.code ?? null;
      const info = code ? TYPE_TABLES[tableKey][code] : null;

      return {
        roomId: room.roomId,
        title: room.title,
        template: tableKey,
        ended: isRoomEnded(room),
        matchedAt: room.matchedAt ? new Date(room.matchedAt).toISOString() : null,
        teamName: group?.name ?? null,
        mbti: code ? { code, title: info?.title ?? '', jobs: info?.jobs ?? [] } : null,
        isLeader: !!group && group.leaderId === sessionUser.name,
        isHostView: false,
        teamCount: null as number | null,
        memberCount: null as number | null,
        evaluation: summarizeScores(memberEvalsByRoom.get(room.roomId) ?? []),
        teams: null as HostTeamSummary[] | null,
      };
    });

    const hostProjects = hostOnlyRooms.map((room) => {
      const groups = room.matchedGroups ?? [];
      const tableKey = resolveTableKey(room.template ?? 'programming');
      const typesByName = memberTypesByRoom.get(room.roomId) ?? {};
      const targetComposition = room.typeComposition ?? {};

      const teams: HostTeamSummary[] = groups.map((g) => {
        const typeCounts: Record<string, number> = {};
        for (const member of g.members ?? []) {
          const code = typesByName[memberKey(member)]?.code;
          const categoryKey = code ? categoryKeyForCode(tableKey, code) : null;
          const key = categoryKey ?? 'ไม่ระบุ';
          typeCounts[key] = (typeCounts[key] ?? 0) + 1;
        }
        return {
          id: g.id,
          name: g.name,
          memberCount: (g.members ?? []).length,
          avgEvaluation: summarizeScores(hostEvalsByRoomAndGroup.get(`${room.roomId}:${g.id}`) ?? []).overall,
          typeCounts,
          members: (g.members ?? []).map((m) => ({
            name: m.name,
            avatarSeed: m.avatarSeed ?? 1,
            avatarImage: m.avatarImage ?? null,
          })),
          leaderName: g.leaderId ?? null,
        };
      });

      // อัตราการทำแบบประเมินของห้อง: จำนวนแบบประเมินที่ส่งจริง เทียบกับจำนวนคู่ที่ "ควร" เกิดขึ้น
      // (ทุกคนในทีมประเมินเพื่อนร่วมทีมทุกคน ไม่รวมตัวเอง)
      const roomExpectedEvals = groups.reduce((sum, g) => sum + expectedEvalPairs((g.members ?? []).length), 0);
      const roomDoneEvals = (hostEvalsByRoom.get(room.roomId) ?? []).length;
      const evalCompletion: EvalCompletion = {
        done: roomDoneEvals,
        total: roomExpectedEvals,
        rate: roomExpectedEvals > 0 ? Math.round((roomDoneEvals / roomExpectedEvals) * 100) : null,
      };

      return {
        roomId: room.roomId,
        title: room.title,
        template: tableKey,
        ended: isRoomEnded(room),
        matchedAt: room.matchedAt ? new Date(room.matchedAt).toISOString() : null,
        teamName: null,
        mbti: null,
        isLeader: false,
        isHostView: true,
        teamCount: groups.length,
        memberCount: groups.reduce((sum, g) => sum + (g.members ?? []).length, 0),
        evaluation: summarizeScores(hostEvalsByRoom.get(room.roomId) ?? []),
        evalCompletion,
        teams,
        typeComposition: Object.keys(targetComposition).length ? targetComposition : null,
      };
    });

    // เรียงห้องที่จบแล้วขึ้นก่อน จากนั้นค่อยเรียงตามลำดับ updatedAt เดิมของ query
    const order = new Map(rooms.map((r, i) => [r.roomId, i]));
    const projects = [...memberProjects, ...hostProjects].sort(
      (a, b) =>
        Number(b.ended) - Number(a.ended) ||
        (order.get(a.roomId) ?? 0) - (order.get(b.roomId) ?? 0)
    );

    return NextResponse.json({ profile, overall, projects, hostOverview });
  } catch (err) {
    console.error('GET /api/summary failed:', err);
    return NextResponse.json({ projects: [], error: 'โหลดสรุปผลไม่สำเร็จ' }, { status: 500 });
  }
}