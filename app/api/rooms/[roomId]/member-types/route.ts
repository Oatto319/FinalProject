import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room, User } from '@/lib/models';

const LABEL_TO_ID: Record<string, string> = {
  'programming': 'programming',
  'service': 'service',
  'customer / service': 'service',
  'presentation': 'presentation',
  'design': 'design',
  'design / creative': 'design',
};

// GET /api/rooms/:roomId/member-types?groupId=1   → types เฉพาะกลุ่มนั้น
// GET /api/rooms/:roomId/member-types             → types ทุกคนในห้อง (host view)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  await connectDB();
  const { roomId } = await params;
  const { searchParams } = new URL(req.url);
  const groupIdParam = searchParams.get('groupId');

  const room = await Room.findOne({ roomId });
  if (!room) return NextResponse.json({ types: {} }, { status: 404 });

  const rawTemplate = (room.template ?? 'programming').toLowerCase();
  const templateKey = LABEL_TO_ID[rawTemplate] ?? rawTemplate;

  // ถ้าระบุ groupId → ดึงเฉพาะกลุ่มนั้น, ถ้าไม่ระบุ → ดึงทุกกลุ่มในห้อง
  const allGroups: { members: { name: string; gmail?: string; role?: string }[] }[] =
    groupIdParam !== null
      ? (room.matchedGroups ?? []).filter((g: { id: number }) => g.id === parseInt(groupIdParam))
      : (room.matchedGroups ?? []);

  const allMembers = allGroups.flatMap((g) => g.members);

  const types: Record<string, { title: string; icon: string; description: string; jobs: string[] }> = {};

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
    let typeResult = userTypes[templateKey];

    // fallback: ลองดู template อื่นถ้าไม่มี template ของห้อง
    if (!typeResult) {
      typeResult = Object.values(userTypes).find((t: unknown) => (t as { icon?: string })?.icon);
    }

    if (typeResult && (typeResult as { icon?: string }).icon) {
      const t = typeResult as { title: string; icon: string; description?: string; jobs?: string[] };
      types[member.name] = {
        title: t.title,
        icon: t.icon,
        description: t.description ?? '',
        jobs: t.jobs ?? [],
      };
    }
  }

  return NextResponse.json({ types });
}
