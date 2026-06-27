import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room, User } from '@/lib/models';
import { getSessionUser, isRoomHost, isGroupMember } from '@/lib/auth';

interface RoomMemberLike { name: string; gmail?: string; }
interface MatchedGroupLike { id: number; name: string; members: RoomMemberLike[]; leaderId?: string; }

// GET /api/rooms/:roomId → get room (with fresh avatarSeeds from User collection)
export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roomId } = await params;
  const room = await Room.findOne({ roomId });
  if (!room) return NextResponse.json({ room: null }, { status: 404 });

  const roomObj = room.toObject();

  // Build gmail list from members
  const gmails: string[] = (roomObj.members ?? []).map((m: { gmail: string }) => m.gmail).filter(Boolean);

  // Fetch latest avatarSeed for all members + host in one go
  const [users, hostUser] = await Promise.all([
    gmails.length > 0 ? User.find({ gmail: { $in: gmails } }, { gmail: 1, avatarSeed: 1, _id: 0 }) : Promise.resolve([]),
    User.findOne({ name: roomObj.hostName }, { avatarSeed: 1, _id: 0 }),
  ]);

  const seedMap = new Map<string, number>(
    (users as { gmail: string; avatarSeed: number }[]).map((u) => [u.gmail, u.avatarSeed])
  );

  // Patch members
  if (roomObj.members) {
    roomObj.members = roomObj.members.map((m: { gmail: string; avatarSeed: number }) => ({
      ...m,
      avatarSeed: seedMap.get(m.gmail) ?? m.avatarSeed,
    }));
  }

  // Patch matchedGroups members
  if (roomObj.matchedGroups) {
    roomObj.matchedGroups = roomObj.matchedGroups.map((g: { members: { gmail: string; avatarSeed: number }[] }) => ({
      ...g,
      members: g.members.map((m) => ({ ...m, avatarSeed: seedMap.get(m.gmail) ?? m.avatarSeed })),
    }));
  }

  // Patch host
  if (hostUser) roomObj.hostAvatarSeed = (hostUser as { avatarSeed: number }).avatarSeed;

  return NextResponse.json({ room: roomObj });
}

// PATCH /api/rooms/:roomId → mutate room state via an explicit action, each with its own authorization rule
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roomId } = await params;
  const body = await req.json();
  const { action } = body;

  const room = await Room.findOne({ roomId });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const caller = { gmail: sessionUser.gmail, name: sessionUser.name };

  switch (action) {
    case 'settings': {
      if (!isRoomHost(caller, room)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const patch: Record<string, unknown> = {};
      for (const key of ['title', 'description', 'matchMode'] as const) {
        if (body[key] !== undefined) patch[key] = body[key];
      }
      if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
      const updated = await Room.findOneAndUpdate({ roomId }, { $set: patch }, { returnDocument: 'after' });
      return NextResponse.json({ room: updated!.toObject() });
    }

    case 'match': {
      if (!isRoomHost(caller, room)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (room.matchDone) {
        // already matched — no-op so a double-click / double-mount can't wipe votes, leaders, or chat
        return NextResponse.json({ room: room.toObject() });
      }
      const { matchedGroups, matchMode } = body;
      if (!Array.isArray(matchedGroups)) return NextResponse.json({ error: 'matchedGroups required' }, { status: 400 });
      const patch: Record<string, unknown> = { matchedGroups, matchDone: true };
      if (matchMode) patch.matchMode = matchMode;
      const updated = await Room.findOneAndUpdate({ roomId }, { $set: patch }, { returnDocument: 'after' });
      return NextResponse.json({ room: updated!.toObject() });
    }

    case 'vote': {
      const { groupId, targetName } = body;
      const group: MatchedGroupLike | undefined = (room.matchedGroups ?? []).find((g: { id: number }) => g.id === groupId);
      if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      if (!isGroupMember(caller, group)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (!group.members.some((m) => m.name === targetName)) {
        return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
      }

      const groupKey = String(groupId);
      const afterVote = await Room.findOneAndUpdate(
        { roomId },
        { $set: { [`votes.${groupKey}.${sessionUser.name}`]: targetName } },
        { returnDocument: 'after' }
      );
      if (!afterVote) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

      // recompute the leader for this group from the up-to-date tally
      const votesForGroup: Record<string, string> = afterVote.votes?.[groupKey] ?? {};
      const tally: Record<string, number> = {};
      Object.values(votesForGroup).forEach((n) => { tally[n] = (tally[n] ?? 0) + 1; });
      const entries = Object.entries(tally);
      const winner = entries.length > 0 ? entries.reduce((a, b) => (b[1] >= a[1] ? b : a))[0] : targetName;

      const final = await Room.findOneAndUpdate(
        { roomId },
        { $set: { 'matchedGroups.$[g].leaderId': winner } },
        { arrayFilters: [{ 'g.id': groupId }], returnDocument: 'after' }
      );
      return NextResponse.json({ room: final!.toObject() });
    }

    case 'setLeader': {
      const { groupId, leaderName } = body;
      const group: MatchedGroupLike | undefined = (room.matchedGroups ?? []).find((g: { id: number }) => g.id === groupId);
      if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      if (!isGroupMember(caller, group)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (!group.members.some((m) => m.name === leaderName)) {
        return NextResponse.json({ error: 'Invalid leader' }, { status: 400 });
      }
      const updated = await Room.findOneAndUpdate(
        { roomId },
        { $set: { 'matchedGroups.$[g].leaderId': leaderName } },
        { arrayFilters: [{ 'g.id': groupId }], returnDocument: 'after' }
      );
      return NextResponse.json({ room: updated!.toObject() });
    }

    case 'renameTeam': {
      const { groupId, name } = body;
      if (!name || !String(name).trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });
      const group: MatchedGroupLike | undefined = (room.matchedGroups ?? []).find((g: { id: number }) => g.id === groupId);
      if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      if (!isGroupMember(caller, group)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const updated = await Room.findOneAndUpdate(
        { roomId },
        { $set: { 'matchedGroups.$[g].name': String(name).trim() } },
        { arrayFilters: [{ 'g.id': groupId }], returnDocument: 'after' }
      );
      return NextResponse.json({ room: updated!.toObject() });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

// DELETE /api/rooms/:roomId → delete room (host only, verified via session)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roomId } = await params;
  const room = await Room.findOne({ roomId });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (!isRoomHost({ gmail: sessionUser.gmail, name: sessionUser.name }, room)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await Room.deleteOne({ roomId });
  return NextResponse.json({ ok: true });
}
