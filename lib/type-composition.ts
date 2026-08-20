import { typeIcon } from './mbti';

export type TypeOption = { key: string; label: string; icon: string; subtitle?: string };

// ทุก template ใช้ 4 กลุ่มหลัก MBTI เหมือนกัน (NT/NF/SJ/SP)
// key/icon เหล่านี้ตรงกับที่ typeIcon() คืนค่า จึงทำงานกับ matching algorithm ได้โดยไม่ต้องเปลี่ยนอะไรเพิ่ม
const MBTI_GROUP_TYPES: TypeOption[] = [
  { key: 'Analysts',  label: 'Analysts',  subtitle: 'NT', icon: '/img/brain.png'  },
  { key: 'Diplomats', label: 'Diplomats', subtitle: 'NF', icon: '/img/idea.png'   },
  { key: 'Sentinels', label: 'Sentinels', subtitle: 'SJ', icon: '/img/make.png'   },
  { key: 'Explorers', label: 'Explorers', subtitle: 'SP', icon: '/img/pencil.png' },
];

export const TYPES_BY_TEMPLATE: Record<string, TypeOption[]> = {
  programming:  MBTI_GROUP_TYPES,
  service:      MBTI_GROUP_TYPES,
  presentation: MBTI_GROUP_TYPES,
  design:       MBTI_GROUP_TYPES,
};

export const DEFAULT_TEMPLATE_TYPES = MBTI_GROUP_TYPES;

export function resolveTemplateTypes(template: string): TypeOption[] {
  return TYPES_BY_TEMPLATE[template.toLowerCase()] ?? DEFAULT_TEMPLATE_TYPES;
}

/** Maps a member's MBTI code to whichever of the 4 group categories shares its temperament icon. */
export function categoryKeyForCode(template: string, code: string): string | null {
  const icon = typeIcon(code);
  return resolveTemplateTypes(template).find((o) => o.icon === icon)?.key ?? null;
}
