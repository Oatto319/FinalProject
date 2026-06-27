import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';
import { getSessionUser } from '@/lib/auth';

// POST /api/rooms → create room (host identity comes from the session, not the body)
export async function POST(req: NextRequest) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { roomId, title, description, totalMembers, groupSize, template, matchMode } = body;
  if (!roomId || !title) return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });

  try {
    const room = await Room.create({
      roomId, title, description, totalMembers, groupSize, template, matchMode,
      hostName: sessionUser.name,
      hostGmail: sessionUser.gmail,
      hostAvatarSeed: sessionUser.avatarSeed,
    });
    return NextResponse.json({ room: room.toObject() }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'Room ID นี้ถูกใช้ไปแล้ว กรุณาลองใหม่' }, { status: 409 });
    }
    throw err;
  }
}
