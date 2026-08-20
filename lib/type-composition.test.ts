import { describe, it, expect } from 'vitest';
import { resolveTemplateTypes, categoryKeyForCode, categoryAffinities, DEFAULT_TEMPLATE_TYPES } from './type-composition';

describe('resolveTemplateTypes', () => {
  it('returns the 4 Keirsey groups for every known template, case-insensitively', () => {
    expect(resolveTemplateTypes('programming').map((t) => t.key)).toEqual(['Analysts', 'Diplomats', 'Sentinels', 'Explorers']);
    expect(resolveTemplateTypes('SERVICE')).toEqual(resolveTemplateTypes('service'));
  });

  it('falls back to the default set for an unknown template', () => {
    expect(resolveTemplateTypes('unknown-template')).toEqual(DEFAULT_TEMPLATE_TYPES);
  });
});

describe('categoryKeyForCode', () => {
  it.each([
    ['INTJ', 'Analysts'],
    ['INFJ', 'Diplomats'],
    ['ISTJ', 'Sentinels'],
    ['ISTP', 'Explorers'],
  ])('maps MBTI code %s to category %s', (code, expected) => {
    expect(categoryKeyForCode('programming', code)).toBe(expected);
  });
});

describe('categoryAffinities', () => {
  it('gives the pure N+T profile the strongest affinity to Analysts', () => {
    const typeScores = [
      { title: 'N · มองภาพรวม จินตนาการ', score: 100 },
      { title: 'T · เหตุผล ตรรกะ', score: 100 },
      { title: 'J · วางแผน มีระบบ', score: 100 },
    ];
    const affinities = categoryAffinities('programming', typeScores);
    expect(affinities.Analysts).toBe(100);
    expect(affinities.Explorers).toBe(0);
  });

  it('returns 50 (neutral) for every category when no scores are provided', () => {
    const affinities = categoryAffinities('programming', []);
    for (const v of Object.values(affinities)) expect(v).toBe(50);
  });

  it('sums to 200 across the 4 categories (two independent axis pairs, symmetric by construction)', () => {
    const typeScores = [
      { title: 'N · มองภาพรวม จินตนาการ', score: 70 },
      { title: 'T · เหตุผล ตรรกะ', score: 30 },
      { title: 'J · วางแผน มีระบบ', score: 60 },
    ];
    const affinities = categoryAffinities('programming', typeScores);
    const sum = Object.values(affinities).reduce((s, v) => s + v, 0);
    expect(sum).toBe(200);
  });
});
