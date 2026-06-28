// Shared MBTI (16-type) catalogue — single source of truth for groups, types,
// and the variant (Assertive/Turbulent) notes used across quiz scoring,
// "My Type", room Type Composition, and team result displays.

export type GroupKey = 'analyst' | 'diplomat' | 'sentinel' | 'explorer';
export type Variant = 'A' | 'T';
export type AxisKey = 'EI' | 'SN' | 'TF' | 'JP' | 'AT';

export interface GroupInfo {
  key: GroupKey;
  label: string;
  color: string;
}

export interface TypeInfo {
  code: string;
  group: GroupKey;
  description: string;
  jobs: string[];
}

export type AxisScores = Record<AxisKey, number>;

export interface MBTIResult {
  code: string;
  variant: Variant;
  fullCode: string;
  group: GroupKey;
  groupLabel: string;
  description: string;
  variantNote: string;
  jobs: string[];
  axisScores: AxisScores;
  completedAt: string;
}

export const GROUPS: GroupInfo[] = [
  { key: 'analyst',  label: 'นักวิเคราะห์', color: '#6D58B9' },
  { key: 'diplomat', label: 'นักการทูต',    color: '#3FA796' },
  { key: 'sentinel', label: 'ผู้พิทักษ์',     color: '#4F86C6' },
  { key: 'explorer', label: 'นักสำรวจ',      color: '#E08E45' },
];

export const GROUP_LABELS = Object.fromEntries(GROUPS.map((g) => [g.key, g.label])) as Record<GroupKey, string>;
export const GROUP_COLORS = Object.fromEntries(GROUPS.map((g) => [g.key, g.color])) as Record<GroupKey, string>;

