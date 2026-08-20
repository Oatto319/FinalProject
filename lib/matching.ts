import { pairCompatibility, pairCompatibilityScoreFast, resolveAxisWeights } from './mbti-compatibility';

type AxisWeights = readonly [number, number, number, number];

/** ค่าเฉลี่ยรายเกณฑ์ประเมิน 11 ด้าน (0-100 ต่อด้าน) เรียงตาม CRITERIA_KEYS */
export type SkillVector = readonly number[];

export interface MatchInputMember {
  gmail: string;
  name: string;
  avatarSeed: number;
  avatarImage?: string | null;
  /** 4-letter MBTI code (เช่น 'INTJ') — ใช้เป็น input หลักของ compatibility scoring */
  code: string;
  categoryKey: string | null;
  /** คะแนนประเมินรวม (0-100) ใช้แค่จัดลำดับก่อนเติมกลุ่ม (spread คนคะแนนสูง/ต่ำ) ไม่ใช่ objective หลัก */
  evalScore: number;
  /** เวกเตอร์คะแนนรายเกณฑ์ 11 ด้าน — ใช้เป็น objective จริงสำหรับ skill balance */
  skillVector: SkillVector;
}

export interface ComputeGroupsInput {
  members: MatchInputMember[];
  groupSize: number;
  template: string;
}

/** คู่สมาชิกที่มีสัญญาณเด่นในกลุ่ม — เข้ากันดีที่สุด หรือควรหลีกเลี่ยง (ถูกจับกลุ่มร่วมกันทั้งที่ควรเลี่ยง เพราะข้อจำกัดขนาดกลุ่ม) */
export interface SynergyNote {
  gmailA: string;
  gmailB: string;
  reasons: string[];
  avoid: boolean;
}

export interface MatchedGroupResult {
  id: number;
  name: string;
  members: { gmail: string; name: string; avatarSeed: number; avatarImage?: string | null; role: string }[];
  synergyNotes: SynergyNote[];
}

interface WorkingGroup {
  id: number;
  members: MatchInputMember[];
  roles: string[]; // parallel to members — role label assigned to each member
}

function codeHammingDistance(a: string, b: string): number {
  let d = 0;
  for (let i = 0; i < 4; i++) if (a[i] !== b[i]) d += 1;
  return d;
}

// น้ำหนักรวมของ objective function: MBTI compatibility (แกนหลัก) vs skill balance (แกนรอง จากคะแนนประเมิน)
// ใช้สัดส่วนเดียวกับที่แอปนี้ใช้ผสม MBTI กับคะแนนประเมินอยู่แล้วตอนแนะนำหัวหน้าทีม (0.7/0.3)
const COMPATIBILITY_WEIGHT = 0.7;
const SKILL_BALANCE_WEIGHT = 0.3;

/** ความเข้ากันเฉลี่ยของกลุ่ม normalize เป็น 0..1 (ค่าเฉลี่ย pairCompatibilityScoreFast ต่อคู่ เทียบคะแนนสูงสุดที่เป็นไปได้ 100) */
function normalizedGroupCompatibility(codes: string[], weights: AxisWeights): number {
  const pairCount = (codes.length * (codes.length - 1)) / 2;
  if (pairCount === 0) return 0;
  let sum = 0;
  for (let i = 0; i < codes.length; i++) {
    for (let j = i + 1; j < codes.length; j++) sum += pairCompatibilityScoreFast(codes[i], codes[j], weights);
  }
  return sum / (pairCount * 100);
}

/** ความสมดุลของทักษะ (0..1) จากเวกเตอร์ค่าเฉลี่ยกลุ่มที่คำนวณไว้แล้ว — แยกจาก skillBalance() เพื่อให้ localSearchImprove
 * อัปเดตค่าเฉลี่ยกลุ่มแบบ incremental (บวก/ลบสมาชิกที่สลับ) แทนการ reduce เวกเตอร์ทั้งกลุ่มใหม่ทุกครั้ง */
function skillBalanceFromAvg(groupAvgVector: SkillVector, globalAvgVector: SkillVector): number {
  const dims = globalAvgVector.length;
  let sumAbsDeviation = 0;
  for (let d = 0; d < dims; d++) sumAbsDeviation += Math.abs(groupAvgVector[d] - globalAvgVector[d]);
  const avgDeviation = sumAbsDeviation / dims;
  return 1 - Math.min(1, avgDeviation / 100);
}

