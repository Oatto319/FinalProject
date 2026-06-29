import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';
import { getSessionUser } from '@/lib/auth';

// POST /api/rooms/:roomId/join → add the session user to the room (atomic, capacity-checked)
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roomId } = await params;
  const member = { name: sessionUser.name, avatarSeed: sessionUser.avatarSeed, avatarImage: sessionUser.avatarImage, gmail: sessionUser.gmail };

  const joined = await Room.findOneAndUpdate(
    {
      roomId,
      'members.gmail': { $ne: member.gmail },
      $expr: { $lt: [{ $size: '$members' }, '$totalMembers'] },
    },
    { $push: { members: member } },
    { new: true }
  );

  if (joined) return NextResponse.json({ room: joined.toObject() });

  // Either room doesn't exist, already joined, or full — figure out which.
  const room = await Room.findOne({ roomId });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const alreadyIn = room.members.some((m: { gmail?: string }) => m.gmail === member.gmail);
  if (alreadyIn) return NextResponse.json({ room: room.toObject() });

  return NextResponse.json({ error: 'ห้องเต็มแล้ว' }, { status: 409 });
}
