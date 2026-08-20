import { describe, it, expect } from 'vitest';
import { isRoomEnded, EVALUATION_FALLBACK_DAYS } from './room-status';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('isRoomEnded', () => {
  it('is false when the room has not matched yet, regardless of other fields', () => {
    expect(isRoomEnded({ matchDone: false, endedManually: true })).toBe(false);
  });

  it('is true once the host ends the activity manually, even before any deadline', () => {
    expect(isRoomEnded({ matchDone: true, endedManually: true, deadline: new Date(Date.now() + DAY_MS) })).toBe(true);
  });

  it('is false before the deadline and true after it, when a deadline is set', () => {
    expect(isRoomEnded({ matchDone: true, deadline: new Date(Date.now() + DAY_MS) })).toBe(false);
    expect(isRoomEnded({ matchDone: true, deadline: new Date(Date.now() - DAY_MS) })).toBe(true);
  });

  it('deadline takes priority over the matchedAt fallback window even if the fallback would say "not ended"', () => {
    // matched just now (fallback would say "not ended"), but deadline is already in the past
    expect(isRoomEnded({
      matchDone: true,
      deadline: new Date(Date.now() - 1000),
      matchedAt: new Date(),
    })).toBe(true);
  });

  it('without a deadline, falls back to matchedAt + EVALUATION_FALLBACK_DAYS', () => {
    const justUnderFallback = new Date(Date.now() - (EVALUATION_FALLBACK_DAYS * DAY_MS - DAY_MS));
    const justOverFallback = new Date(Date.now() - (EVALUATION_FALLBACK_DAYS * DAY_MS + DAY_MS));
    expect(isRoomEnded({ matchDone: true, matchedAt: justUnderFallback })).toBe(false);
    expect(isRoomEnded({ matchDone: true, matchedAt: justOverFallback })).toBe(true);
  });

  it('uses updatedAt as the anchor for legacy rooms with no matchedAt', () => {
    const justOverFallback = new Date(Date.now() - (EVALUATION_FALLBACK_DAYS * DAY_MS + DAY_MS));
    expect(isRoomEnded({ matchDone: true, updatedAt: justOverFallback })).toBe(true);
  });

  it('is false when matched but there is no deadline, matchedAt, or updatedAt to anchor on', () => {
    expect(isRoomEnded({ matchDone: true })).toBe(false);
  });
});
