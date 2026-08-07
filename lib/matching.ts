import type { AxisVector } from './mbti';
import { resolveTemplateTypes } from './type-composition';

/** ค่าเฉลี่ยรายเกณฑ์ประเมิน 11 ด้าน (0-100 ต่อด้าน) เรียงตาม CRITERIA_KEYS */
export type SkillVector = readonly number[];

export interface MatchInputMember {
  gmail: string;
  name: string;
  avatarSeed: number;
  avatarImage?: string | null;
  axisVector: AxisVector;
  categoryKey: string | null;
  categoryAffinities: Record<string, number>;
  /** คะแนนประเมินรวม (0-100) ใช้แค่จัดลำดับก่อนเติมกลุ่ม (spread คนคะแนนสูง/ต่ำ) ไม่ใช่ objective หลัก */
  evalScore: number;
  /** เวกเตอร์คะแนนรายเกณฑ์ 11 ด้าน — ใช้เป็น objective จริงสำหรับ skill balance (ละเอียดกว่า evalScore เดี่ยว) */
  skillVector: SkillVector;
}

export interface ComputeGroupsInput {
  members: MatchInputMember[];
  groupSize: number;
  matchMode: 'auto' | 'selection';
  typeComposition: Record<string, number>;
  template: string;
}

export interface MatchedGroupResult {
  id: number;
  name: string;
  members: { gmail: string; name: string; avatarSeed: number; avatarImage?: string | null; role: string }[];
}

interface WorkingGroup {
  id: number;
  members: MatchInputMember[];
  roles: string[]; // parallel to members — role label assigned to each member
}

export function pairDistance(a: AxisVector, b: AxisVector): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) + Math.abs(a[3] - b[3]);
}

export function marginalGain(existing: AxisVector[], candidate: AxisVector): number {
  let sum = 0;
  for (const v of existing) sum += pairDistance(v, candidate);
  return sum;
}

export function groupDiversity(vectors: AxisVector[]): number {
  let sum = 0;
  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) sum += pairDistance(vectors[i], vectors[j]);
  }
  return sum;
}

// น้ำหนักรวมของ objective function: MBTI diversity (แกนหลัก) vs skill balance (แกนรอง จากคะแนนประเมิน)
// ใช้สัดส่วนเดียวกับที่แอปนี้ใช้ผสม MBTI กับคะแนนประเมินอยู่แล้วตอนแนะนำหัวหน้าทีม (0.7/0.3)
const DIVERSITY_WEIGHT = 0.7;
const SKILL_BALANCE_WEIGHT = 0.3;
const MAX_AXIS_PAIR_DISTANCE = 8; // แต่ละแกนต่างกันได้สูงสุด 2 (-1..1) คูณ 4 แกน

/** ความหลากหลายของกลุ่ม normalize เป็น 0..1 (ค่าเฉลี่ย pairwise distance ต่อคู่ เทียบระยะสูงสุดที่เป็นไปได้) */
function normalizedGroupDiversity(vectors: AxisVector[]): number {
  const pairCount = (vectors.length * (vectors.length - 1)) / 2;
  if (pairCount === 0) return 0;
  return groupDiversity(vectors) / (pairCount * MAX_AXIS_PAIR_DISTANCE);
}

/** ความสมดุลของทักษะในกลุ่ม (11 เกณฑ์) normalize เป็น 0..1 — 1 คือค่าเฉลี่ยกลุ่มตรงกับค่าเฉลี่ยทั้งห้องทุกเกณฑ์พอดี
 * ใช้เวกเตอร์รายเกณฑ์แทนค่าเฉลี่ยรวมเดียว เพื่อไม่ให้กลุ่มไหนกองคนอ่อนด้านใดด้านหนึ่งไว้ด้วยกัน (เช่น cooperation ต่ำทั้งกลุ่ม)
 * ทั้งที่ค่าเฉลี่ยรวมอาจดูใกล้เคียงกลุ่มอื่น */
function skillBalance(skillVectors: SkillVector[], globalAvgVector: SkillVector): number {
  if (skillVectors.length === 0) return 1;
  const dims = globalAvgVector.length;
  let sumAbsDeviation = 0;
  for (let d = 0; d < dims; d++) {
    const groupAvgAtDim = skillVectors.reduce((sum, v) => sum + v[d], 0) / skillVectors.length;
    sumAbsDeviation += Math.abs(groupAvgAtDim - globalAvgVector[d]);
  }
  const avgDeviation = sumAbsDeviation / dims;
  return 1 - Math.min(1, avgDeviation / 100);
}

