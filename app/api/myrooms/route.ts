import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';
import { getSessionUser } from '@/lib/auth';

// GET /api/myrooms → rooms the session user joined or hosted
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) return NextResponse.json({ rooms: [] }, { status: 401 });

    const rooms = await Room.find({
      $or: [
        { hostName: sessionUser.name },
        { 'members.name': sessionUser.name },
        { 'members.gmail': sessionUser.gmail },
      ],
    })
      .select('roomId title description totalMembers groupSize template hostName hostAvatarSeed members matchDone matchMode createdAt')
      .sort({ createdAt: -1 });
    return NextResponse.json({ rooms: rooms.map((r) => r.toObject()) });
  } catch (err) {
    console.error('[myrooms] DB error:', err);
    return NextResponse.json({ rooms: [], error: 'DB error' }, { status: 500 });
  }
}
