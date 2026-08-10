import { describe, it, expect, vi } from 'vitest';
import { CRITERIA_KEYS, type CriteriaKey } from './peer-evaluation';

// Regression coverage for the "duplicate display name" bug: two room members can share the same
// User.name (only `gmail` is unique in UserSchema), so fetchMemberTypes/fetchMemberEvalScores must
// key their results by gmail — keying by name would silently make one member's MBTI/eval data
// overwrite the other's in the returned map.

interface MockUser { gmail: string; name: string; types: Record<string, unknown> }
interface MockPeerEval { toGmail: string; scores: Record<CriteriaKey, number>; createdAt: Date }

let mockUsers: MockUser[] = [];
let mockPeerEvals: MockPeerEval[] = [];

/** Mimics a mongoose Query: awaitable directly (resolves to docs with toObject()), and `.lean()`-able
 *  (resolves to plain objects) — room-member-data.ts uses both styles across its two functions. */
function makeQuery<T extends object>(docs: T[]) {
  const withToObject = docs.map((d) => ({ ...d, toObject: () => d }));
  return {
    lean: () => Promise.resolve(docs),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(withToObject).then(resolve, reject),
  };
}

vi.mock('@/lib/models', () => ({
  User: {
    find: vi.fn((filter: Record<string, unknown>) => {
      const inClause = (filter.gmail ?? filter.name) as { $in: string[] } | undefined;
      const field = filter.gmail ? 'gmail' : 'name';
      const wanted = new Set((inClause?.$in ?? []).map((v) => v.toLowerCase()));
      return makeQuery(mockUsers.filter((u) => wanted.has(String(u[field as 'gmail' | 'name']).toLowerCase())));
    }),
  },
  PeerEvaluation: {
    find: vi.fn((filter: { toGmail: { $in: string[] } }) => {
      const wanted = new Set(filter.toGmail.$in);
      return makeQuery(mockPeerEvals.filter((e) => wanted.has(e.toGmail)));
    }),
  },
}));

const { memberKey, fetchMemberTypes, fetchMemberEvalScores } = await import('./room-member-data');

function evalScores(value: number): Record<CriteriaKey, number> {
  return Object.fromEntries(CRITERIA_KEYS.map((k) => [k, value])) as Record<CriteriaKey, number>;
}

describe('memberKey', () => {
  it('uses lowercased gmail when present', () => {
    expect(memberKey({ name: 'John', gmail: 'John@Example.com' })).toBe('john@example.com');
  });

  it('falls back to name when gmail is absent', () => {
    expect(memberKey({ name: 'Legacy Member' })).toBe('Legacy Member');
  });
});

describe('fetchMemberTypes — duplicate display names', () => {
  it('resolves each same-named member to their own MBTI result, keyed by gmail', async () => {
    mockUsers = [
      { gmail: 'a@test.com', name: 'John', types: { programming: { code: 'INTJ', title: 'Analyst', icon: 'i1', description: 'd1', jobs: ['j1'], typeScores: [] } } },
      { gmail: 'b@test.com', name: 'John', types: { programming: { code: 'ENFP', title: 'Explorer', icon: 'i2', description: 'd2', jobs: ['j2'], typeScores: [] } } },
    ];

    const result = await fetchMemberTypes('programming', [
      { name: 'John', gmail: 'a@test.com' },
      { name: 'John', gmail: 'b@test.com' },
    ]);

    expect(Object.keys(result).sort()).toEqual(['a@test.com', 'b@test.com']);
    expect(result['a@test.com'].code).toBe('INTJ');
    expect(result['b@test.com'].code).toBe('ENFP');
  });
});

describe('fetchMemberEvalScores — duplicate display names', () => {
  it('resolves each same-named member to their own eval aggregate, keyed by gmail', async () => {
    const now = new Date();
    mockPeerEvals = [
      { toGmail: 'a@test.com', scores: evalScores(5), createdAt: now },
      { toGmail: 'b@test.com', scores: evalScores(1), createdAt: now },
    ];

    const result = await fetchMemberEvalScores([
      { name: 'John', gmail: 'a@test.com' },
      { name: 'John', gmail: 'b@test.com' },
    ]);

    expect(Object.keys(result).sort()).toEqual(['a@test.com', 'b@test.com']);
    expect(result['a@test.com'].overall).toBeGreaterThan(result['b@test.com'].overall);
  });
});
