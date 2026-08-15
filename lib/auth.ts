import { NextRequest } from 'next/server';
import { connectDB } from './mongodb';
import { User } from './models';
import { SESSION_COOKIE } from './session-cookie';
import { verifySessionJWT } from './jwt';

export { SESSION_COOKIE };

export async function getSessionUser(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionJWT(token);
  if (!payload) return null;

  await connectDB();
  const user = await User.findOne({ gmail: payload.sub });
  if (!user) return null;

  // tokenVersion ไม่ตรง = token ถูก revoke ไปแล้ว (logout เพิ่มค่านี้ใน DB)
  if ((user.tokenVersion ?? 0) !== payload.tv) return null;

  return user;
}

export function isRoomHost(
  user: { gmail: string; name: string },
  room: { hostGmail?: string; hostName: string }
): boolean {
  return room.hostGmail ? user.gmail === room.hostGmail : user.name === room.hostName;
}

export function isRoomMember(
  user: { gmail: string; name: string },
  room: { members?: { gmail?: string; name: string }[] }
): boolean {
  // Match by gmail whenever the stored member has one — falling back to name only
  // for legacy/manual members without a gmail avoids a same-name impersonation.
  return (room.members ?? []).some((m) => (m.gmail ? m.gmail === user.gmail : m.name === user.name));
}

export function isGroupMember(
  user: { gmail: string; name: string },
  group: { members?: { gmail?: string; name: string }[] } | undefined
): boolean {
  if (!group) return false;
  return (group.members ?? []).some((m) => (m.gmail ? m.gmail === user.gmail : m.name === user.name));
}