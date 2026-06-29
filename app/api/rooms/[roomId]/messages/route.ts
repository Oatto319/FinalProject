import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Message, Room } from '@/lib/models';
import { getSessionUser, isGroupMember } from '@/lib/auth';

interface MatchedGroupLike { id: number; members: { name: string; gmail?: string }[]; }

async function requireGroupMembership(roomId: string, groupId: number, caller: { gmail: string; name: string }) {
  const room = await Room.findOne({ roomId }, { matchedGroups: 1 });
  if (!room) return { ok: false as const, status: 404, error: 'Room not found' };
  const group: MatchedGroupLike | undefined = (room.matchedGroups ?? []).find((g: { id: number }) => g.id === groupId);
  if (!group || !isGroupMember(caller, group)) return { ok: false as const, status: 403, error: 'Forbidden' };
  return { ok: true as const };
}

// GET /api/rooms/:roomId/messages?groupId=1 → get messages for a specific group (members of that group only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roomId } = await params;
  const groupId = req.nextUrl.searchParams.get('groupId');
  if (groupId === null) return NextResponse.json({ error: 'groupId required' }, { status: 400 });

  const check = await requireGroupMembership(roomId, Number(groupId), { gmail: sessionUser.gmail, name: sessionUser.name });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const messages = await Message.find({ roomId, groupId: Number(groupId) }).sort({ createdAt: 1 });
  return NextResponse.json({ messages });
}

const MAX_MSG_LENGTH = 2000;

// POST /api/rooms/:roomId/messages → send a message as the session user (body must include groupId)
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roomId } = await params;
  const { groupId, text, time, avatarSeed, avatarImage } = await req.json();

  if (!text || groupId === undefined) {
    return NextResponse.json({ error: 'text, groupId required' }, { status: 400 });
  }
  if (typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'text must be non-empty string' }, { status: 400 });
  }

  const check = await requireGroupMembership(roomId, Number(groupId), { gmail: sessionUser.gmail, name: sessionUser.name });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const safeText = text.slice(0, MAX_MSG_LENGTH);
  const msg = await Message.create({
    roomId, groupId, sender: sessionUser.name, text: safeText,
    time: time ?? new Date().toISOString(), avatarSeed: avatarSeed ?? sessionUser.avatarSeed ?? 0,
    avatarImage: avatarImage ?? sessionUser.avatarImage ?? null,
  });
  return NextResponse.json({ message: msg.toObject() }, { status: 201 });
}
