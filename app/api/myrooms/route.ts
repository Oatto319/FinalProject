import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';

// GET /api/myrooms?userName=xxx&gmail=xxx → rooms that user joined or hosted
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userName = searchParams.get('userName');
    const gmail    = searchParams.get('gmail');
    if (!userName && !gmail) return NextResponse.json({ rooms: [] });

    const orConditions: Record<string, unknown>[] = [];
    if (userName) {
      orConditions.push({ hostName: userName }, { 'members.name': userName });
    }
    if (gmail) {
      orConditions.push({ 'members.gmail': gmail.toLowerCase() });
    }

    const rooms = await Room.find({ $or: orConditions })
      .select('roomId title description totalMembers groupSize template hostName hostAvatarSeed members matchDone createdAt')
      .sort({ createdAt: -1 });
    return NextResponse.json({ rooms: rooms.map((r) => r.toObject()) });
  } catch (err) {
    console.error('[myrooms] DB error:', err);
    return NextResponse.json({ rooms: [], error: 'DB error' }, { status: 500 });
  }
}
