import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room, User } from '@/lib/models';
import { getSessionUser, isRoomHost, isGroupMember } from '@/lib/auth';
import { dateStringToUtcDate } from '@/lib/date';

interface RoomMemberLike { name: string; gmail?: string; }
interface MatchedGroupLike { id: number; name: string; members: RoomMemberLike[]; leaderId?: string; leaderConfirmedBy?: string[]; }

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;
const TEAM_NAME_MAX_LENGTH = 50;

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

  // Fetch latest avatarSeed/avatarImage for all members + host in one go
  const [users, hostUser] = await Promise.all([
    gmails.length > 0 ? User.find({ gmail: { $in: gmails } }, { gmail: 1, avatarSeed: 1, avatarImage: 1, _id: 0 }) : Promise.resolve([]),
    User.findOne({ name: roomObj.hostName }, { avatarSeed: 1, avatarImage: 1, _id: 0 }),
  ]);

  const seedMap = new Map<string, number>(
    (users as { gmail: string; avatarSeed: number }[]).map((u) => [u.gmail, u.avatarSeed])
  );
  const imageMap = new Map<string, string | null>(
    (users as { gmail: string; avatarImage: string | null }[]).map((u) => [u.gmail, u.avatarImage])
  );

  // Patch members
  if (roomObj.members) {
    roomObj.members = roomObj.members.map((m: { gmail: string; avatarSeed: number; avatarImage?: string | null }) => ({
      ...m,
      avatarSeed: seedMap.get(m.gmail) ?? m.avatarSeed,
      avatarImage: imageMap.has(m.gmail) ? imageMap.get(m.gmail) : m.avatarImage,
    }));
  }

  // Patch matchedGroups members
  if (roomObj.matchedGroups) {
    roomObj.matchedGroups = roomObj.matchedGroups.map((g: { members: { gmail: string; avatarSeed: number; avatarImage?: string | null }[] }) => ({
      ...g,
      members: g.members.map((m) => ({
        ...m,
        avatarSeed: seedMap.get(m.gmail) ?? m.avatarSeed,
        avatarImage: imageMap.has(m.gmail) ? imageMap.get(m.gmail) : m.avatarImage,
      })),
    }));
  }

  // Patch host
  if (hostUser) {
    roomObj.hostAvatarSeed = (hostUser as { avatarSeed: number }).avatarSeed;
    roomObj.hostAvatarImage = (hostUser as { avatarImage: string | null }).avatarImage;
  }

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
      if (body.title !== undefined && String(body.title).length > TITLE_MAX_LENGTH) {
        return NextResponse.json({ error: `ชื่อห้องต้องไม่เกิน ${TITLE_MAX_LENGTH} ตัวอักษร` }, { status: 400 });
      }
      if (body.description !== undefined && String(body.description).length > DESCRIPTION_MAX_LENGTH) {
        return NextResponse.json({ error: `รายละเอียดต้องไม่เกิน ${DESCRIPTION_MAX_LENGTH} ตัวอักษร` }, { status: 400 });
      }
      if (body.deadline !== undefined && body.deadline !== null) {
        if (typeof body.deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.deadline)) {
          return NextResponse.json({ error: 'วันสิ้นสุดไม่ถูกต้อง' }, { status: 400 });
        }
        body.deadline = dateStringToUtcDate(body.deadline);
      }
      const patch: Record<string, unknown> = {};
      for (const key of ['title', 'description', 'matchMode', 'typeComposition', 'deadline'] as const) {
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

      // Build a whitelist of valid members from the authoritative room.members list
      const validMembers = new Map<string, { name: string; avatarSeed: number; avatarImage?: string | null; gmail: string }>(
        (room.members ?? []).map((m: { gmail: string; name: string; avatarSeed: number; avatarImage?: string | null }) => [m.gmail, m])
      );

      // Sanitize each group: only keep fields we control, reject unknown members
      type RawMember = { gmail?: unknown; role?: unknown };
      const sanitizedGroups = matchedGroups.map((g: { id: unknown; name: unknown; members?: RawMember[] }) => ({
        id: Number(g.id),
        name: String(g.name ?? '').slice(0, TEAM_NAME_MAX_LENGTH),
        members: (Array.isArray(g.members) ? g.members as RawMember[] : [])
          .filter((m) => typeof m.gmail === 'string' && validMembers.has(m.gmail))
          .map((m) => ({
            ...validMembers.get(m.gmail as string)!,
            role: typeof m.role === 'string' ? m.role.slice(0, 50) : 'ไม่ระบุ',
          })),
      }));

      const patch: Record<string, unknown> = { matchedGroups: sanitizedGroups, matchDone: true, matchedAt: new Date() };
      if (matchMode) patch.matchMode = matchMode;
      const updated = await Room.findOneAndUpdate({ roomId }, { $set: patch }, { returnDocument: 'after' });
      return NextResponse.json({ room: updated!.toObject() });
    }

    case 'endActivity': {
      if (!isRoomHost(caller, room)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (!room.matchDone) return NextResponse.json({ error: 'ยังไม่ได้จับกลุ่ม ไม่สามารถจบกิจกรรมได้' }, { status: 400 });
      const updated = await Room.findOneAndUpdate({ roomId }, { $set: { endedManually: true } }, { returnDocument: 'after' });
      return NextResponse.json({ room: updated!.toObject() });
    }

    case 'vote': {
      const { groupId, targetName } = body;
      if (typeof groupId !== 'number' || typeof targetName !== 'string' || !targetName.trim()) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      }
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
      const winner = entries.length > 0 ? entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0] : targetName;

      // เปลี่ยนตัวหัวหน้าทีม → ต้องให้สมาชิกยืนยันใหม่ทั้งหมด
      const votePatch: Record<string, unknown> = { 'matchedGroups.$[g].leaderId': winner };
      if (winner !== group.leaderId) votePatch['matchedGroups.$[g].leaderConfirmedBy'] = [];
      const final = await Room.findOneAndUpdate(
        { roomId },
        { $set: votePatch },
        { arrayFilters: [{ 'g.id': groupId }], returnDocument: 'after' }
      );
      return NextResponse.json({ room: final!.toObject() });
    }

    case 'setLeader': {
      const { groupId, leaderName } = body;
      if (typeof groupId !== 'number' || typeof leaderName !== 'string' || !leaderName.trim()) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      }
      const group: MatchedGroupLike | undefined = (room.matchedGroups ?? []).find((g: { id: number }) => g.id === groupId);
      if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      if (!isGroupMember(caller, group)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (!group.members.some((m) => m.name === leaderName)) {
        return NextResponse.json({ error: 'Invalid leader' }, { status: 400 });
      }
      const setLeaderPatch: Record<string, unknown> = { 'matchedGroups.$[g].leaderId': leaderName };
      if (leaderName !== group.leaderId) setLeaderPatch['matchedGroups.$[g].leaderConfirmedBy'] = [];
      const updated = await Room.findOneAndUpdate(
        { roomId },
        { $set: setLeaderPatch },
        { arrayFilters: [{ 'g.id': groupId }], returnDocument: 'after' }
      );
      return NextResponse.json({ room: updated!.toObject() });
    }

    case 'confirmLeader': {
      const { groupId } = body;
      if (typeof groupId !== 'number') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      const group: MatchedGroupLike | undefined = (room.matchedGroups ?? []).find((g: { id: number }) => g.id === groupId);
      if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      if (!isGroupMember(caller, group)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (!group.leaderId) return NextResponse.json({ error: 'ยังไม่มีหัวหน้าทีมให้ยืนยัน' }, { status: 400 });
      const updated = await Room.findOneAndUpdate(
        { roomId },
        { $addToSet: { 'matchedGroups.$[g].leaderConfirmedBy': sessionUser.name } },
        { arrayFilters: [{ 'g.id': groupId }], returnDocument: 'after' }
      );
      return NextResponse.json({ room: updated!.toObject() });
    }

    case 'renameTeam': {
      const { groupId, name } = body;
      if (typeof groupId !== 'number' || typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'name required' }, { status: 400 });
      }
      if (name.trim().length > TEAM_NAME_MAX_LENGTH) {
        return NextResponse.json({ error: `ชื่อทีมต้องไม่เกิน ${TEAM_NAME_MAX_LENGTH} ตัวอักษร` }, { status: 400 });
      }
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

    case 'kickMember': {
      if (!isRoomHost(caller, room)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (room.matchDone) return NextResponse.json({ error: 'จับกลุ่มไปแล้ว ไม่สามารถเอาสมาชิกออกได้' }, { status: 400 });
      const { memberGmail } = body;
      if (typeof memberGmail !== 'string' || !memberGmail.trim()) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      }
      if (memberGmail === room.hostGmail) {
        return NextResponse.json({ error: 'ไม่สามารถเอาผู้สร้างห้องออกจากห้องได้' }, { status: 400 });
      }
      const target: RoomMemberLike | undefined = (room.members ?? []).find((m: { gmail?: string }) => m.gmail === memberGmail);
      if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      const updated = await Room.findOneAndUpdate(
        { roomId },
        { $pull: { members: { gmail: memberGmail }, readyUsers: target.name } },
        { returnDocument: 'after' }
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
