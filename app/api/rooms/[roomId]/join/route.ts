import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';
import { getSessionUser } from '@/lib/auth';
import { getPendingEvaluations } from '@/lib/evaluation';

// POST /api/rooms/:roomId/join → add the session user to the room (atomic, capacity-checked)
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pending = await getPendingEvaluations(sessionUser.gmail);
  if (pending.length > 0) {
    return NextResponse.json(
      { error: 'มีแบบประเมินเพื่อนร่วมทีมค้างอยู่ กรุณาทำให้เสร็จก่อนเข้าร่วมห้องใหม่', pending },
      { status: 403 }
    );
  }

  const { roomId } = await params;
  const member = { name: sessionUser.name, avatarSeed: sessionUser.avatarSeed, avatarImage: sessionUser.avatarImage, gmail: sessionUser.gmail };

  const joined = await Room.findOneAndUpdate(
    {
      roomId,
      matchDone: { $ne: true },
      'members.gmail': { $ne: member.gmail },
      $expr: { $lt: [{ $size: '$members' }, '$totalMembers'] },
    },
    { $push: { members: member } },
    { new: true }
  );

  if (joined) return NextResponse.json({ room: joined.toObject() });

  // Either room doesn't exist, already joined, full, or already matched — figure out which.
  const room = await Room.findOne({ roomId });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const alreadyIn = room.members.some((m: { gmail?: string }) => m.gmail === member.gmail);
  if (alreadyIn) return NextResponse.json({ room: room.toObject() });

  if (room.matchDone) return NextResponse.json({ error: 'ห้องนี้จับกลุ่มไปแล้ว ไม่สามารถเข้าร่วมได้' }, { status: 409 });

  return NextResponse.json({ error: 'ห้องเต็มแล้ว' }, { status: 409 });
}
