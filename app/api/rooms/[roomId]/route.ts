import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';

// GET /api/rooms/:roomId → get room
export async function GET(_req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const { roomId } = await params;
  const room = await Room.findOne({ roomId });
  if (!room) return NextResponse.json({ room: null }, { status: 404 });
  return NextResponse.json({ room: room.toObject() });
}

// PATCH /api/rooms/:roomId → update room (members, readyUsers, matchDone, matchedGroups)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const { roomId } = await params;
  const body = await req.json();
  const room = await Room.findOneAndUpdate(
    { roomId },
    { $set: body },
    { new: true }
  );
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  return NextResponse.json({ room: room.toObject() });
}

// DELETE /api/rooms/:roomId → delete room
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const { roomId } = await params;
  await Room.deleteOne({ roomId });
  return NextResponse.json({ ok: true });
}