/** ความสมดุลของทักษะในกลุ่ม (11 เกณฑ์) normalize เป็น 0..1 — 1 คือค่าเฉลี่ยกลุ่มตรงกับค่าเฉลี่ยทั้งห้องทุกเกณฑ์พอดี
 * ใช้เวกเตอร์รายเกณฑ์แทนค่าเฉลี่ยรวมเดียว เพื่อไม่ให้กลุ่มไหนกองคนอ่อนด้านใดด้านหนึ่งไว้ด้วยกัน (เช่น cooperation ต่ำทั้งกลุ่ม)
 * ทั้งที่ค่าเฉลี่ยรวมอาจดูใกล้เคียงกลุ่มอื่น */
function skillBalance(skillVectors: SkillVector[], globalAvgVector: SkillVector): number {
  if (skillVectors.length === 0) return 1;
  return skillBalanceFromAvg(averageSkillVector(skillVectors), globalAvgVector);
}

/** Objective function หลัก: ผสม MBTI compatibility กับ skill balance ตามน้ำหนักด้านบน ใช้ทั้งตอนเลือกกลุ่มให้สมาชิกใหม่
 * และตอน local search — ให้สองขั้นตอนเพิ่มประสิทธิภาพเป้าหมายเดียวกัน */
function combinedGroupScore(codes: string[], skillVectors: SkillVector[], globalAvgVector: SkillVector, weights: AxisWeights): number {
  return COMPATIBILITY_WEIGHT * normalizedGroupCompatibility(codes, weights) + SKILL_BALANCE_WEIGHT * skillBalance(skillVectors, globalAvgVector);
}

function balancedCapacities(n: number, numGroups: number): number[] {
  const base = Math.floor(n / numGroups);
  const extra = n % numGroups;
  return Array.from({ length: numGroups }, (_, i) => base + (i < extra ? 1 : 0));
}

/** Stable descending sort by key — ties keep original relative order. */
function stableSortDesc<T>(arr: T[], keyFn: (t: T) => number): T[] {
  return arr
    .map((item, idx) => ({ item, idx, key: keyFn(item) }))
    .sort((a, b) => b.key - a.key || a.idx - b.idx)
    .map((x) => x.item);
}

function totalHammingDistance(member: MatchInputMember, all: MatchInputMember[]): number {
  let sum = 0;
  for (const m of all) sum += codeHammingDistance(member.code, m.code);
  return sum;
}

/** Deterministic greedy farthest-first traversal over MBTI codes: picks the member whose code is most distinct
 * from everyone else's first, then repeatedly the member farthest (by Hamming distance) from all seeds picked so
 * far — spreads group "anchors" across type-space before the compatibility-maximizing placement below fills the rest. */
function farthestPointSeeds(members: MatchInputMember[], k: number): MatchInputMember[] {
  const n = members.length;
  if (n === 0 || k <= 0) return [];

  let seed1Idx = 0;
  let seed1Val = -Infinity;
  members.forEach((m, i) => {
    const v = totalHammingDistance(m, members);
    if (v > seed1Val) { seed1Val = v; seed1Idx = i; }
  });

  const seeds: MatchInputMember[] = [members[seed1Idx]];
  const seedIdx = new Set([seed1Idx]);

  while (seeds.length < Math.min(k, n)) {
    let bestIdx = -1;
    let bestMinDist = -Infinity;
    members.forEach((m, i) => {
      if (seedIdx.has(i)) return;
      let minDist = Infinity;
      for (const s of seeds) minDist = Math.min(minDist, codeHammingDistance(m.code, s.code));
      if (minDist > bestMinDist) { bestMinDist = minDist; bestIdx = i; }
    });
    if (bestIdx === -1) break;
    seeds.push(members[bestIdx]);
    seedIdx.add(bestIdx);
  }

  return seeds;
}

/** จับกลุ่มโดย maximize MBTI compatibility (ตาม template) ผสม skill balance — path เดียวที่ใช้เสมอ */
function assignByCompatibilityConstruction(
  members: MatchInputMember[],
  groups: WorkingGroup[],
  capacities: number[],
  globalAvgSkill: SkillVector,
  weights: AxisWeights
): void {
  const seeds = farthestPointSeeds(members, groups.length);
  const seedGmails = new Set(seeds.map((s) => s.gmail));

  seeds.forEach((s, i) => {
    groups[i].members.push(s);
    groups[i].roles.push(s.categoryKey ?? 'ไม่ระบุ');
  });

  // เรียงตามคะแนนประเมินย้อนหลังเหมือนพฤติกรรมเดิม เพื่อกระจายคนคะแนนสูง/ต่ำคนละกลุ่มกัน
  const remaining = stableSortDesc(members.filter((m) => !seedGmails.has(m.gmail)), (m) => m.evalScore);

  for (const m of remaining) {
    let bestIdx = -1;
    let bestScore = -Infinity;
    groups.forEach((g, i) => {
      if (g.members.length >= capacities[i]) return;
      const codesAfter = [...g.members.map((mm) => mm.code), m.code];
      const skillVectorsAfter = [...g.members.map((mm) => mm.skillVector), m.skillVector];
      const score = combinedGroupScore(codesAfter, skillVectorsAfter, globalAvgSkill, weights);
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    });
    if (bestIdx === -1) {
      bestIdx = groups.reduce((a, g, i) => (g.members.length < groups[a].members.length ? i : a), 0);
    }
    groups[bestIdx].members.push(m);
    groups[bestIdx].roles.push(m.categoryKey ?? 'ไม่ระบุ');
  }
}

