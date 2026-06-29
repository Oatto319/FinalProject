// Shared MBTI (16-type) catalogue — single source of truth for groups, types,
// and the variant (Assertive/Turbulent) notes used across quiz scoring,
// "My Type", room Type Composition, and team result displays.

export type GroupKey = 'analyst' | 'diplomat' | 'sentinel' | 'explorer';
export type Variant = 'A' | 'T';
export type AxisKey = 'EI' | 'SN' | 'TF' | 'JP' | 'AT';
export type TemplateId = 'programming' | 'service' | 'presentation' | 'design';

export interface GroupInfo {
  key: GroupKey;
  label: string;
  color: string;
}

export interface TypeInfo {
  code: string;
  group: GroupKey;
  description: string;
  jobs: Record<TemplateId, string[]>;
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
    jobs: {
      programming: ['Software Architect', 'System Designer', 'AI/ML Engineer', 'Backend Developer', 'Technical Lead'],
      service: ['Escalation Specialist', 'Service Strategy Analyst', 'QA Lead', 'Process Improvement Analyst', 'Knowledge Base Architect'],
      presentation: ['Keynote Speaker', 'Strategy Consultant', 'Policy Analyst & Presenter', 'Technical Briefing Lead', 'Research Presenter'],
      design: ['Design Strategist', 'UX Architect', 'Information Architect', 'Design Systems Lead', 'Product Design Lead'],
    },
  },
  INTP: {
    code: 'INTP', group: 'analyst',
    description: 'คุณชอบขบคิดปัญหาเชิงทฤษฎี ทดลองแนวทางใหม่ๆ และสนุกกับการทำความเข้าใจว่าระบบทำงานอย่างไรในเชิงลึก',
    jobs: {
      programming: ['R&D Engineer', 'Algorithm Engineer', 'Backend Developer', 'Security Researcher', 'Data Scientist'],
      service: ['Technical Support Specialist', 'Troubleshooting Analyst', 'Support Tools Engineer', 'Root Cause Analyst', 'Self-Service/Chatbot Designer'],
      presentation: ['Subject-Matter Expert Presenter', 'Conference Panelist', 'Research Analyst Presenter', 'Whitepaper Author & Presenter', 'Academic Lecturer'],
      design: ['UX Researcher', 'Design Theory Researcher', 'Interaction Design Specialist', 'Design Systems Engineer', 'Experimental Design Prototyper'],
    },
  },
  ENTJ: {
    code: 'ENTJ', group: 'analyst',
    description: 'คุณมีภาวะผู้นำสูง ตัดสินใจเร็วจากข้อมูล และผลักดันให้ทีมเดินตามแผนและ deadline ได้อย่างมีประสิทธิภาพ',
    jobs: {
      programming: ['Engineering Manager', 'Tech Lead', 'Project Manager', 'Product Owner', 'Software Architect'],
      service: ['Customer Support Manager', 'Service Operations Lead', 'Escalation Manager', 'Service Strategy Director', 'Support Team Lead'],
      presentation: ['Executive Presenter', 'Pitch/Investor Relations Lead', 'Conference Keynote Speaker', 'Debate & Negotiation Lead', 'Training Director'],
      design: ['Creative Director', 'Design Team Lead', 'Design Operations Manager', 'Brand Strategy Director', 'Product Design Manager'],
    },
  },
  ENTP: {
    code: 'ENTP', group: 'analyst',
    description: 'คุณชอบถกเถียงไอเดียใหม่ๆ มองหาวิธีแก้ปัญหาที่แตกต่างจากเดิม และปรับตัวได้เร็วเมื่อต้องเรียนรู้เทคโนโลยีใหม่',
    jobs: {
      programming: ['Full-stack Developer', 'Innovation Engineer', 'Startup CTO', 'Developer Relations', 'Solutions Architect'],
      service: ['Customer Solutions Specialist', 'Service Innovation Lead', 'Retention Specialist', 'Complex-Case Negotiator', 'Support Process Designer'],
      presentation: ['Public Speaker', 'Idea Pitch Specialist', 'Panel Moderator', 'Improv-Style Presenter', 'Innovation Showcase Host'],
      design: ['Concept Designer', 'Innovation/Creative Lead', 'Brand Concept Designer', 'Design Hackathon Lead', 'Creative Technologist'],
    },
  },
  INFJ: {
    code: 'INFJ', group: 'diplomat',
    description: 'คุณใส่ใจว่าสิ่งที่สร้างขึ้นจะส่งผลต่อผู้ใช้อย่างไร มองภาพรวมเชิงคุณค่าและจริยธรรมของผลิตภัณฑ์ไปพร้อมกับรายละเอียด',
    jobs: {
      programming: ['UX Researcher', 'Product Designer', 'Accessibility Engineer', 'Frontend Developer', 'Product Manager'],
      service: ['Customer Experience Specialist', 'Client Advocate', 'Support Counselor', 'Voice-of-Customer Analyst', 'Trust & Safety Specialist'],
      presentation: ['Inspirational Speaker', 'Storytelling Presenter', 'Workshop Facilitator', 'Advocacy Spokesperson', 'TEDx-style Speaker'],
      design: ['UX Designer', 'Service Designer', 'Accessibility Design Specialist', 'User Research Lead', 'Design Ethics Advocate'],
    },
  },
  INFP: {
    code: 'INFP', group: 'diplomat',
    description: 'คุณทำงานตามค่านิยมของตัวเอง ชอบงานที่มีความหมาย และใส่ใจรายละเอียดที่ทำให้ผลิตภัณฑ์ดีขึ้นในแบบที่คุณเชื่อ',
    jobs: {
      programming: ['UI/UX Designer', 'Frontend Developer', 'Creative Technologist', 'Content Engineer', 'Product Designer'],
      service: ['Customer Care Representative', 'Empathy-Led Support Agent', 'Community Support Specialist', 'Client Wellness Liaison', 'Volunteer Coordinator'],
      presentation: ['Storytelling Presenter', 'Creative Pitch Presenter', 'Personal-Brand Speaker', 'Advocacy Presenter', 'Content Creator & Presenter'],
      design: ['Illustrator', 'Brand/Visual Identity Designer', 'Concept Artist', 'Storyboard Artist', 'Personal-Brand Designer'],
    },
  },
  ENFJ: {
    code: 'ENFJ', group: 'diplomat',
    description: 'คุณดูแลความสัมพันธ์ในทีม ผลักดันให้ทุกคนทำงานร่วมกันได้ดี และใส่ใจประสบการณ์การทำงานของคนรอบตัว',
    jobs: {
      programming: ['Engineering Manager', 'Scrum Master', 'Developer Advocate', 'Product Manager', 'Team Lead'],
      service: ['Customer Success Manager', 'Account Manager', 'Client Relationship Lead', 'Onboarding Specialist', 'Support Coaching Lead'],
      presentation: ['Motivational Speaker', 'Training & Development Lead', 'Town Hall Host', 'Brand Ambassador Speaker', 'Coach/Mentor Presenter'],
      design: ['Design Team Lead', 'Design Workshop Facilitator', 'Client-Facing Design Lead', 'Design Mentor', 'Co-Design Facilitator'],
    },
  },
  ENFP: {
    code: 'ENFP', group: 'diplomat',
    description: 'คุณมีพลังและไอเดียเยอะ ชอบ brainstorm feature ใหม่ๆ และสื่อสารไอเดียให้ทีมเห็นภาพได้ง่าย',
    jobs: {
      programming: ['Product Manager', 'Frontend Developer', 'UX Designer', 'Developer Relations', 'Growth Engineer'],
      service: ['Community Manager', 'Social Media Support Specialist', 'Brand Ambassador', 'Customer Engagement Specialist', 'Outreach Coordinator'],
      presentation: ['Brand Storyteller', 'Event Host/Emcee', 'Pitch Competition Presenter', 'Social Campaign Spokesperson', 'Creative Workshop Leader'],
      design: ['Creative Director', 'Brand Designer', 'Campaign Concept Designer', 'Moodboard/Vision Designer', 'Design Community Lead'],
    },
  },
  ISTJ: {
    code: 'ISTJ', group: 'sentinel',
    description: 'คุณทำงานตามขั้นตอนที่ชัดเจน รักษาคุณภาพและความสม่ำเสมอของระบบ และเป็นคนที่ทีมพึ่งพาได้เรื่อง deadline',
    jobs: {
      programming: ['QA Engineer', 'System Administrator', 'Database Administrator', 'DevOps Engineer', 'Backend Developer'],
      service: ['Help Desk Analyst', 'Service Desk Specialist', 'Compliance/Policy Support Officer', 'Ticketing Systems Administrator', 'SLA Coordinator'],
      presentation: ['Technical Report Presenter', 'Compliance/Audit Briefing Lead', 'Policy Briefing Officer', 'SOP Trainer', 'Data Reporting Specialist'],
      design: ['Production Designer', 'Design QA Specialist', 'Design Standards Officer', 'Print Production Designer', 'Design Documentation Lead'],
    },
  },
  ISFJ: {
    code: 'ISFJ', group: 'sentinel',
    description: 'คุณใส่ใจรายละเอียดเล็กๆที่คนอื่นมองข้าม ดูแล maintain ระบบให้มั่นคง และเอาใจใส่ทีมกับผู้ใช้เสมอ',
    jobs: {
      programming: ['QA Engineer', 'Technical Support Engineer', 'Documentation Engineer', 'Maintenance Developer', 'Customer Success Engineer'],
      service: ['Customer Care Specialist', 'Client Support Coordinator', 'Service Desk Representative', 'After-Sales Support Officer', 'Loyalty Program Coordinator'],
      presentation: ['Internal Training Presenter', 'Onboarding Presenter', 'Support Documentation Presenter', 'Community Workshop Host', 'Client Education Presenter'],
      design: ['UI Polish Designer', 'Design Support Specialist', 'Style Guide Maintainer', 'Detail-Oriented Visual Designer', 'Client Revision Specialist'],
    },
  },
  ESTJ: {
    code: 'ESTJ', group: 'sentinel',
    description: 'คุณบริหารจัดการ scope และ timeline ได้ดี ชอบกระบวนการที่ชัดเจน วัดผลได้ และเดินตามแผนอย่างมีระเบียบ',
    jobs: {
      programming: ['Project Manager', 'Engineering Manager', 'Release Manager', 'QA Lead', 'DevOps Lead'],
      service: ['Support Operations Manager', 'Call Center Supervisor', 'Service Delivery Manager', 'Quality Assurance Manager', 'Vendor/Service Coordinator'],
      presentation: ['Project Status Presenter', 'Operations Briefing Lead', 'Training Program Manager', 'Town Hall/All-Hands Host', 'Sales Presentation Manager'],
      design: ['Design Operations Manager', 'Production Manager', 'Design Project Manager', 'Studio Manager', 'Design Process Lead'],
    },
  },
  ESFJ: {
    code: 'ESFJ', group: 'sentinel',
    description: 'คุณดูแลให้ทีมทำงานราบรื่น ใส่ใจความสัมพันธ์และบรรยากาศการทำงาน และสื่อสารระหว่างทีมเทคนิคกับฝ่ายอื่นได้ดี',
    jobs: {
      programming: ['Project Coordinator', 'Scrum Master', 'Business Analyst', 'Technical Support Lead', 'Customer Success Manager'],
      service: ['Customer Service Representative', 'Front-Desk Lead', 'Account Coordinator', 'Client Relations Officer', 'Hospitality Service Manager'],
      presentation: ['Event Coordinator & Host', 'Orientation Presenter', 'Client Briefing Specialist', 'Team Training Lead', 'Community Outreach Presenter'],
      design: ['Client Liaison Designer', 'Design Account Manager', 'Creative Producer', 'Design Team Coordinator', 'Studio Coordinator'],
    },
  },
  ISTP: {
    code: 'ISTP', group: 'explorer',
    description: 'คุณชอบลงมือแก้ปัญหาที่จับต้องได้ เข้าใจระบบจากการลงมือทำจริง และปรับตัวได้เร็วเมื่อเจอปัญหาหน้างาน',
    jobs: {
      programming: ['DevOps Engineer', 'Infrastructure Engineer', 'Backend Developer', 'Embedded Systems Engineer', 'Site Reliability Engineer'],
      service: ['Field Service Technician', 'Technical Troubleshooter', 'IT Support Technician', 'Repair/Service Specialist', 'Remote Support Engineer'],
      presentation: ['Live Demo Presenter', 'Technical Demo Engineer', 'Product Walkthrough Specialist', 'Hands-on Workshop Trainer', 'Field Demonstration Specialist'],
      design: ['UI Designer', 'Motion/Interaction Prototyper', 'Graphic Production Specialist', 'Design Tools Builder', 'Hands-on Visual Craftsman'],
    },
  },
  ISFP: {
    code: 'ISFP', group: 'explorer',
    description: 'คุณใส่ใจความสวยงามและประสบการณ์ผู้ใช้ ทำงานอย่างประณีต และชอบงานที่ได้แสดงออกทางความคิดสร้างสรรค์',
    jobs: {
      programming: ['UI Designer', 'Frontend Developer', 'Visual Designer', 'Mobile App Developer', 'Product Designer'],
      service: ['Customer Experience Designer', 'In-Person Service Associate', 'Retail Service Specialist', 'Concierge', 'Personal Service Assistant'],
      presentation: ['Visual/Design Presenter', 'Creative Showcase Presenter', 'Portfolio Presenter', 'Art/Design Exhibition Host', 'Multimedia Storyteller'],
      design: ['Visual Designer', 'Graphic Designer', 'Illustrator', 'Digital Artist', 'Branding Specialist'],
    },
  },
  ESTP: {
    code: 'ESTP', group: 'explorer',
    description: 'คุณตอบสนองรวดเร็วเมื่อเจอปัญหาเร่งด่วน ชอบงานที่เห็นผลทันที และไม่ชอบติดอยู่กับทฤษฎีนานเกินไป',
    jobs: {
      programming: ['Site Reliability Engineer', 'Support Engineer', 'Full-stack Developer', 'Incident Response Engineer', 'Solutions Engineer'],
      service: ['Frontline Service Agent', 'Live Chat/Phone Support Agent', 'Sales Support Specialist', 'Crisis Response Agent', 'Walk-in Service Representative'],
      presentation: ['Live Event Host', 'Sales Pitch Presenter', 'Product Launch Presenter', 'Stage MC', 'Trade Show Presenter'],
      design: ['Rapid Prototyper', 'Live Design Demo Specialist', 'Pop-up/Event Design Specialist', 'Trend-driven Visual Designer', 'Fast-turnaround Graphic Designer'],
    },
  },
  ESFP: {
    code: 'ESFP', group: 'explorer',
    description: 'คุณสร้างบรรยากาศการทำงานที่สนุกและมีพลัง ชอบงานที่ได้ปฏิสัมพันธ์กับคนอื่น และนำเสนอผลงานได้น่าสนใจ',
    jobs: {
      programming: ['Developer Advocate', 'Solutions Engineer', 'Frontend Developer', 'Customer Success Engineer', 'Technical Evangelist'],
      service: ['Guest Relations Specialist', 'Customer Delight Specialist', 'Event/Hospitality Host', 'Retail Floor Associate', 'Brand Experience Ambassador'],
      presentation: ['Entertainer-Style Presenter', 'Brand Ambassador', 'Event Emcee', 'Social Media Live Presenter', 'Audience Engagement Host'],
      design: ['Social Media Visual Designer', 'Brand Experience Designer', 'Event/Exhibition Designer', 'Content Visual Designer', 'Engagement-Focused Designer'],
    },
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
  template: TemplateId,
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
    jobs: info.jobs[template],
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
