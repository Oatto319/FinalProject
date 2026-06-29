import { typeIcon } from './mbti';

export type TypeOption = { key: string; label: string; icon: string };

// Each template's 4 composition categories are tagged with one of the 4 Keirsey
// temperament icons (brain=NT, idea=NF, pencil=SP, make=SJ) that typeIcon() derives
// from a member's MBTI code — this is how a 16-type result maps down to one of the
// host's 4 composition buckets.
export const TYPES_BY_TEMPLATE: Record<string, TypeOption[]> = {
  programming: [
    { key: 'นักวิเคราะห์', label: 'นักวิเคราะห์', icon: '/img/brain.png' },
    { key: 'นักคิดสร้างสรรค์', label: 'นักคิดสร้างสรรค์', icon: '/img/idea.png' },
    { key: 'ผู้ปฏิบัติการ', label: 'ผู้ปฏิบัติการ', icon: '/img/pencil.png' },
    { key: 'นักประสานงาน', label: 'นักประสานงาน', icon: '/img/make.png' },
  ],
  service: [
    { key: 'นักสื่อสาร', label: 'นักสื่อสาร', icon: '/img/make.png' },
    { key: 'นักแก้ปัญหา', label: 'นักแก้ปัญหา', icon: '/img/brain.png' },
    { key: 'ผู้ฟัง', label: 'ผู้ฟัง', icon: '/img/idea.png' },
    { key: 'ผู้ปฏิบัติการ', label: 'ผู้ปฏิบัติการ', icon: '/img/pencil.png' },
  ],
  presentation: [
    { key: 'นักพูด', label: 'นักพูด', icon: '/img/idea.png' },
    { key: 'นักวิจัย', label: 'นักวิจัย', icon: '/img/brain.png' },
    { key: 'นักออกแบบ', label: 'นักออกแบบ', icon: '/img/pencil.png' },
    { key: 'ผู้ประสานงาน', label: 'ผู้ประสานงาน', icon: '/img/make.png' },
  ],
  design: [
    { key: 'นักสร้างสรรค์', label: 'นักสร้างสรรค์', icon: '/img/idea.png' },
    { key: 'นักวิเคราะห์', label: 'นักวิเคราะห์', icon: '/img/brain.png' },
    { key: 'ผู้ปฏิบัติ', label: 'ผู้ปฏิบัติ', icon: '/img/pencil.png' },
    { key: 'ผู้ประสานงาน', label: 'ผู้ประสานงาน', icon: '/img/make.png' },
  ],
};

export const DEFAULT_TEMPLATE_TYPES = TYPES_BY_TEMPLATE.programming;

export function resolveTemplateTypes(template: string): TypeOption[] {
  return TYPES_BY_TEMPLATE[template.toLowerCase()] ?? DEFAULT_TEMPLATE_TYPES;
}

/** Maps a member's MBTI code to whichever of the template's 4 categories shares its temperament icon. */
export function categoryKeyForCode(template: string, code: string): string | null {
  const icon = typeIcon(code);
  return resolveTemplateTypes(template).find((o) => o.icon === icon)?.key ?? null;
}

const AXIS_PARTNER: Record<string, string> = { E: 'I', I: 'E', S: 'N', N: 'S', T: 'F', F: 'T', J: 'P', P: 'J' };

/** 0-100 affinity toward `letter`, derived from whichever axis bar covers that letter's axis. */
function letterAffinity(typeScores: { title: string; score: number }[], letter: string): number {
  const partner = AXIS_PARTNER[letter];
  const bar = typeScores.find((b) => b.title[0] === letter || b.title[0] === partner);
  if (!bar) return 50;
  return bar.title[0] === letter ? bar.score : 100 - bar.score;
}

/**
 * 0-100 fit score for each of the template's 4 categories, derived from a member's axis
 * bars. Used as a tie-breaker when no unassigned member exactly matches a composition slot.
 */
export function categoryAffinities(template: string, typeScores: { title: string; score: number }[]): Record<string, number> {
  const N = letterAffinity(typeScores, 'N');
  const T = letterAffinity(typeScores, 'T');
  const J = letterAffinity(typeScores, 'J');
  const affinityByIcon: Record<string, number> = {
    '/img/brain.png': (N + T) / 2,
    '/img/idea.png': (N + (100 - T)) / 2,
    '/img/make.png': (100 - N + J) / 2,
    '/img/pencil.png': (100 - N + (100 - J)) / 2,
  };
  const result: Record<string, number> = {};
  for (const opt of resolveTemplateTypes(template)) result[opt.key] = affinityByIcon[opt.icon] ?? 0;
  return result;
}
