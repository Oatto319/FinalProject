import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Message } from '@/lib/models';

// GET /api/rooms/:roomId/messages?groupId=1 → get messages for a specific group
export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const { roomId } = await params;
  const groupId = req.nextUrl.searchParams.get('groupId');
  const filter: Record<string, unknown> = { roomId };
  if (groupId !== null) filter.groupId = Number(groupId);
  const messages = await Message.find(filter).sort({ createdAt: 1 });
  return NextResponse.json({ messages });
}

const MAX_MSG_LENGTH = 2000;

// POST /api/rooms/:roomId/messages → send message (body must include groupId)
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const { roomId } = await params;
  const { groupId, sender, text, time, avatarSeed } = await req.json();

  if (!sender || !text || groupId === undefined) {
    return NextResponse.json({ error: 'sender, text, groupId required' }, { status: 400 });
  }
  if (typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'text must be non-empty string' }, { status: 400 });
  }
  const safeText = text.slice(0, MAX_MSG_LENGTH);

  const msg = await Message.create({ roomId, groupId, sender, text: safeText, time: time ?? new Date().toISOString(), avatarSeed: avatarSeed ?? 0 });
  return NextResponse.json({ message: msg.toObject() }, { status: 201 });
}
