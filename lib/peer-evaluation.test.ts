import { describe, it, expect } from 'vitest';
import { CRITERIA_KEYS, trimOutliers, shrinkTowardNeutral, recencyWeight, weightedAverage, type CriteriaKey } from './peer-evaluation';

function scoresOf(value: number): Record<CriteriaKey, number> {
  return Object.fromEntries(CRITERIA_KEYS.map((k) => [k, value])) as Record<CriteriaKey, number>;
}

describe('trimOutliers', () => {
  it('leaves the list untouched below the minimum count threshold (5)', () => {
    const list = [scoresOf(1), scoresOf(5), scoresOf(3), scoresOf(4)];
    expect(trimOutliers(list)).toEqual(list);
  });

  it('drops exactly the single highest and single lowest mean-scored entries at the threshold', () => {
    const list = [scoresOf(1), scoresOf(2), scoresOf(3), scoresOf(4), scoresOf(5)];
    const result = trimOutliers(list);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.contribution).sort((a, b) => a - b)).toEqual([2, 3, 4]);
  });

  it('does not mutate the input array', () => {
    const list = [scoresOf(1), scoresOf(2), scoresOf(3), scoresOf(4), scoresOf(5)];
    const copy = [...list];
    trimOutliers(list);
    expect(list).toEqual(copy);
  });
});

describe('shrinkTowardNeutral', () => {
  it('pulls a single rater almost all the way to the neutral midpoint (3)', () => {
    const shrunk = shrinkTowardNeutral(5, 1);
    // (5*1 + 3*5) / (1+5) = 20/6 ≈ 3.33 — far closer to 3 than to 5
    expect(shrunk).toBeCloseTo(20 / 6, 5);
  });

  it('barely moves the average once rater count is large', () => {
    const shrunk = shrinkTowardNeutral(5, 1000);
    expect(shrunk).toBeGreaterThan(4.9);
  });

  it('returns exactly the neutral value when rawAvg is already neutral, regardless of count', () => {
    expect(shrinkTowardNeutral(3, 1)).toBe(3);
    expect(shrinkTowardNeutral(3, 50)).toBe(3);
  });
});

describe('recencyWeight', () => {
  it('is 1 for a submission made right now', () => {
    const now = Date.now();
    expect(recencyWeight(new Date(now), now)).toBeCloseTo(1, 10);
  });

  it('halves at the 90-day half-life', () => {
    const now = Date.now();
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
    expect(recencyWeight(ninetyDaysAgo, now)).toBeCloseTo(0.5, 5);
  });

  it('quarters at 180 days', () => {
    const now = Date.now();
    const oneEightyDaysAgo = new Date(now - 180 * 24 * 60 * 60 * 1000);
    expect(recencyWeight(oneEightyDaysAgo, now)).toBeCloseTo(0.25, 5);
  });

  it('clamps negative age (future timestamp) to weight 1 instead of >1', () => {
    const now = Date.now();
    const future = new Date(now + 10 * 24 * 60 * 60 * 1000);
    expect(recencyWeight(future, now)).toBe(1);
  });
});

describe('weightedAverage', () => {
  it('matches a plain average when all weights are equal', () => {
    const avg = weightedAverage([{ value: 2, weight: 1 }, { value: 4, weight: 1 }]);
    expect(avg).toBe(3);
  });

  it('lets a higher-weighted value dominate the result', () => {
    const avg = weightedAverage([{ value: 5, weight: 9 }, { value: 1, weight: 1 }]);
    expect(avg).toBeCloseTo(4.6, 5);
  });

  it('falls back to a plain average when total weight is 0', () => {
    const avg = weightedAverage([{ value: 2, weight: 0 }, { value: 4, weight: 0 }]);
    expect(avg).toBe(3);
  });

  it('returns 0 for an empty list', () => {
    expect(weightedAverage([])).toBe(0);
  });
});
