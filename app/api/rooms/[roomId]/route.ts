import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room, User } from '@/lib/models';

// GET /api/rooms/:roomId → get room (with fresh avatarSeeds from User collection)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
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

// PATCH /api/rooms/:roomId → update room (members, readyUsers, matchDone, matchedGroups)
const ALLOWED_ROOM_PATCH_FIELDS = new Set([
  'members', 'readyUsers', 'matchDone', 'matchedGroups',
  'votes', 'matchMode', 'title', 'description',
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const { roomId } = await params;
  const body = await req.json();

  const patch: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (ALLOWED_ROOM_PATCH_FIELDS.has(key)) patch[key] = body[key];
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });

  const room = await Room.findOneAndUpdate(
    { roomId },
    { $set: patch },
    { returnDocument: 'after' }
  );
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  return NextResponse.json({ room: room.toObject() });
}

// DELETE /api/rooms/:roomId → delete room (ต้องส่ง hostName มายืนยันความเป็นเจ้าของ)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const { roomId } = await params;
  const { hostName } = await req.json().catch(() => ({})) as { hostName?: string };
  if (!hostName) return NextResponse.json({ error: 'hostName required' }, { status: 400 });
  const room = await Room.findOne({ roomId });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.hostName !== hostName) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await Room.deleteOne({ roomId });
  return NextResponse.json({ ok: true });
}