/** Objective function หลัก: ผสม MBTI diversity กับ skill balance ตามน้ำหนักด้านบน ใช้ทั้งตอนเลือกกลุ่มให้สมาชิกใหม่
 * และตอน local search — ให้สองขั้นตอนเพิ่มประสิทธิภาพเป้าหมายเดียวกัน ไม่ใช่แค่ diversity อย่างเดียว */
function combinedGroupScore(vectors: AxisVector[], skillVectors: SkillVector[], globalAvgVector: SkillVector): number {
  return DIVERSITY_WEIGHT * normalizedGroupDiversity(vectors) + SKILL_BALANCE_WEIGHT * skillBalance(skillVectors, globalAvgVector);
}

function centroidOf(members: MatchInputMember[]): AxisVector {
  const n = members.length;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0;
  for (const m of members) {
    s0 += m.axisVector[0]; s1 += m.axisVector[1]; s2 += m.axisVector[2]; s3 += m.axisVector[3];
  }
  return [s0 / n, s1 / n, s2 / n, s3 / n];
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

/** Deterministic greedy farthest-first traversal: picks the member farthest from the room centroid first,
 * then repeatedly the member farthest from all seeds picked so far — spreads group "anchors" maximally apart. */
function farthestPointSeeds(members: MatchInputMember[], k: number): MatchInputMember[] {
  const n = members.length;
  if (n === 0 || k <= 0) return [];

  const centroid = centroidOf(members);
  let seed1Idx = 0;
  let seed1Dist = -Infinity;
  members.forEach((m, i) => {
    const d = pairDistance(m.axisVector, centroid);
    if (d > seed1Dist) { seed1Dist = d; seed1Idx = i; }
  });

  const seeds: MatchInputMember[] = [members[seed1Idx]];
  const seedIdx = new Set([seed1Idx]);

  while (seeds.length < Math.min(k, n)) {
    let bestIdx = -1;
    let bestMinDist = -Infinity;
    members.forEach((m, i) => {
      if (seedIdx.has(i)) return;
      let minDist = Infinity;
      for (const s of seeds) minDist = Math.min(minDist, pairDistance(m.axisVector, s.axisVector));
      if (minDist > bestMinDist) { bestMinDist = minDist; bestIdx = i; }
    });
    if (bestIdx === -1) break;
    seeds.push(members[bestIdx]);
    seedIdx.add(bestIdx);
  }

  return seeds;
}

/** Auto mode, and selection mode with no typeComposition set — diversity + skill-balance maximizing construction. */
function assignByDiversityConstruction(members: MatchInputMember[], groups: WorkingGroup[], capacities: number[], globalAvgSkill: SkillVector): void {
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
      const vectorsAfter = [...g.members.map((mm) => mm.axisVector), m.axisVector];
      const skillVectorsAfter = [...g.members.map((mm) => mm.skillVector), m.skillVector];
      const score = combinedGroupScore(vectorsAfter, skillVectorsAfter, globalAvgSkill);
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    });
    if (bestIdx === -1) {
      bestIdx = groups.reduce((a, g, i) => (g.members.length < groups[a].members.length ? i : a), 0);
    }
    groups[bestIdx].members.push(m);
    groups[bestIdx].roles.push(m.categoryKey ?? 'ไม่ระบุ');
  }
}

/** Selection mode with typeComposition set — category counts per group are a hard constraint. */
function assignByComposition(
  members: MatchInputMember[],
  groups: WorkingGroup[],
  typeComposition: Record<string, number>,
  categories: string[],
  groupSize: number,
  globalAvgSkill: SkillVector
): void {
  let unassigned = stableSortDesc(members, (m) => m.evalScore);
  const numGroups = groups.length;

  for (const key of categories) {
    const count = typeComposition[key] ?? 0;
    if (!count) continue;

    const exact = unassigned.filter((m) => m.categoryKey === key);
    const fallback = stableSortDesc(unassigned.filter((m) => m.categoryKey !== key), (m) => m.categoryAffinities[key] ?? 0);
    const chosen = [...exact, ...fallback].slice(0, count * numGroups);
    const chosenGmails = new Set(chosen.map((m) => m.gmail));
    unassigned = unassigned.filter((m) => !chosenGmails.has(m.gmail));

    const remainingSlots = new Array(numGroups).fill(count);
    for (const m of chosen) {
      let bestIdx = -1;
      let bestScore = -Infinity;
      groups.forEach((g, i) => {
        if (remainingSlots[i] <= 0) return;
        const vectorsAfter = [...g.members.map((mm) => mm.axisVector), m.axisVector];
        const skillVectorsAfter = [...g.members.map((mm) => mm.skillVector), m.skillVector];
        const score = combinedGroupScore(vectorsAfter, skillVectorsAfter, globalAvgSkill);
        if (score > bestScore) { bestScore = score; bestIdx = i; }
      });
      if (bestIdx === -1) continue;
      groups[bestIdx].members.push(m);
      groups[bestIdx].roles.push(key);
      remainingSlots[bestIdx] -= 1;
    }
  }

  // สมาชิกที่เหลือ (ไม่ครอบคลุมโดย composition ใดๆ) → ใส่กลุ่มที่ยังไม่ครบ groupSize ก่อน
  for (const m of unassigned) {
    const underCap = groups.filter((g) => g.members.length < groupSize);
    const pool = underCap.length > 0 ? underCap : groups;
    let best = pool[0];
    for (const g of pool) if (g.members.length < best.members.length) best = g;
    best.members.push(m);
    best.roles.push(m.categoryKey ?? 'ไม่ระบุ');
  }
}

