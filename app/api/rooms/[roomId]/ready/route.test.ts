import { describe, it, expect, vi } from 'vitest';
import type { NextRequest } from 'next/server';

// Regression test for a duplicate-display-name bug found by manual code review (see QA bug report
// "BUG-002: Ready status collides for room members who share a display name").
//
// readyUsers is stored as a plain array of *names* ($addToSet/$pull by sessionUser.name), not gmails.
// User.name has no unique constraint (see lib/room-member-data.ts:10 and the sibling regression suite
// in lib/room-member-data.test.ts, which fixed this exact class of bug for fetchMemberTypes /
// fetchMemberEvalScores by keying on gmail instead). The ready endpoint was never updated to match,
// so two members who happen to share a name still collide here.
//
// Marked with `it.fails` so the suite documents the known defect without turning the build red —
// flip this to a plain `it` once the fix (keying readyUsers by gmail) lands.

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn(() => true) }));

interface MockMember { name: string; gmail: string }
interface MockRoom { roomId: string; members: MockMember[]; readyUsers: string[] }

let rooms: MockRoom[] = [];

vi.mock('@/lib/models', () => ({
  Room: {
    findOneAndUpdate: vi.fn(
      (filter: { roomId: string; 'members.gmail': string }, update: { $addToSet?: { readyUsers: string }; $pull?: { readyUsers: string } }) => {
        const room = rooms.find(
          (r) => r.roomId === filter.roomId && r.members.some((m) => m.gmail === filter['members.gmail'])
        );
        if (!room) return Promise.resolve(null);
        if (update.$addToSet) {
          if (!room.readyUsers.includes(update.$addToSet.readyUsers)) room.readyUsers.push(update.$addToSet.readyUsers);
        }
        if (update.$pull) {
          room.readyUsers = room.readyUsers.filter((n) => n !== update.$pull!.readyUsers);
        }
        return Promise.resolve(room);
      }
    ),
  },
}));

let currentSessionUser: { gmail: string; name: string } | null = null;
vi.mock('@/lib/auth', () => ({ getSessionUser: vi.fn(() => Promise.resolve(currentSessionUser)) }));

const { POST } = await import('./route');

function fakeRequest(body: unknown): NextRequest {
  return { json: () => Promise.resolve(body) } as unknown as NextRequest;
}

describe('POST /api/rooms/:roomId/ready — duplicate display name', () => {
  it.fails('does not mark an unrelated member ready just because they share a name with someone who is', async () => {
    const alice = { gmail: 'alice@test.com', name: 'สมชาย' };
    const bob = { gmail: 'bob@test.com', name: 'สมชาย' }; // same display name, different account

    rooms = [{
      roomId: 'ROOM01',
      members: [alice, bob],
      readyUsers: [],
    }];

    // Alice clicks "Ready" — Bob never touches the button.
    currentSessionUser = alice;
    const res = await POST(fakeRequest({ isReady: true }), { params: Promise.resolve({ roomId: 'ROOM01' }) });
    const data = await res.json();

    // Bob's client renders "ready" by checking readyUsers.includes(bob.name) — this should be false.
    expect(data.readyUsers.includes(bob.name)).toBe(false);
  });
});
