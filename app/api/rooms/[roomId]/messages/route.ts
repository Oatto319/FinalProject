import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Message } from '@/lib/models';

// GET /api/rooms/:roomId/messages → get all messages
export async function GET(_req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const { roomId } = await params;
  const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
  return NextResponse.json({ messages });
}

// POST /api/rooms/:roomId/messages → send message
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const { roomId } = await params;
  const body = await req.json();
  const msg = await Message.create({ ...body, roomId });
  return NextResponse.json({ message: msg.toObject() }, { status: 201 });
}
