import type { Axis } from './mbti';
import { AXIS_LABEL, MBTI_CODES } from './mbti';

export interface CompatibilityResult {
  score: number;
  reasons: string[];
  avoid: boolean;
}

export interface TypePartner {
  code: string;
  score: number;
  reasons: string[];
}

export interface TypeCompatibilitySummary {
  /** type อื่นที่เข้ากันดีที่สุด 3 อันดับแรก (คะแนนสูง→ต่ำ) */
  bestPartners: TypePartner[];
  /** type ที่ควรทำความเข้าใจสไตล์การทำงานที่ต่างกันก่อนจับกลุ่ม (score ต่ำกว่า threshold) — มักมีแค่ 0-2 รายการ ไม่ใช่ "เข้ากันไม่ได้" */
  cautionPartners: TypePartner[];
}

const AXES: Axis[] = ['EI', 'SN', 'TF', 'JP'];

/** น้ำหนักความสำคัญของแต่ละแกน MBTI ต่อ "การทำงานเป็นทีมได้ดี" ในบริบทงานของแต่ละ template — รวมกัน = 1 ต่อ template */
const TEMPLATE_AXIS_WEIGHTS: Record<string, Record<Axis, number>> = {
  programming:  { EI: 0.15, SN: 0.30, TF: 0.35, JP: 0.20 },
  service:      { EI: 0.35, SN: 0.15, TF: 0.30, JP: 0.20 },
  presentation: { EI: 0.35, SN: 0.25, TF: 0.20, JP: 0.20 },
  design:       { EI: 0.15, SN: 0.35, TF: 0.20, JP: 0.30 },
};

/** ทำไมแกนนี้ถึงสำคัญกับงานของ template นั้นๆ — ใช้ประกอบทั้งกรณีต่างขั้ว (เสริมกัน) และขั้วเดียวกัน (ขาดมุมมอง) */
const TEMPLATE_AXIS_CONTEXT: Record<string, Record<Axis, string>> = {
  programming: {
    EI: 'การประสานงานกับทีมและสมาธิลงมือเขียนโค้ด',
    SN: 'รายละเอียดของโค้ดกับภาพรวมของสถาปัตยกรรมระบบ',
    TF: 'ประสิทธิภาพของโค้ดกับความง่ายในการใช้งานจริง',
    JP: 'การวางแผนงานกับการรับมือปัญหาเฉพาะหน้า',
  },
  service: {
    EI: 'การเข้าหาและดูแลลูกค้าอย่างกระตือรือร้น',
    SN: 'ขั้นตอนบริการที่ชัดเจนกับการปรับให้เข้ากับลูกค้าแต่ละคน',
    TF: 'การแก้ปัญหาให้ลูกค้ากับการเอาใจใส่ความรู้สึกลูกค้า',
    JP: 'ระบบงานบริการที่วางไว้กับความยืดหยุ่นตอนหน้างาน',
  },
  presentation: {
    EI: 'การพูดนำเสนอต่อหน้าคนกับการเตรียมเนื้อหาอย่างลึกซึ้ง',
    SN: 'ตัวอย่างที่จับต้องได้กับการเล่าภาพใหญ่ที่โน้มน้าวใจ',
    TF: 'ข้อมูลเชิงเหตุผลกับการเชื่อมโยงอารมณ์ผู้ฟัง',
    JP: 'โครงสร้างการนำเสนอกับการปรับสดตามหน้างาน',
  },
  design: {
    EI: 'การรับฟีดแบ็กจากทีมกับสมาธิสร้างสรรค์งานคนเดียว',
    SN: 'รายละเอียดของชิ้นงานกับไอเดียใหม่ๆ',
    TF: 'หลักการออกแบบที่ใช้งานได้จริงกับความสวยงามที่โดนใจ',
    JP: 'แนวทางดีไซน์ที่มีแบบแผนกับการทดลองสไตล์ใหม่',
  },
};

// คู่ที่เหมือนกันเกิน 2 แกน (แทบไม่มีมุมมองเสริมกันเลย) โดนหักคะแนนเพิ่มต่อแกนที่เหมือนกัน
const SAME_AXIS_PENALTY = 0.15;
// score ต่ำกว่านี้ = แนะนำให้หลีกเลี่ยงการจับคู่นี้ไว้ในกลุ่มเดียวกัน
const AVOID_THRESHOLD = 45;

function axisWeights(template: string): Record<Axis, number> {
  return TEMPLATE_AXIS_WEIGHTS[template.toLowerCase()] ?? TEMPLATE_AXIS_WEIGHTS.programming;
}

/** น้ำหนัก 4 แกนของ template หนึ่ง เรียงตาม AXES ([EI, SN, TF, JP]) — resolve ครั้งเดียวแล้วส่งต่อให้ pairCompatibilityScoreFast
 * แทนที่จะให้ hot loop ของอัลกอริทึมจับกลุ่ม (เรียกฟังก์ชันนี้เป็นสิบล้านครั้งต่อห้องใหญ่) ต้อง toLowerCase()/lookup ซ้ำทุกครั้ง */
export function resolveAxisWeights(template: string): readonly [number, number, number, number] {
  const w = axisWeights(template);
  return [w.EI, w.SN, w.TF, w.JP];
}

