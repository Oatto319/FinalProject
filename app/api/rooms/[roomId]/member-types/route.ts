import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room, User } from '@/lib/models';
import { getSessionUser, isRoomHost, isRoomMember } from '@/lib/auth';

const LABEL_TO_ID: Record<string, string> = {
  'programming': 'programming',
  'service': 'service',
  'customer / service': 'service',
  'presentation': 'presentation',
  'design': 'design',
  'design / creative': 'design',
};

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

  const rawTemplate = (room.template ?? 'programming').toLowerCase();
  const templateKey = LABEL_TO_ID[rawTemplate] ?? rawTemplate;

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

  const types: Record<string, { code: string; title: string; icon: string; description: string; jobs: string[]; typeScores: { title: string; icon: string; score: number }[] }> = {};

  // Batch fetch — 1-2 queries แทน N queries
  const gmails  = allMembers.filter((m) => m.gmail).map((m) => m.gmail!.toLowerCase());
  const names   = allMembers.filter((m) => !m.gmail).map((m) => m.name);

  const [usersByGmail, usersByName] = await Promise.all([
    gmails.length ? User.find({ gmail: { $in: gmails } }) : Promise.resolve([]),
    names.length  ? User.find({ name:  { $in: names  } }) : Promise.resolve([]),
  ]);

  const gmailMap = new Map(usersByGmail.map((u: { gmail: string; toObject: () => Record<string, unknown> }) => [u.gmail, u.toObject()]));
  const nameMap  = new Map(usersByName.map((u:  { name:  string; toObject: () => Record<string, unknown> }) => [u.name,  u.toObject()]));

  for (const member of allMembers) {
    const userData = member.gmail ? gmailMap.get(member.gmail.toLowerCase()) : nameMap.get(member.name);
    if (!userData) continue;

    const userTypes = (userData.types as Record<string, unknown>) ?? {};
    const typeResult = userTypes[templateKey];

    if (typeResult && (typeResult as { icon?: string }).icon) {
      const t = typeResult as { code: string; title: string; icon: string; description?: string; jobs?: string[]; typeScores?: { title: string; icon: string; score: number }[] };
      types[member.name] = {
        code: t.code,
        title: t.title,
        icon: t.icon,
        description: t.description ?? '',
        jobs: t.jobs ?? [],
        typeScores: t.typeScores ?? [],
      };
    }
  }

  return NextResponse.json({ types });
}
