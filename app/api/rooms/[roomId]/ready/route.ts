import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';

// POST /api/rooms/:roomId/ready → toggle ready status
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const { roomId } = await params;
  const { userName, isReady } = await req.json();

  const room = await Room.findOne({ roomId });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  if (isReady) {
    if (!room.readyUsers.includes(userName)) room.readyUsers.push(userName);
  } else {
    room.readyUsers = room.readyUsers.filter((n: string) => n !== userName);
  }
  await room.save();

  return NextResponse.json({ readyUsers: room.readyUsers });
}
