import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';

// POST /api/rooms → create room
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const room = await Room.create(body);
  return NextResponse.json({ room: room.toObject() }, { status: 201 });
}