/** Bounded 2-opt local search: swap two members across groups whenever it improves the combined
 * diversity+skill-balance objective. When roleLocked, only swaps within the same role slot so
 * typeComposition category counts never change. */
function localSearchImprove(groups: WorkingGroup[], roleLocked: boolean, globalAvgSkill: SkillVector): void {
  const maxRounds = 50;

  for (let round = 0; round < maxRounds; round++) {
    let bestDelta = 0;
    let bestSwap: { gi: number; ai: number; gj: number; bi: number } | null = null;

    for (let gi = 0; gi < groups.length; gi++) {
      for (let gj = gi + 1; gj < groups.length; gj++) {
        const groupA = groups[gi];
        const groupB = groups[gj];
        const vecsA = groupA.members.map((m) => m.axisVector);
        const vecsB = groupB.members.map((m) => m.axisVector);
        const skillsA = groupA.members.map((m) => m.skillVector);
        const skillsB = groupB.members.map((m) => m.skillVector);
        const baseA = combinedGroupScore(vecsA, skillsA, globalAvgSkill);
        const baseB = combinedGroupScore(vecsB, skillsB, globalAvgSkill);

        for (let ai = 0; ai < groupA.members.length; ai++) {
          for (let bi = 0; bi < groupB.members.length; bi++) {
            if (roleLocked && groupA.roles[ai] !== groupB.roles[bi]) continue;

            const vecsAAfter = vecsA.map((v, idx) => (idx === ai ? vecsB[bi] : v));
            const vecsBAfter = vecsB.map((v, idx) => (idx === bi ? vecsA[ai] : v));
            const skillsAAfter = skillsA.map((v, idx) => (idx === ai ? skillsB[bi] : v));
            const skillsBAfter = skillsB.map((v, idx) => (idx === bi ? skillsA[ai] : v));
            const delta =
              (combinedGroupScore(vecsAAfter, skillsAAfter, globalAvgSkill) - baseA) +
              (combinedGroupScore(vecsBAfter, skillsBAfter, globalAvgSkill) - baseB);

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

    if (!roleLocked) {
      groups[gi].roles[ai] = memberB.categoryKey ?? 'ไม่ระบุ';
      groups[gj].roles[bi] = memberA.categoryKey ?? 'ไม่ระบุ';
    }
    // roleLocked: roles at the swapped positions are already equal (guaranteed by the filter above), no update needed
  }
}

function averageSkillVector(vectors: SkillVector[]): SkillVector {
  const dims = vectors[0]?.length ?? 0;
  const sums = new Array(dims).fill(0);
  for (const v of vectors) for (let d = 0; d < dims; d++) sums[d] += v[d];
  return sums.map((s) => s / vectors.length);
}

export function computeGroups(input: ComputeGroupsInput): MatchedGroupResult[] {
  const { members, matchMode, typeComposition, template } = input;
  const groupSize = Math.max(1, input.groupSize || 1);
  const numGroups = Math.max(1, Math.ceil(members.length / groupSize));

  const groups: WorkingGroup[] = Array.from({ length: numGroups }, (_, i) => ({ id: i + 1, members: [], roles: [] }));

  const globalAvgSkill = averageSkillVector(members.map((m) => m.skillVector));
  const hasComposition = matchMode === 'selection' && Object.values(typeComposition).some((v) => v > 0);

  if (hasComposition) {
    const categories = resolveTemplateTypes(template).map((t) => t.key);
    assignByComposition(members, groups, typeComposition, categories, groupSize, globalAvgSkill);
    localSearchImprove(groups, true, globalAvgSkill);
  } else {
    const capacities = balancedCapacities(members.length, numGroups);
    assignByDiversityConstruction(members, groups, capacities, globalAvgSkill);
    localSearchImprove(groups, false, globalAvgSkill);
  }

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
  }));
}
