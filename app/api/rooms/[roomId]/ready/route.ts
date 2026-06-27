import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';
import { getSessionUser } from '@/lib/auth';

// POST /api/rooms/:roomId/ready → toggle the session user's ready status
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roomId } = await params;
  const { isReady } = await req.json();

  const filter = { roomId, 'members.gmail': sessionUser.gmail };
  const update = isReady
    ? { $addToSet: { readyUsers: sessionUser.name } }
    : { $pull: { readyUsers: sessionUser.name } };

  const room = await Room.findOneAndUpdate(filter, update, { new: true });
  if (!room) return NextResponse.json({ error: 'Room not found or not a member' }, { status: 403 });

  return NextResponse.json({ readyUsers: room.readyUsers });
}
