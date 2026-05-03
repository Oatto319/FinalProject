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

// POST /api/rooms/:roomId/messages → send message (body must include groupId)
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const { roomId } = await params;
  const body = await req.json();
  const msg = await Message.create({ ...body, roomId });
  return NextResponse.json({ message: msg.toObject() }, { status: 201 });
}
