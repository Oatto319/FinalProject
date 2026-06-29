export const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';

const SEEN_KEY_PREFIX = 'matchSeen:';

export function notificationsEnabled(): boolean {
  return localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== 'false';
}

export function isMatchSeen(roomId: string): boolean {
  return localStorage.getItem(SEEN_KEY_PREFIX + roomId) === '1';
}

/** Call when a user actually views a matched room's results so the navbar badge clears. */
export function markMatchSeen(roomId: string): void {
  localStorage.setItem(SEEN_KEY_PREFIX + roomId, '1');
}
