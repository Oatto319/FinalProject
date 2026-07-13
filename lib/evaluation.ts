import { Room, PeerEvaluation } from './models';
import { isRoomEnded } from './room-status';

export interface PendingEvaluationTeammate {
  name: string;
  gmail: string;
  avatarSeed: number;
  avatarImage?: string | null;
}

export interface PendingEvaluationRoom {
  roomId: string;
  roomTitle: string;
  groupId: number;
  teammates: PendingEvaluationTeammate[];
}

interface MatchedGroupMemberLike { name: string; gmail?: string; avatarSeed?: number; avatarImage?: string | null; }
interface MatchedGroupLike { id: number; members: MatchedGroupMemberLike[]; }
interface RoomLike {
  roomId: string;
  title: string;
  matchDone?: boolean;
  deadline?: Date | string | null;
  matchedAt?: Date | string | null;
  endedManually?: boolean;
  matchedGroups?: MatchedGroupLike[];
}

/** ห้องที่จบแล้วและยังมีเพื่อนร่วมกลุ่มที่ยังไม่ได้ประเมิน — ใช้บล็อกการสร้าง/เข้าร่วมห้องใหม่ */
export async function getPendingEvaluations(gmail: string): Promise<PendingEvaluationRoom[]> {
  const rooms = await Room.find({ matchDone: true, 'matchedGroups.members.gmail': gmail }).lean<RoomLike[]>();

  const pending: PendingEvaluationRoom[] = [];

  for (const room of rooms) {
    if (!isRoomEnded(room)) continue;

    const group = (room.matchedGroups ?? []).find((g) => g.members.some((m) => m.gmail === gmail));
    if (!group) continue;

    const teammates = group.members.filter((m) => m.gmail && m.gmail !== gmail);
    if (teammates.length === 0) continue;

    const done = await PeerEvaluation.find(
      { roomId: room.roomId, fromGmail: gmail, toGmail: { $in: teammates.map((m) => m.gmail) } },
      { toGmail: 1, _id: 0 }
    ).lean<{ toGmail: string }[]>();
    const doneSet = new Set(done.map((d) => d.toGmail));

    const remaining = teammates.filter((m) => !doneSet.has(m.gmail!));
    if (remaining.length > 0) {
      pending.push({
        roomId: room.roomId,
        roomTitle: room.title,
        groupId: group.id,
        teammates: remaining.map((m) => ({
          name: m.name,
          gmail: m.gmail!,
          avatarSeed: m.avatarSeed ?? 0,
          avatarImage: m.avatarImage ?? null,
        })),
      });
    }
  }

  return pending;
}
