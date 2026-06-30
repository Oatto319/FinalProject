export const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';

const MATCH_SEEN_PREFIX = 'matchSeen:';
const MSG_SEEN_PREFIX = 'msgSeen:';

export function notificationsEnabled(): boolean {
  return localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== 'false';
}

// --- Match seen ---
export function isMatchSeen(roomId: string): boolean {
  return localStorage.getItem(MATCH_SEEN_PREFIX + roomId) === '1';
}

export function markMatchSeen(roomId: string): void {
  localStorage.setItem(MATCH_SEEN_PREFIX + roomId, '1');
}

// --- Message seen ---
export function getLastSeenMsg(roomId: string, groupId: number): string | null {
  return localStorage.getItem(`${MSG_SEEN_PREFIX}${roomId}:${groupId}`);
}

export function markMsgSeen(roomId: string, groupId: number, msgTime: string): void {
  localStorage.setItem(`${MSG_SEEN_PREFIX}${roomId}:${groupId}`, msgTime);
}

export function isMsgNew(roomId: string, groupId: number, msgTime: string): boolean {
  const seen = getLastSeenMsg(roomId, groupId);
  if (!seen) return true;
  return msgTime !== seen;
}
