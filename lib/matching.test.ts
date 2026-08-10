import { describe, it, expect } from 'vitest';
import { computeGroups, groupDiversity, pairDistance, type MatchInputMember, type ComputeGroupsInput } from './matching';
import type { AxisVector } from './mbti';
import { CRITERIA_KEYS } from './peer-evaluation';

/** Deterministic PRNG so test data (and therefore timing/behavior assertions) is reproducible across runs. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CATEGORIES = ['Analysts', 'Diplomats', 'Sentinels', 'Explorers'] as const;

function makeMembers(count: number, seed = 1): MatchInputMember[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    const axisVector: AxisVector = [
      rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1,
    ];
    const skillVector = CRITERIA_KEYS.map(() => Math.round(rand() * 100));
    const categoryKey = CATEGORIES[i % CATEGORIES.length];
    return {
      gmail: `member${i}@test.com`,
      name: `Member ${i}`,
      avatarSeed: i,
      avatarImage: null,
      axisVector,
      categoryKey,
      categoryAffinities: Object.fromEntries(CATEGORIES.map((c) => [c, c === categoryKey ? 100 : 0])),
      evalScore: Math.round(rand() * 100),
      skillVector,
    };
  });
}

function baseInput(members: MatchInputMember[], groupSize: number, overrides: Partial<ComputeGroupsInput> = {}): ComputeGroupsInput {
  return {
    members,
    groupSize,
    matchMode: 'auto',
    typeComposition: {},
    template: 'programming',
    ...overrides,
  };
}

describe('pairDistance / groupDiversity', () => {
  it('is zero for identical vectors and grows with axis differences', () => {
    const a: AxisVector = [0, 0, 0, 0];
    const b: AxisVector = [1, 1, 1, 1];
    expect(pairDistance(a, a)).toBe(0);
    expect(pairDistance(a, b)).toBe(4);
  });

  it('sums all pairwise distances in a group', () => {
    const vecs: AxisVector[] = [[0, 0, 0, 0], [1, 0, 0, 0], [0, 1, 0, 0]];
    // pairs: (0,1)=1, (0,2)=1, (1,2)=2 → sum 4
    expect(groupDiversity(vecs)).toBe(4);
  });
});

describe('computeGroups — auto mode (diversity + skill-balance construction)', () => {
  it('assigns every member exactly once, with balanced group sizes', () => {
    const members = makeMembers(23);
    const result = computeGroups(baseInput(members, 5));

    const allGmails = result.flatMap((g) => g.members.map((m) => m.gmail));
    expect(allGmails.sort()).toEqual(members.map((m) => m.gmail).sort());
    expect(new Set(allGmails).size).toBe(members.length);

    const sizes = result.map((g) => g.members.length).sort((a, b) => a - b);
    // 23 members / groupSize 5 → 5 groups, sizes must differ by at most 1
    expect(result.length).toBe(5);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it('is deterministic for identical input', () => {
    const members = makeMembers(30, 42);
    const r1 = computeGroups(baseInput(members, 6));
    const r2 = computeGroups(baseInput(members, 6));
    expect(r1.map((g) => g.members.map((m) => m.gmail))).toEqual(r2.map((g) => g.members.map((m) => m.gmail)));
  });

  it('produces meaningfully more diverse groups than a naive sequential split', () => {
    const members = makeMembers(24, 7);
    const result = computeGroups(baseInput(members, 4));

    const byGmail = new Map(members.map((m) => [m.gmail, m]));
    const algoDiversity = result.reduce(
      (sum, g) => sum + groupDiversity(g.members.map((m) => byGmail.get(m.gmail)!.axisVector)),
      0
    );

    // Naive baseline: split members into groups in original (random) order.
    const groupSize = 4;
    let naiveDiversity = 0;
    for (let i = 0; i < members.length; i += groupSize) {
      naiveDiversity += groupDiversity(members.slice(i, i + groupSize).map((m) => m.axisVector));
    }

    expect(algoDiversity).toBeGreaterThan(naiveDiversity);
  });
});

describe('computeGroups — selection mode (typeComposition hard constraint)', () => {
  it('matches the exact category counts per group when enough members of each category exist', () => {
    const members = makeMembers(32, 99); // 8 per category across 4 categories
    const result = computeGroups(
      baseInput(members, 8, {
        matchMode: 'selection',
        typeComposition: { Analysts: 2, Diplomats: 2, Sentinels: 2, Explorers: 2 },
      })
    );

    const byGmail = new Map(members.map((m) => [m.gmail, m]));
    for (const group of result) {
      expect(group.members.length).toBe(8);
      const counts: Record<string, number> = {};
      for (const m of group.members) {
        const cat = byGmail.get(m.gmail)!.categoryKey!;
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
      for (const cat of CATEGORIES) expect(counts[cat]).toBe(2);
    }
  });

  it('never exceeds groupSize even when composition counts are inconsistent with it', () => {
    // Deliberately over-subscribed composition (would sum to 8 with groupSize 4) — the API layer validates
    // this before it reaches computeGroups, but the algorithm itself must still not blow past groupSize.
    const members = makeMembers(16, 5);
    const result = computeGroups(
      baseInput(members, 4, {
        matchMode: 'selection',
        typeComposition: { Analysts: 2, Diplomats: 2, Sentinels: 2, Explorers: 2 },
      })
    );
    for (const group of result) expect(group.members.length).toBeLessThanOrEqual(4);
  });
});

describe('computeGroups — performance (large room, regression guard for O(n^4) local search)', () => {
  it('completes well within a request-timeout budget for a large room', () => {
    const members = makeMembers(240, 123);
    const start = performance.now();
    const result = computeGroups(baseInput(members, 40));
    const elapsedMs = performance.now() - start;

    const allGmails = result.flatMap((g) => g.members.map((m) => m.gmail));
    expect(allGmails.length).toBe(240);
    expect(elapsedMs).toBeLessThan(5000);
  });
});