/** sum of pairCompatibilityScoreFast(code, others[k]) for every k except excludeIdx — the O(n) building block
 * that lets a single-member swap's compatibility impact be measured without re-summing all pairs in the group. */
function sumCompatibilityToOthers(code: string, others: string[], excludeIdx: number, weights: AxisWeights): number {
  let sum = 0;
  for (let k = 0; k < others.length; k++) {
    if (k !== excludeIdx) sum += pairCompatibilityScoreFast(code, others[k], weights);
  }
  return sum;
}

/** Bounded 2-opt local search: swap two members across groups whenever it improves the combined
 * compatibility+skill-balance objective.
 *
 * Evaluating every candidate swap by rebuilding both groups' code lists and recomputing combinedGroupScore
 * from scratch is O(n) per candidate for the compatibility sum alone (pairwise) times O(n) candidates per
 * group-pair times O(n) again inside normalizedGroupCompatibility's own double loop — O(n^4) per group-pair per
 * round, which times out on large rooms (e.g. 300 members / 50 per group). Swapping a single member only changes
 * the pairs touching that member, so each candidate's delta can be measured in O(n) (compatibility) + O(dims)
 * (skill balance, via the incrementally-updated group average) instead of recomputing the whole O(n^2) sum —
 * turning the group-pair sweep from O(n^4) into O(n^3) while producing the exact same deltas (up to
 * floating-point rounding) as the brute-force version above.
 */
function localSearchImprove(groups: WorkingGroup[], globalAvgSkill: SkillVector, weights: AxisWeights): void {
  const maxRounds = 50;
  const dims = globalAvgSkill.length;

  for (let round = 0; round < maxRounds; round++) {
    let bestDelta = 0;
    let bestSwap: { gi: number; ai: number; gj: number; bi: number } | null = null;

    for (let gi = 0; gi < groups.length; gi++) {
      for (let gj = gi + 1; gj < groups.length; gj++) {
        const groupA = groups[gi];
        const groupB = groups[gj];
        const codesA = groupA.members.map((m) => m.code);
        const codesB = groupB.members.map((m) => m.code);
        const skillsA = groupA.members.map((m) => m.skillVector);
        const skillsB = groupB.members.map((m) => m.skillVector);
        const nA = codesA.length;
        const nB = codesB.length;
        const pairCountA = (nA * (nA - 1)) / 2;
        const pairCountB = (nB * (nB - 1)) / 2;
        const avgSkillA = averageSkillVector(skillsA);
        const avgSkillB = averageSkillVector(skillsB);
        const skillBalanceBaseA = skillBalanceFromAvg(avgSkillA, globalAvgSkill);
        const skillBalanceBaseB = skillBalanceFromAvg(avgSkillB, globalAvgSkill);

        // Precomputed once per (ai) / (bi) — reused across every candidate on the other side, since it
        // only depends on the member being replaced, not on what it's being replaced with.
        const oldSumA = codesA.map((c, idx) => (nA > 1 ? sumCompatibilityToOthers(c, codesA, idx, weights) : 0));
        const oldSumB = codesB.map((c, idx) => (nB > 1 ? sumCompatibilityToOthers(c, codesB, idx, weights) : 0));

        for (let ai = 0; ai < nA; ai++) {
          for (let bi = 0; bi < nB; bi++) {
            const compatRawDeltaA = nA > 1 ? sumCompatibilityToOthers(codesB[bi], codesA, ai, weights) - oldSumA[ai] : 0;
            const compatRawDeltaB = nB > 1 ? sumCompatibilityToOthers(codesA[ai], codesB, bi, weights) - oldSumB[bi] : 0;
            const normalizedDeltaA = pairCountA > 0 ? compatRawDeltaA / (pairCountA * 100) : 0;
            const normalizedDeltaB = pairCountB > 0 ? compatRawDeltaB / (pairCountB * 100) : 0;

            let skillDeltaA = 0;
            let skillDeltaB = 0;
            if (nA > 0 && nB > 0) {
              const newAvgA: number[] = new Array(dims);
              const newAvgB: number[] = new Array(dims);
              for (let d = 0; d < dims; d++) {
                newAvgA[d] = avgSkillA[d] + (skillsB[bi][d] - skillsA[ai][d]) / nA;
                newAvgB[d] = avgSkillB[d] + (skillsA[ai][d] - skillsB[bi][d]) / nB;
              }
              skillDeltaA = skillBalanceFromAvg(newAvgA, globalAvgSkill) - skillBalanceBaseA;
              skillDeltaB = skillBalanceFromAvg(newAvgB, globalAvgSkill) - skillBalanceBaseB;
            }

            const delta =
              COMPATIBILITY_WEIGHT * (normalizedDeltaA + normalizedDeltaB) +
              SKILL_BALANCE_WEIGHT * (skillDeltaA + skillDeltaB);

            if (delta > bestDelta) {
              bestDelta = delta;
              bestSwap = { gi, ai, gj, bi };
            }
          }
        }
      }
    }

    if (!bestSwap) break;

    const { gi, ai, gj, bi } = bestSwap;
    const memberA = groups[gi].members[ai];
    const memberB = groups[gj].members[bi];
    groups[gi].members[ai] = memberB;
    groups[gj].members[bi] = memberA;
    groups[gi].roles[ai] = memberB.categoryKey ?? 'ไม่ระบุ';
    groups[gj].roles[bi] = memberA.categoryKey ?? 'ไม่ระบุ';
  }
}

