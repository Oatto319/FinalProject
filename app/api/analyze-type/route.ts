import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const TYPE_INFO: Record<string, { icon: string; description: string; jobs: string[] }> = {
  'นักวิเคราะห์': {
    icon: '/img/brain.png',
    description: 'คุณคิดเชิงระบบ ชอบวิเคราะห์ปัญหาเชิงลึก และมองหาโซลูชันที่มีประสิทธิภาพสูงสุด มีความสามารถในการคิดเชิงนามธรรมและออกแบบระบบที่ซับซ้อนได้ดี',
    jobs: ['Data Analyst', 'Data Engineer', 'Backend Developer', 'Software Architect', 'AI/ML Engineer', 'Security Engineer'],
  },
  'นักคิดสร้างสรรค์': {
    icon: '/img/idea.png',
    description: 'คุณมีจินตนาการสูง ชอบคิดนอกกรอบ และสร้างสิ่งใหม่ที่มีความหมาย เข้าใจความต้องการของผู้ใช้และแปลงเป็นประสบการณ์ที่ดีได้อย่างเป็นธรรมชาติ',
    jobs: ['UI/UX Designer', 'Frontend Developer', 'Product Manager', 'Product Designer', 'Creative Technologist'],
  },
  'ผู้ปฏิบัติการ': {
    icon: '/img/pencil.png',
    description: 'คุณทำงานได้จริงจัง มีความแม่นยำสูง และพึ่งพาข้อเท็จจริงในการตัดสินใจ ชอบแก้ปัญหาที่จับต้องได้และเห็นผลลัพธ์ที่ชัดเจน เป็นคนที่ทีมวางใจได้',
    jobs: ['DevOps Engineer', 'System Administrator', 'QA Engineer', 'Database Administrator', 'Infrastructure Engineer'],
  },
  'นักประสานงาน': {
    icon: '/img/make.png',
    description: 'คุณทำงานเป็นทีมได้ดีเยี่ยม เข้าใจความต้องการของผู้คน และสร้างบรรยากาศการทำงานที่ดี มีทักษะการสื่อสารและการประสานงานที่โดดเด่น',
    jobs: ['Project Manager', 'Scrum Master', 'Business Analyst', 'Tech Lead', 'Customer Success Manager'],
  },
};

const TYPE_NAMES = ['นักวิเคราะห์', 'นักคิดสร้างสรรค์', 'ผู้ปฏิบัติการ', 'นักประสานงาน'];

export async function POST(req: NextRequest) {
  try {
    const { answers, questions } = await req.json() as {
      answers: Record<number, number>;
      questions: { id: number; text: string }[];
    };

    const qa = questions.map((q) =>
      `ข้อ ${q.id}: "${q.text}" → คำตอบ ${answers[q.id]}/7`
    ).join('\n');

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `คุณวิเคราะห์บุคลิกภาพการทำงาน Programming จากคำตอบ Likert 1-7 (1=เห็นด้วยอย่างยิ่ง, 4=กลางๆ, 7=ไม่เห็นด้วยอย่างยิ่ง)

คำถาม-คำตอบ:
${qa}

ประเภทบุคลิกภาพ:
- นักวิเคราะห์: ชอบ logic, data, architecture, คิดเชิงระบบ, ไม่ชอบ politics
- นักคิดสร้างสรรค์: ชอบ vision ใหม่, UX, prototype, คิดนอกกรอบ, เน้น user empathy
- ผู้ปฏิบัติการ: ชอบ implement, testing, ขั้นตอนชัดเจน, detail-oriented, พิสูจน์แล้ว
- นักประสานงาน: ชอบ team, communicate, coordinate, เน้น people skills

ให้คะแนนแต่ละประเภท 0-100 ตามความสอดคล้องกับคำตอบทั้งหมด
ตอบ JSON เท่านั้น ไม่มีข้อความอื่น:
{"นักวิเคราะห์":X,"นักคิดสร้างสรรค์":X,"ผู้ปฏิบัติการ":X,"นักประสานงาน":X}`,
      }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}';
    const jsonMatch = raw.match(/\{[^}]+\}/);
    const scores: Record<string, number> = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    // ตรวจสอบว่า key ครบ ถ้าไม่มีให้ default 0
    for (const name of TYPE_NAMES) {
      if (typeof scores[name] !== 'number') scores[name] = 0;
    }

    // หา primary type
    const sorted = TYPE_NAMES.slice().sort((a, b) => scores[b] - scores[a]);
    const primaryName = sorted[0];
    const info = TYPE_INFO[primaryName];

    const typeScores = TYPE_NAMES.map((name) => ({
      title: name,
      icon: TYPE_INFO[name].icon,
      score: scores[name],
    }));

    return NextResponse.json({
      title: primaryName,
      icon: info.icon,
      description: info.description,
      jobs: info.jobs,
      typeScores,
    });
  } catch (err) {
    console.error('analyze-type error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
