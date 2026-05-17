import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';

// POST /api/rooms → create room
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { roomId, title, description, totalMembers, groupSize, template, hostName, hostAvatarSeed, matchMode } = body;
  if (!roomId || !title || !hostName) return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
  const room = await Room.create({ roomId, title, description, totalMembers, groupSize, template, hostName, hostAvatarSeed, matchMode });
  return NextResponse.json({ room: room.toObject() }, { status: 201 });
}