function averageSkillVector(vectors: SkillVector[]): SkillVector {
  const dims = vectors[0]?.length ?? 0;
  const sums = new Array(dims).fill(0);
  for (const v of vectors) for (let d = 0; d < dims; d++) sums[d] += v[d];
  return sums.map((s) => s / vectors.length);
}

/** เลือกคู่ที่ควรโชว์เป็นเหตุผลให้ผู้ใช้เห็น: คู่ที่เข้ากันดีที่สุดในกลุ่ม (ถ้าไม่ได้ถูกแนะนำให้เลี่ยง) เสมอ
 * บวกทุกคู่ที่ถูกแนะนำให้เลี่ยงแต่สุดท้ายอยู่กลุ่มเดียวกันจริง (เกิดได้เมื่อขนาดกลุ่มบีบให้ต้องอยู่ด้วยกัน) — คำนวณครั้งเดียวหลังกลุ่มนิ่งแล้ว ไม่ใช่ hot loop */
function buildSynergyNotes(members: MatchInputMember[], template: string): SynergyNote[] {
  const notes: SynergyNote[] = [];
  let best: { i: number; j: number; result: ReturnType<typeof pairCompatibility> } | null = null;

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const result = pairCompatibility(members[i].code, members[j].code, template);
      if (result.avoid) {
        notes.push({ gmailA: members[i].gmail, gmailB: members[j].gmail, reasons: result.reasons, avoid: true });
      }
      if (!best || result.score > best.result.score) best = { i, j, result };
    }
  }

  if (best && !best.result.avoid) {
    notes.unshift({ gmailA: members[best.i].gmail, gmailB: members[best.j].gmail, reasons: best.result.reasons, avoid: false });
  }

  return notes;
}

export function computeGroups(input: ComputeGroupsInput): MatchedGroupResult[] {
  const { members, template } = input;
  const groupSize = Math.max(1, input.groupSize || 1);
  const numGroups = Math.max(1, Math.ceil(members.length / groupSize));

  const groups: WorkingGroup[] = Array.from({ length: numGroups }, (_, i) => ({ id: i + 1, members: [], roles: [] }));

  const globalAvgSkill = averageSkillVector(members.map((m) => m.skillVector));
  const capacities = balancedCapacities(members.length, numGroups);
  const weights = resolveAxisWeights(template);

  assignByCompatibilityConstruction(members, groups, capacities, globalAvgSkill, weights);
  localSearchImprove(groups, globalAvgSkill, weights);

  return groups.map((g, i) => ({
    id: g.id,
    name: `ทีม ${i + 1}`,
    members: g.members.map((m, idx) => ({
      gmail: m.gmail,
      name: m.name,
      avatarSeed: m.avatarSeed,
      avatarImage: m.avatarImage,
      role: g.roles[idx],
    })),
    synergyNotes: buildSynergyNotes(g.members, template),
  }));
}
