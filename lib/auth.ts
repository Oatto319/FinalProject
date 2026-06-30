import { randomBytes, createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { connectDB } from './mongodb';
import { User } from './models';

export const SESSION_COOKIE = 'session';

export function createSessionToken(): string {
  return randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export { hashToken };

export async function getSessionUser(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  await connectDB();
  return User.findOne({ sessionToken: hashToken(token) });
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