export const TYPES: Record<string, TypeInfo> = {
  INTJ: {
    code: 'INTJ', group: 'analyst',
    description: 'คุณวางแผนเชิงกลยุทธ์ มองภาพรวมของระบบและสถาปัตยกรรมก่อนลงมือทำ มั่นใจในตรรกะของตัวเองและพร้อมรับผิดชอบงานที่ซับซ้อนระยะยาว',
    jobs: ['Software Architect', 'System Designer', 'AI/ML Engineer', 'Backend Developer', 'Technical Lead'],
  },
  INTP: {
    code: 'INTP', group: 'analyst',
    description: 'คุณชอบขบคิดปัญหาเชิงทฤษฎี ทดลองแนวทางใหม่ๆ และสนุกกับการทำความเข้าใจว่าระบบทำงานอย่างไรในเชิงลึก',
    jobs: ['R&D Engineer', 'Algorithm Engineer', 'Backend Developer', 'Security Researcher', 'Data Scientist'],
  },
  ENTJ: {
    code: 'ENTJ', group: 'analyst',
    description: 'คุณมีภาวะผู้นำสูง ตัดสินใจเร็วจากข้อมูล และผลักดันให้ทีมเดินตามแผนและ deadline ได้อย่างมีประสิทธิภาพ',
    jobs: ['Engineering Manager', 'Tech Lead', 'Project Manager', 'Product Owner', 'Software Architect'],
  },
  ENTP: {
    code: 'ENTP', group: 'analyst',
    description: 'คุณชอบถกเถียงไอเดียใหม่ๆ มองหาวิธีแก้ปัญหาที่แตกต่างจากเดิม และปรับตัวได้เร็วเมื่อต้องเรียนรู้เทคโนโลยีใหม่',
    jobs: ['Full-stack Developer', 'Innovation Engineer', 'Startup CTO', 'Developer Relations', 'Solutions Architect'],
  },
  INFJ: {
    code: 'INFJ', group: 'diplomat',
    description: 'คุณใส่ใจว่าสิ่งที่สร้างขึ้นจะส่งผลต่อผู้ใช้อย่างไร มองภาพรวมเชิงคุณค่าและจริยธรรมของผลิตภัณฑ์ไปพร้อมกับรายละเอียด',
    jobs: ['UX Researcher', 'Product Designer', 'Accessibility Engineer', 'Frontend Developer', 'Product Manager'],
  },
  INFP: {
    code: 'INFP', group: 'diplomat',
    description: 'คุณทำงานตามค่านิยมของตัวเอง ชอบงานที่มีความหมาย และใส่ใจรายละเอียดที่ทำให้ผลิตภัณฑ์ดีขึ้นในแบบที่คุณเชื่อ',
    jobs: ['UI/UX Designer', 'Frontend Developer', 'Creative Technologist', 'Content Engineer', 'Product Designer'],
  },
  ENFJ: {
    code: 'ENFJ', group: 'diplomat',
    description: 'คุณดูแลความสัมพันธ์ในทีม ผลักดันให้ทุกคนทำงานร่วมกันได้ดี และใส่ใจประสบการณ์การทำงานของคนรอบตัว',
    jobs: ['Engineering Manager', 'Scrum Master', 'Developer Advocate', 'Product Manager', 'Team Lead'],
  },
  ENFP: {
    code: 'ENFP', group: 'diplomat',
    description: 'คุณมีพลังและไอเดียเยอะ ชอบ brainstorm feature ใหม่ๆ และสื่อสารไอเดียให้ทีมเห็นภาพได้ง่าย',
    jobs: ['Product Manager', 'Frontend Developer', 'UX Designer', 'Developer Relations', 'Growth Engineer'],
  },
  ISTJ: {
    code: 'ISTJ', group: 'sentinel',
    description: 'คุณทำงานตามขั้นตอนที่ชัดเจน รักษาคุณภาพและความสม่ำเสมอของระบบ และเป็นคนที่ทีมพึ่งพาได้เรื่อง deadline',
    jobs: ['QA Engineer', 'System Administrator', 'Database Administrator', 'DevOps Engineer', 'Backend Developer'],
  },
  ISFJ: {
    code: 'ISFJ', group: 'sentinel',
    description: 'คุณใส่ใจรายละเอียดเล็กๆที่คนอื่นมองข้าม ดูแล maintain ระบบให้มั่นคง และเอาใจใส่ทีมกับผู้ใช้เสมอ',
    jobs: ['QA Engineer', 'Technical Support Engineer', 'Documentation Engineer', 'Maintenance Developer', 'Customer Success Engineer'],
  },
  ESTJ: {
    code: 'ESTJ', group: 'sentinel',
    description: 'คุณบริหารจัดการ scope และ timeline ได้ดี ชอบกระบวนการที่ชัดเจน วัดผลได้ และเดินตามแผนอย่างมีระเบียบ',
    jobs: ['Project Manager', 'Engineering Manager', 'Release Manager', 'QA Lead', 'DevOps Lead'],
  },
  ESFJ: {
    code: 'ESFJ', group: 'sentinel',
    description: 'คุณดูแลให้ทีมทำงานราบรื่น ใส่ใจความสัมพันธ์และบรรยากาศการทำงาน และสื่อสารระหว่างทีมเทคนิคกับฝ่ายอื่นได้ดี',
    jobs: ['Project Coordinator', 'Scrum Master', 'Business Analyst', 'Technical Support Lead', 'Customer Success Manager'],
  },
  ISTP: {
    code: 'ISTP', group: 'explorer',
    description: 'คุณชอบลงมือแก้ปัญหาที่จับต้องได้ เข้าใจระบบจากการลงมือทำจริง และปรับตัวได้เร็วเมื่อเจอปัญหาหน้างาน',
    jobs: ['DevOps Engineer', 'Infrastructure Engineer', 'Backend Developer', 'Embedded Systems Engineer', 'Site Reliability Engineer'],
  },
  ISFP: {
    code: 'ISFP', group: 'explorer',
    description: 'คุณใส่ใจความสวยงามและประสบการณ์ผู้ใช้ ทำงานอย่างประณีต และชอบงานที่ได้แสดงออกทางความคิดสร้างสรรค์',
    jobs: ['UI Designer', 'Frontend Developer', 'Visual Designer', 'Mobile App Developer', 'Product Designer'],
  },
  ESTP: {
    code: 'ESTP', group: 'explorer',
    description: 'คุณตอบสนองรวดเร็วเมื่อเจอปัญหาเร่งด่วน ชอบงานที่เห็นผลทันที และไม่ชอบติดอยู่กับทฤษฎีนานเกินไป',
    jobs: ['Site Reliability Engineer', 'Support Engineer', 'Full-stack Developer', 'Incident Response Engineer', 'Solutions Engineer'],
  },
  ESFP: {
    code: 'ESFP', group: 'explorer',
    description: 'คุณสร้างบรรยากาศการทำงานที่สนุกและมีพลัง ชอบงานที่ได้ปฏิสัมพันธ์กับคนอื่น และนำเสนอผลงานได้น่าสนใจ',
    jobs: ['Developer Advocate', 'Solutions Engineer', 'Frontend Developer', 'Customer Success Engineer', 'Technical Evangelist'],
  },
};

