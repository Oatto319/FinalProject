import { describe, it, expect } from 'vitest';
import {
  scoreMbti, buildAxisBars, axisVector, letterAffinity, typeIcon, typeColor,
  roleColor, sampleQuestions, AXIS_MAX, type MbtiQuestion,
} from './mbti';

function q(id: number, dimension: MbtiQuestion['dimension'], pole: MbtiQuestion['pole']): MbtiQuestion {
  return { id, text: `q${id}`, dimension, pole };
}

describe('scoreMbti', () => {
  it('scores all-agree answers toward each question pole letter', () => {
    // 1 = เห็นด้วยเต็มที่ (low end) → pole(1) = 1 → contributes toward q.pole
    const questions = [q(1, 'EI', 'E'), q(2, 'SN', 'S'), q(3, 'TF', 'T'), q(4, 'JP', 'J')];
    const answers = { 1: 1, 2: 1, 3: 1, 4: 1 };
    const { code } = scoreMbti(questions, answers);
    expect(code).toBe('ESTJ');
  });

  it('flips the resulting letter for the opposite pole on the same axis', () => {
    const questions = [q(1, 'EI', 'I')];
    const { code } = scoreMbti(questions, { 1: 1 });
    // pole(1)=1, sign = -1 (question points to I, opposite of AXIS_POSITIVE_LETTER.EI = 'E') → axisScore.EI = -1 → 'I'
    expect(code[0]).toBe('I');
  });

  it('treats neutral answers (4) as contributing nothing to the axis', () => {
    const questions = [q(1, 'EI', 'E'), q(2, 'EI', 'E')];
    const { axisScore } = scoreMbti(questions, { 1: 4, 2: 4 });
    expect(axisScore.EI).toBe(0);
  });

  it('ties on an axis default to the positive letter (score >= 0)', () => {
    const questions = [q(1, 'TF', 'T'), q(2, 'TF', 'F')];
    // pole(1)=1 (agree) each → +1 and -1 → sums to 0 → tie
    const { code } = scoreMbti(questions, { 1: 1, 2: 1 });
    expect(code[2]).toBe('T');
  });

  it('missing answers are treated as neutral (pole(undefined) → 0)', () => {
    const questions = [q(1, 'EI', 'E')];
    const { axisScore } = scoreMbti(questions, {});
    expect(axisScore.EI).toBe(0);
  });
});

describe('buildAxisBars', () => {
  it('normalizes each axis score to a 0-100 percentage of AXIS_MAX', () => {
    const bars = buildAxisBars({ EI: AXIS_MAX, SN: -AXIS_MAX, TF: 0, JP: AXIS_MAX / 2 });
    expect(bars[0].score).toBe(100);
    expect(bars[1].score).toBe(100);
    expect(bars[2].score).toBe(0);
    expect(bars[3].score).toBe(50);
  });

  it('picks the positive-letter label when score >= 0, negative-letter label otherwise', () => {
    const bars = buildAxisBars({ EI: 1, SN: -1, TF: 0, JP: 0 });
    expect(bars[0].title[0]).toBe('E');
    expect(bars[1].title[0]).toBe('N');
    // TF: 0 >= 0 → positive letter 'T'
    expect(bars[2].title[0]).toBe('T');
  });
});

describe('letterAffinity / axisVector', () => {
  it('returns the bar score directly when the bar matches the requested letter', () => {
    const typeScores = [{ title: 'E · เปิดเผย เข้าสังคม', score: 80 }];
    expect(letterAffinity(typeScores, 'E')).toBe(80);
  });

  it('inverts the score (100 - score) when the bar covers the partner letter', () => {
    const typeScores = [{ title: 'I · ใคร่ครวญ สงบนิ่ง', score: 80 }];
    expect(letterAffinity(typeScores, 'E')).toBe(20);
  });

  it('defaults to 50 (neutral) when no bar covers the axis at all', () => {
    expect(letterAffinity([], 'E')).toBe(50);
  });

  it('axisVector normalizes each of E/S/T/J to the -1..1 range', () => {
    const typeScores = [
      { title: 'E · เปิดเผย เข้าสังคม', score: 100 },
      { title: 'S · ปฏิบัติ ลงรายละเอียด', score: 0 },
      { title: 'T · เหตุผล ตรรกะ', score: 50 },
      { title: 'J · วางแผน มีระบบ', score: 100 },
    ];
    expect(axisVector(typeScores)).toEqual([1, -1, 0, 1]);
  });
});

describe('typeIcon / typeColor (Keirsey temperament grouping)', () => {
  it.each([
    ['INTJ', '/img/brain.png'], // N & T → Analysts
    ['INFJ', '/img/idea.png'],  // N & !T → Diplomats
    ['ISTJ', '/img/make.png'],  // !N & J → Sentinels
    ['ISTP', '/img/pencil.png'], // !N & !J → Explorers
  ])('maps %s to %s', (code, icon) => {
    expect(typeIcon(code)).toBe(icon);
  });

  it('gives every temperament group a distinct color', () => {
    const colors = ['INTJ', 'INFJ', 'ISTJ', 'ISTP'].map(typeColor);
    expect(new Set(colors).size).toBe(4);
  });

  it('roleColor falls back to the Analysts color for an unrecognized icon', () => {
    expect(roleColor('/img/unknown.png')).toBe(typeColor('INTJ'));
  });
});

describe('sampleQuestions', () => {
  const bank: MbtiQuestion[] = [
    ...Array.from({ length: 3 }, (_, i) => q(i, 'EI', 'E')),
    ...Array.from({ length: 3 }, (_, i) => q(100 + i, 'SN', 'S')),
    ...Array.from({ length: 3 }, (_, i) => q(200 + i, 'TF', 'T')),
    ...Array.from({ length: 3 }, (_, i) => q(300 + i, 'JP', 'J')),
  ];

  it('draws exactly perAxis questions for each of the 4 axes', () => {
    const sample = sampleQuestions(bank, 2);
    expect(sample).toHaveLength(8);
    for (const axis of ['EI', 'SN', 'TF', 'JP'] as const) {
      expect(sample.filter((s) => s.dimension === axis)).toHaveLength(2);
    }
  });

  it('throws instead of silently returning fewer questions when the bank is short on an axis', () => {
    expect(() => sampleQuestions(bank, 4)).toThrow(/EI has only 3 questions, need 4/);
  });
});
