import { MBTI_CODES, typeIcon, type Axis } from './mbti';
import { designTypeTable } from './mbti-design';
import { presentationTypeTable } from './mbti-presentation';
import { programmingTypeTable } from './mbti-programming';
import { serviceTypeTable } from './mbti-service';

type TypeTable = Record<string, { title: string; description: string; jobs: string[] }>;

const TYPE_TABLES: Record<string, TypeTable> = {
  design: designTypeTable,
  presentation: presentationTypeTable,
  programming: programmingTypeTable,
  service: serviceTypeTable,
};

/** axis order matches how scoreMbti() builds the 4-letter code and buildAxisBars() orders its bars */
const AXIS_ORDER: Axis[] = ['EI', 'SN', 'TF', 'JP'];

function isValidMbtiResult(template: string, result: unknown): boolean {
  const table = TYPE_TABLES[template];
  if (!table) return false;
  if (typeof result !== 'object' || result === null) return false;
  const r = result as Record<string, unknown>;

  const code = r.code;
  if (typeof code !== 'string' || !(MBTI_CODES as readonly string[]).includes(code)) return false;

  const info = table[code];
  if (!info) return false;
  if (r.title !== info.title) return false;
  if (r.description !== info.description) return false;
  if (
    !Array.isArray(r.jobs) ||
    r.jobs.length !== info.jobs.length ||
    !r.jobs.every((job, i) => job === info.jobs[i])
  ) return false;
  if (r.icon !== typeIcon(code)) return false;

  const typeScores = r.typeScores;
  if (!Array.isArray(typeScores) || typeScores.length !== AXIS_ORDER.length) return false;
  for (let i = 0; i < AXIS_ORDER.length; i++) {
    const bar = typeScores[i];
    if (typeof bar !== 'object' || bar === null) return false;
    const b = bar as Record<string, unknown>;
    if (typeof b.title !== 'string' || b.title[0] !== code[i]) return false;
    if (typeof b.score !== 'number' || !Number.isInteger(b.score) || b.score < 0 || b.score > 100) return false;
  }

  return true;
}

/** Rejects fabricated/malformed MBTI results (e.g. hand-crafted API calls) by cross-checking
 *  every field against the canonical type table for that template — code, title, description,
 *  jobs, icon, and per-axis bar letters/icons must all agree with what scoreMbti() would have produced. */
export function isValidTypesPayload(types: unknown): boolean {
  if (typeof types !== 'object' || types === null) return false;
  return Object.entries(types as Record<string, unknown>).every(([template, result]) =>
    isValidMbtiResult(template, result)
  );
}
