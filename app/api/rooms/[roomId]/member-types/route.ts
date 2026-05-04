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

// GET /api/rooms/:roomId/member-types?groupId=1
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  await connectDB();
  const { roomId } = await params;
  const { searchParams } = new URL(req.url);
  const groupId = parseInt(searchParams.get('groupId') ?? '0');

  const room = await Room.findOne({ roomId });
  if (!room) return NextResponse.json({ types: {} }, { status: 404 });

  const rawTemplate = (room.template ?? 'programming').toLowerCase();
  const templateKey = LABEL_TO_ID[rawTemplate] ?? rawTemplate;

  const group = (room.matchedGroups ?? []).find((g: { id: number }) => g.id === groupId);
  if (!group) return NextResponse.json({ types: {} });

  const types: Record<string, { title: string; icon: string; description: string; jobs: string[] }> = {};

  await Promise.all(
    group.members.map(async (member: { name: string; gmail?: string; role?: string }) => {
      try {
        const user = member.gmail
          ? await User.findOne({ gmail: member.gmail.toLowerCase() })
          : await User.findOne({ name: member.name });

        if (!user) return;

        const userTypes = user.toObject().types ?? {};
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
      } catch {
        // ข้ามสมาชิกที่ query ไม่ได้
      }
    })
  );

  return NextResponse.json({ types });
}
