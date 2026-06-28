export type Axis = 'EI' | 'SN' | 'TF' | 'JP';
export type Letter = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

export interface MbtiQuestion {
  id: number;
  text: string;
  dimension: Axis;
  /** the letter that answering "เห็นด้วย" (low end of the 1-7 scale) points toward */
  pole: Letter;
}

export interface MbtiTypeInfo {
  title: string;
  description: string;
  jobs: string[];
}

/** number of questions per axis — also the max magnitude of an axis score */
export const AXIS_MAX = 15;

const pole = (val: number) => (val <= 3 ? 1 : val >= 5 ? -1 : 0);

const AXIS_POSITIVE_LETTER: Record<Axis, Letter> = { EI: 'E', SN: 'S', TF: 'T', JP: 'J' };

export function scoreMbti(questions: MbtiQuestion[], answers: Record<number, number>) {
  const axisScore: Record<Axis, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
  for (const q of questions) {
    const contribution = pole(answers[q.id]);
    const sign = q.pole === AXIS_POSITIVE_LETTER[q.dimension] ? 1 : -1;
    axisScore[q.dimension] += sign * contribution;
  }
  const E = axisScore.EI >= 0;
  const S = axisScore.SN >= 0;
  const T = axisScore.TF >= 0;
  const J = axisScore.JP >= 0;
  const code = `${E ? 'E' : 'I'}${S ? 'S' : 'N'}${T ? 'T' : 'F'}${J ? 'J' : 'P'}`;
  return { code, axisScore };
}

const AXIS_ICON: Record<Axis, string> = {
  EI: '/img/make.png',
  SN: '/img/idea.png',
  TF: '/img/brain.png',
  JP: '/img/pencil.png',
};

const AXIS_LABEL: Record<Axis, [string, string]> = {
  EI: ['E · เปิดเผย เข้าสังคม', 'I · ใคร่ครวญ สงบนิ่ง'],
  SN: ['S · ปฏิบัติ ลงรายละเอียด', 'N · มองภาพรวม จินตนาการ'],
  TF: ['T · เหตุผล ตรรกะ', 'F · ความรู้สึก คน'],
  JP: ['J · วางแผน มีระบบ', 'P · ยืดหยุ่น ปรับตัว'],
};

/** returns 4 bars (one per axis) with score pre-normalized to a 0-100 percentage */
export function buildAxisBars(axisScore: Record<Axis, number>) {
  return (['EI', 'SN', 'TF', 'JP'] as Axis[]).map((key) => {
    const val = axisScore[key];
    const [posLabel, negLabel] = AXIS_LABEL[key];
    const pct = Math.round((Math.abs(val) / AXIS_MAX) * 100);
    return { title: val >= 0 ? posLabel : negLabel, icon: AXIS_ICON[key], score: pct };
  });
}

/** Keirsey-style temperament icon: NT→brain, NF→idea, SJ→make, SP→pencil */
export function typeIcon(code: string): string {
  const N = code[1] === 'N';
  const T = code[2] === 'T';
  const J = code[3] === 'J';
  if (N && T) return '/img/brain.png';
  if (N && !T) return '/img/idea.png';
  if (!N && J) return '/img/make.png';
  return '/img/pencil.png';
}

export const MBTI_CODES = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
] as const;
