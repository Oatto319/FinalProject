import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';
import { getSessionUser, isRoomHost, isRoomMember } from '@/lib/auth';
import { fetchMemberTypes } from '@/lib/room-member-data';

// GET /api/rooms/:roomId/member-types?groupId=1    → types เฉพาะกลุ่มนั้น
// GET /api/rooms/:roomId/member-types              → types ทุกคนในห้อง (post-match)
// GET /api/rooms/:roomId/member-types?source=members → types ทุกคนในห้อง (pre-match, waiting)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ types: {} }, { status: 401 });

  const { roomId } = await params;
  const { searchParams } = new URL(req.url);
  const groupIdParam = searchParams.get('groupId');
  const source       = searchParams.get('source');

  const room = await Room.findOne({ roomId });
  if (!room) return NextResponse.json({ types: {} }, { status: 404 });

  const caller = { gmail: sessionUser.gmail, name: sessionUser.name };
  if (!isRoomHost(caller, room) && !isRoomMember(caller, room)) {
    return NextResponse.json({ types: {} }, { status: 403 });
  }

  let allMembers: { name: string; gmail?: string; role?: string }[];

  if (source === 'members') {
    // Pre-match: read directly from room.members
    allMembers = (room.members ?? []) as { name: string; gmail?: string; role?: string }[];
  } else {
    // Post-match: read from matchedGroups
    const groupId = groupIdParam !== null ? parseInt(groupIdParam, 10) : null;
    const allGroups: { members: { name: string; gmail?: string; role?: string }[] }[] =
      groupId !== null && !Number.isNaN(groupId)
        ? (room.matchedGroups ?? []).filter((g: { id: number }) => g.id === groupId)
        : (room.matchedGroups ?? []);
    allMembers = allGroups.flatMap((g) => g.members);
  }

  const types = await fetchMemberTypes(room.template ?? 'programming', allMembers);

  return NextResponse.json({ types });
}
