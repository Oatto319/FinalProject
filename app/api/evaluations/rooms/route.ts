import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room, PeerEvaluation } from '@/lib/models';
import { getSessionUser } from '@/lib/auth';
import { isRoomEnded } from '@/lib/room-status';

// GET /api/evaluations/rooms → ห้องทั้งหมดที่สิ้นสุดแล้วพร้อมสถานะการประเมิน (pending/done)
export async function GET(req: NextRequest) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ rooms: [] }, { status: 401 });

  const gmail = sessionUser.gmail.toLowerCase();

  const rawRooms = await Room.find({
    matchDone: true,
    'matchedGroups.members.gmail': gmail,
  })
    .select('roomId title description totalMembers groupSize template hostName hostAvatarSeed hostAvatarImage hostRole members matchDone matchedGroups deadline matchedAt endedManually updatedAt')
    .sort({ updatedAt: -1 })
    .lean<any[]>();

  const endedRooms = rawRooms.filter((r) => isRoomEnded(r));
  if (endedRooms.length === 0) return NextResponse.json({ rooms: [] });

  // ดึง PeerEvaluation ที่ทำไปแล้วทั้งหมดในครั้งเดียว
  const doneEvals = await PeerEvaluation.find(
    { fromGmail: gmail, roomId: { $in: endedRooms.map((r) => r.roomId) } },
    { roomId: 1, toGmail: 1, _id: 0 }
  ).lean<{ roomId: string; toGmail: string }[]>();

  const doneByRoom = new Map<string, Set<string>>();
  for (const d of doneEvals) {
    if (!doneByRoom.has(d.roomId)) doneByRoom.set(d.roomId, new Set());
    doneByRoom.get(d.roomId)!.add(d.toGmail);
  }

  const rooms = endedRooms.map((room) => {
    const group = (room.matchedGroups ?? []).find((g: any) =>
      g.members.some((m: any) => m.gmail === gmail)
    );
    const teammates = (group?.members ?? []).filter((m: any) => m.gmail && m.gmail !== gmail);
    const doneSet = doneByRoom.get(room.roomId) ?? new Set<string>();
    const evalStatus = teammates.length === 0 || teammates.every((m: any) => doneSet.has(m.gmail))
      ? 'done'
      : 'pending';

    return {
      roomId: room.roomId,
      title: room.title,
      description: room.description,
      totalMembers: room.totalMembers,
      groupSize: room.groupSize,
      template: room.template,
      hostName: room.hostName,
      hostAvatarSeed: room.hostAvatarSeed,
      hostAvatarImage: room.hostAvatarImage,
      hostRole: room.hostRole,
      members: room.members,
      matchDone: room.matchDone,
      evalStatus,
    };
  });

  return NextResponse.json({ rooms });
}
