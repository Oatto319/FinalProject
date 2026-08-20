import { describe, it, expect } from 'vitest';
import { pairCompatibility, pairCompatibilityScore } from './mbti-compatibility';

const TEMPLATES = ['programming', 'service', 'presentation', 'design'];

describe('pairCompatibilityScore', () => {
  it('scores a fully complementary pair (opposite on every axis) at the maximum', () => {
    for (const template of TEMPLATES) {
      expect(pairCompatibilityScore('INTJ', 'ESFP', template)).toBe(100);
    }
  });

  it('scores an identical pair lower than a fully complementary pair, in every template', () => {
    for (const template of TEMPLATES) {
      const identical = pairCompatibilityScore('INTJ', 'INTJ', template);
      const complementary = pairCompatibilityScore('INTJ', 'ESFP', template);
      expect(identical).toBeLessThan(complementary);
    }
  });

  it('is symmetric', () => {
    for (const template of TEMPLATES) {
      expect(pairCompatibilityScore('ENFP', 'ISTJ', template)).toBe(pairCompatibilityScore('ISTJ', 'ENFP', template));
    }
  });

  it('falls back to the programming weighting for an unknown template', () => {
    expect(pairCompatibilityScore('INTJ', 'ESFP', 'unknown-template')).toBe(
      pairCompatibilityScore('INTJ', 'ESFP', 'programming')
    );
  });
});

describe('pairCompatibility', () => {
  it('flags an identical pair as avoid', () => {
    for (const template of TEMPLATES) {
      expect(pairCompatibility('ENTP', 'ENTP', template).avoid).toBe(true);
    }
  });

  it('does not flag a fully complementary pair as avoid', () => {
    for (const template of TEMPLATES) {
      expect(pairCompatibility('INTJ', 'ESFP', template).avoid).toBe(false);
    }
  });

  it('returns two non-empty reasons', () => {
    const result = pairCompatibility('INTJ', 'ESFP', 'programming');
    expect(result.reasons).toHaveLength(2);
    for (const reason of result.reasons) expect(reason.length).toBeGreaterThan(0);
  });
});