export const VARIANT_NOTES: Record<Variant, string> = {
  A: 'แบบ Assertive: คุณมั่นใจในการตัดสินใจของตัวเอง รับมือกับความเครียดและ feedback ได้อย่างใจเย็น ไม่ค่อยหวั่นไหวกับความผิดพลาด',
  T: 'แบบ Turbulent: คุณตั้งมาตรฐานสูงกับตัวเอง ใส่ใจรายละเอียดและผลลัพธ์มาก ทำให้พัฒนาตัวเองอยู่เสมอ แต่ควรระวังความเครียดจากความสมบูรณ์แบบ',
};

export const AXIS_LABELS: Record<AxisKey, { posLetter: string; negLetter: string; pos: string; neg: string }> = {
  EI: { posLetter: 'E', negLetter: 'I', pos: 'Extravert', neg: 'Introvert' },
  SN: { posLetter: 'S', negLetter: 'N', pos: 'Sensing', neg: 'Intuition' },
  TF: { posLetter: 'T', negLetter: 'F', pos: 'Thinking', neg: 'Feeling' },
  JP: { posLetter: 'J', negLetter: 'P', pos: 'Judging', neg: 'Perceiving' },
  AT: { posLetter: 'A', negLetter: 'T', pos: 'Assertive', neg: 'Turbulent' },
};

export function resolveGroup(SN: 'S' | 'N', TF: 'T' | 'F', JP: 'J' | 'P'): GroupKey {
  if (SN === 'N') return TF === 'T' ? 'analyst' : 'diplomat';
  return JP === 'J' ? 'sentinel' : 'explorer';
}

// แปลงผลรวมคะแนนแกน (-maxAbs..+maxAbs) เป็น % ของขั้วบวก (posLetter) สำหรับแสดงเป็นแท่งกราฟ
export function axisToPct(sum: number, maxAbs: number): number {
  const clamped = Math.max(-maxAbs, Math.min(maxAbs, sum));
  return Math.round(((clamped + maxAbs) / (maxAbs * 2)) * 100);
}

// ค่า pole มาตรฐาน: เห็นด้วย (1-3) = ขั้วบวกของคำถาม, ไม่เห็นด้วย (5-7) = ขั้วลบ, กลางๆ (4) = 0
export function pole(val: number): number {
  return val <= 3 ? 1 : val >= 5 ? -1 : 0;
}

export function buildResult(
  rawSums: { EI: number; SN: number; TF: number; JP: number; AT: number },
  maxAbs = 4
): MBTIResult {
  const E_I: 'E' | 'I' = rawSums.EI >= 0 ? 'E' : 'I';
  const S_N: 'S' | 'N' = rawSums.SN >= 0 ? 'S' : 'N';
  const T_F: 'T' | 'F' = rawSums.TF >= 0 ? 'T' : 'F';
  const J_P: 'J' | 'P' = rawSums.JP >= 0 ? 'J' : 'P';
  const variant: Variant = rawSums.AT >= 0 ? 'A' : 'T';

  const code = `${E_I}${S_N}${T_F}${J_P}`;
  const group = resolveGroup(S_N, T_F, J_P);
  const info = TYPES[code];

  return {
    code,
    variant,
    fullCode: `${code}-${variant}`,
    group,
    groupLabel: GROUP_LABELS[group],
    description: info.description,
    variantNote: VARIANT_NOTES[variant],
    jobs: info.jobs,
    axisScores: {
      EI: axisToPct(rawSums.EI, maxAbs),
      SN: axisToPct(rawSums.SN, maxAbs),
      TF: axisToPct(rawSums.TF, maxAbs),
      JP: axisToPct(rawSums.JP, maxAbs),
      AT: axisToPct(rawSums.AT, maxAbs),
    },
    completedAt: new Date().toISOString(),
  };
}
