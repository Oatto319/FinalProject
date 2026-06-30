import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room, Message } from '@/lib/models';
import { getSessionUser } from '@/lib/auth';

export interface ApiNotification {
  type: 'match' | 'message';
  roomId: string;
  roomTitle: string;
  isHost: boolean;
  groupId?: number;
  sender?: string;
  text?: string;
  msgTime?: string;
}

export async function GET(req: NextRequest) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { gmail, name } = sessionUser;

  const rooms = await Room.find(
    { $or: [{ 'members.gmail': gmail }, { hostGmail: gmail }] },
    { roomId: 1, title: 1, matchDone: 1, matchedGroups: 1, hostGmail: 1 },
  ).sort({ updatedAt: -1 }).limit(20).lean();

  const result: ApiNotification[] = [];

  for (const room of rooms as any[]) {
    if (!room.matchDone) continue;

    const isHost = room.hostGmail === gmail;

    result.push({ type: 'match', roomId: room.roomId, roomTitle: room.title, isHost });

    if (!isHost && room.matchedGroups?.length) {
      const myGroup = (room.matchedGroups as any[]).find((g) =>
        (g.members ?? []).some((m: any) => (m.gmail ? m.gmail === gmail : m.name === name)),
      );
      if (myGroup) {
        const lastMsg = await Message.findOne(
          { roomId: room.roomId, groupId: myGroup.id },
          { sender: 1, text: 1, time: 1, createdAt: 1 },
          { sort: { createdAt: -1 } },
        ).lean();
        if (lastMsg) {
          const m = lastMsg as any;
          result.push({
            type: 'message',
            roomId: room.roomId,
            roomTitle: room.title,
            isHost: false,
            groupId: myGroup.id,
            sender: m.sender,
            text: m.text,
            msgTime: m.time ?? m.createdAt?.toISOString?.() ?? undefined,
          });
        }
      }
    }
  }

  return NextResponse.json({ notifications: result });
}
