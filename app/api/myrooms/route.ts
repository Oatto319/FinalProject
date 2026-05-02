import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';

// GET /api/myrooms?userName=xxx → rooms that user joined or hosted
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userName = searchParams.get('userName');
    if (!userName) return NextResponse.json({ rooms: [] });

    const rooms = await Room.find({
      $or: [
        { hostName: userName },
        { 'members.name': userName },
      ],
    }).sort({ createdAt: -1 });

    return NextResponse.json({ rooms: rooms.map((r) => r.toObject()) });
  } catch (err) {
    console.error('[myrooms] DB error:', err);
    return NextResponse.json({ rooms: [], error: 'DB error' }, { status: 500 });
  }
}
