export const CRITERIA_KEYS = [
  'contribution', 'responsibility', 'communication', 'problemSolving', 'cooperation',
  'creativity', 'initiative', 'timeManagement', 'adaptability', 'qualityOfWork',
  'teamwork',
] as const;
export type CriteriaKey = typeof CRITERIA_KEYS[number];

// ต้องมีผู้ประเมินอย่างน้อยเท่านี้ถึงจะเริ่มตัดค่าสุดโต่งทิ้ง — ถ้าตัดตอนมีคนน้อย (เช่น 3 คน ตัด 2)
// จะเหลือข้อมูลน้อยเกินไปจนไม่มีความหมาย แถมเดาได้ง่ายว่าใครถูกตัด (ทำลาย anonymity โดยพฤตินัย)
const MIN_COUNT_TO_TRIM = 5;

/**
 * ตัดคะแนนสุดโต่งทิ้งก่อนเฉลี่ย — ผู้ประเมิน 1 คนที่ให้คะแนนแย่/ดีเกินจริง (เช่นแกล้งเพื่อน)
 * จะไม่ลากค่าเฉลี่ยของทั้งกลุ่มไปทางใดทางหนึ่ง จัดอันดับจากคะแนนเฉลี่ยรวมของผู้ประเมินแต่ละคน (ไม่ใช่รายเกณฑ์)
 * แล้วตัดตัวสูงสุด/ต่ำสุดออกคนละ 1 คน
 */
export function trimOutliers<T extends Record<CriteriaKey, number>>(list: T[]): T[] {
  if (list.length < MIN_COUNT_TO_TRIM) return list;
  const ranked = list
    .map((s) => ({ s, mean: CRITERIA_KEYS.reduce((sum, k) => sum + s[k], 0) / CRITERIA_KEYS.length }))
    .sort((a, b) => a.mean - b.mean);
  return ranked.slice(1, -1).map((r) => r.s);
}
