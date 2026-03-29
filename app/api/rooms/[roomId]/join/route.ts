import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';

// POST /api/rooms/:roomId/join → add member to room
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const { roomId } = await params;
  const member = await req.json(); // { name, avatarSeed, gmail }

  const room = await Room.findOne({ roomId });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const alreadyIn = room.members.some((m: { name: string }) => m.name === member.name);
  if (!alreadyIn) {
    room.members.push(member);
    await room.save();
  }

  return NextResponse.json({ room: room.toObject() });
}