/**
 * เวอร์ชันเร็วของ pairCompatibilityScore สำหรับ hot loop (2-opt local search) — รับน้ำหนักที่ resolve ไว้แล้ว
 * แทนที่จะรับ template string ตรงๆ, ใช้ charCodeAt + for-loop ธรรมดาแทน AXES.forEach เพื่อเลี่ยง closure/allocation ต่อคอล
 */
export function pairCompatibilityScoreFast(codeA: string, codeB: string, weights: readonly [number, number, number, number]): number {
  let base = 0;
  let sameCount = 0;
  for (let i = 0; i < 4; i++) {
    if (codeA.charCodeAt(i) === codeB.charCodeAt(i)) {
      sameCount++;
      base += weights[i] * 0.5;
    } else {
      base += weights[i];
    }
  }
  const penalty = sameCount > 2 ? (sameCount - 2) * SAME_AXIS_PENALTY : 0;
  let score01 = base - penalty;
  if (score01 < 0) score01 = 0;
  else if (score01 > 1) score01 = 1;
  return Math.round(score01 * 100);
}

/**
 * 0-100: ยิ่งสูงยิ่งเข้ากันดีตามน้ำหนักแกนของ template นั้นๆ — คำนวณล้วนจากตัวอักษร 4 ตัวของโค้ด MBTI
 * (ไม่ผูกกับ reasons) นี่คือ wrapper สะดวกใช้ที่รับ template string ตรงๆ (ไม่ cache น้ำหนัก) เหมาะกับการเรียกไม่บ่อย —
 * โค้ดจับกลุ่มจริงใน lib/matching.ts ใช้ pairCompatibilityScoreFast + resolveAxisWeights แทน
 */
export function pairCompatibilityScore(codeA: string, codeB: string, template: string): number {
  return pairCompatibilityScoreFast(codeA, codeB, resolveAxisWeights(template));
}

/**
 * เหมือน pairCompatibilityScore แต่แถมเหตุผลเป็นภาษาไทย (2 แกนที่มีน้ำหนักสูงสุดสำหรับ template นี้)
 * เรียกเฉพาะตอนสร้างผลลัพธ์ให้ผู้ใช้ดูหลังจับกลุ่มเสร็จ ไม่ใช่ใน hot loop ของอัลกอริทึม
 */
export function pairCompatibility(codeA: string, codeB: string, template: string): CompatibilityResult {
  const score = pairCompatibilityScore(codeA, codeB, template);
  const weights = axisWeights(template);
  const context = TEMPLATE_AXIS_CONTEXT[template.toLowerCase()] ?? TEMPLATE_AXIS_CONTEXT.programming;

  const ranked = [...AXES].sort((a, b) => weights[b] - weights[a]).slice(0, 2);
  const reasons = ranked.map((axis) => {
    const i = AXES.indexOf(axis);
    const [poleA, poleB] = AXIS_LABEL[axis];
    const same = codeA[i] === codeB[i];
    if (!same) return `${poleA} คู่กับ ${poleB} — เสริมกันเรื่อง${context[axis]}`;
    const sharedPole = codeA[i] === poleA[0] ? poleA : poleB;
    return `ทั้งคู่เป็น ${sharedPole} เหมือนกัน — อาจขาดมุมมองอีกด้านเรื่อง${context[axis]}`;
  });

  return { score, reasons, avoid: score < AVOID_THRESHOLD };
}

const BEST_PARTNER_COUNT = 3;

/**
 * สรุปว่า MBTI type หนึ่ง เข้ากับ type อื่นๆ อีก 15 ชนิดที่เหลืออย่างไรบ้าง สำหรับ template ที่กำหนด — ใช้แสดงในหน้า
 * "MBTI Templates" (คู่มืออ้างอิงสำหรับ host) ไม่ใช่ hot loop ของอัลกอริทึม เรียกไม่บ่อย เลยไม่ต้องรับ weights ที่ resolve ไว้แล้ว
 *
 * cautionPartners มักมีแค่ 0-2 รายการ (ไม่ใช่รายชื่อ "ศัตรู") — เกิดเฉพาะกับ type ที่ต่างจาก code แค่ 1 ตัวอักษรบนแกนที่มีน้ำหนักต่ำ
 * สำหรับ template นั้น จึงมีสไตล์การทำงานคล้ายกันเกือบทุกด้านจนขาดมุมมองเสริม — คำอธิบาย (reasons) เป็นภาษาสไตล์การทำงาน
 * ที่ต่างกัน ไม่ใช่ข้อสรุปว่า "เข้ากันไม่ได้แน่นอน" (ดู pairCompatibility ด้านบน)
 */
export function typeCompatibilitySummary(code: string, template: string): TypeCompatibilitySummary {
  const results = MBTI_CODES
    .filter((c) => c !== code)
    .map((other) => {
      const r = pairCompatibility(code, other, template);
      return { code: other, score: r.score, reasons: r.reasons, avoid: r.avoid };
    });

  const bestPartners = [...results]
    .sort((a, b) => b.score - a.score)
    .slice(0, BEST_PARTNER_COUNT)
    .map(({ code, score, reasons }) => ({ code, score, reasons }));

  const cautionPartners = results
    .filter((r) => r.avoid)
    .sort((a, b) => a.score - b.score)
    .map(({ code, score, reasons }) => ({ code, score, reasons }));

  return { bestPartners, cautionPartners };
}
