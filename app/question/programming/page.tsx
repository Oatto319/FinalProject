'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus } from 'lucide-react';

const ProgrammingQuestionnaire = () => {
  const router = useRouter();

  // ข้อมูลคำถาม MBTI-based
  const questions = [
    { id: 1,  text: 'ฉันชอบพูดคุยแลกเปลี่ยนไอเดียกับทีมมากกว่าคิดคนเดียว', dimension: 'EI' },
    { id: 2,  text: 'ฉันให้ความสำคัญกับรายละเอียดการทำงานมากกว่าภาพรวมของโปรเจกต์', dimension: 'SN' },
    { id: 3,  text: 'เมื่อตัดสินใจเรื่องฟีเจอร์ ฉันพิจารณาจากตรรกะและข้อมูลมากกว่าความรู้สึกของผู้ใช้', dimension: 'TF' },
    { id: 4,  text: 'ฉันชอบวางแผนและกำหนดขั้นตอนก่อนลงมือทำงาน', dimension: 'JP' },
    { id: 5,  text: 'ฉันชอบเป็นผู้นำและตัดสินใจมากกว่าปฏิบัติตามแผนที่วางไว้', dimension: 'EI_lead' },
    { id: 6,  text: 'ฉันให้ความสำคัญกับประสบการณ์ผู้ใช้มากกว่าความเร็วและประสิทธิภาพของระบบ', dimension: 'TF_user' },
    { id: 7,  text: 'ฉันชอบทดลองวิธีการใหม่ๆ มากกว่าใช้แนวทางที่เคยได้ผลมาแล้ว', dimension: 'SN2' },
    { id: 8,  text: 'เมื่องานเปลี่ยนแปลงกะทันหัน ฉันปรับตัวได้ง่ายโดยไม่รู้สึกกดดัน', dimension: 'JP2' },
    { id: 9,  text: 'หลังจากประชุมหรือทำงานร่วมกับหลายคน ฉันรู้สึกมีพลังงานมากขึ้น', dimension: 'EI2' },
    { id: 10, text: 'ฉันสามารถให้ feedback ตรงๆ กับเพื่อนร่วมงานได้โดยไม่กังวลว่าเขาจะรู้สึกอย่างไร', dimension: 'TF2' },
    { id: 11, text: 'ฉันชอบงานที่มีขั้นตอนชัดเจนและทำซ้ำได้ มากกว่างานที่ต้องคิดวิธีแก้ใหม่ทุกครั้ง', dimension: 'SN3' },
    { id: 12, text: 'เมื่อทีมมีความเห็นต่าง ฉันโน้มน้าวด้วยข้อมูลและเหตุผลมากกว่าการสร้างความเข้าใจร่วมกัน', dimension: 'TF3' },
    { id: 13, text: 'ฉันชอบทำงานให้เสร็จล่วงหน้ามากกว่ารอจนใกล้ deadline', dimension: 'JP3' },
    { id: 14, text: 'ฉันชอบระดมความคิดร่วมกับทีมมากกว่านั่งคิดคนเดียวก่อนนำเสนอ', dimension: 'EI3' },
    { id: 15, text: 'ฉันให้ความสำคัญกับ morale ของทีมมากกว่าการประเมินผลงานที่ตรงไปตรงมา', dimension: 'TF4' },
    { id: 16, text: 'ฉันเชื่อมั่นในแนวทางที่พิสูจน์มาแล้วมากกว่าทดลองสิ่งใหม่ที่ยังไม่แน่ใจ', dimension: 'SN4' },
    { id: 17, text: 'ฉันทำงานได้ดีแม้ไม่มีแผนชัดเจน และชอบปรับเปลี่ยนไปตามสถานการณ์', dimension: 'JP4' },
    { id: 18, text: 'ฉันชอบทำงานในที่เงียบๆ คนเดียว มากกว่าทำงานในบรรยากาศที่มีคนรอบข้าง', dimension: 'EI4' },
    { id: 19, text: 'เมื่อ code review ฉันให้ความสำคัญกับความถูกต้องและประสิทธิภาพมากกว่าความรู้สึกของเจ้าของ code', dimension: 'TF5' },
    { id: 20, text: 'ฉันสนใจภาพรวมและทิศทางระยะยาวของโปรเจกต์มากกว่ารายละเอียดการใช้งานในปัจจุบัน', dimension: 'SN5' },
  ];

  // เก็บสถานะการเลือกของแต่ละคำถาม (1-7)
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // --- เพิ่ม: state สำหรับ popup ---
  const [showPopup, setShowPopup] = useState(false);
  const [jobResult, setJobResult] = useState<{
    title: string;
    description: string;
    jobs: string[];
    icon: string;
    typeScores: { title: string; icon: string; score: number }[];
  } | null>(null);

  const handleSelect = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // --- เพิ่ม: กดถัดไป ตรวจสอบว่าตอบครบทุกข้อ ---
  const handleSubmit = () => {
    const allAnswered = questions.every((q) => answers[q.id] !== undefined);
    if (!allAnswered) {
      alert('กรุณาตอบให้ครบทุกข้อก่อนนะครับ');
      return;
    }

    // คำนวณ MBTI dimensions
    // pole: agree(1-3)=+1, neutral(4)=0, disagree(5-7)=-1
    const pole = (val: number) => val <= 3 ? 1 : val >= 5 ? -1 : 0;
    // EI: Q1,Q5,Q9,Q14=agree→E  |  Q18=agree→I (reversed)
    // SN: Q2,Q11,Q16=agree→S   |  Q7,Q20=agree→N (reversed)
    // TF: Q3,Q10,Q12,Q19=agree→T  |  Q6,Q15=agree→F (reversed)
    // JP: Q4,Q13=agree→J  |  Q8,Q17=agree→P (reversed)
    const EI_score = pole(answers[1]) + pole(answers[5]) + pole(answers[9]) + pole(answers[14]) + (-1 * pole(answers[18]));
    const SN_score = pole(answers[2]) + (-1 * pole(answers[7])) + pole(answers[11]) + pole(answers[16]) + (-1 * pole(answers[20]));
    const TF_score = pole(answers[3]) + (-1 * pole(answers[6])) + pole(answers[10]) + pole(answers[12]) + (-1 * pole(answers[15])) + pole(answers[19]);
    const JP_score = pole(answers[4]) + (-1 * pole(answers[8])) + pole(answers[13]) + (-1 * pole(answers[17]));

    const T = TF_score >= 0, S = SN_score >= 0;

    // คำนวณคะแนนแต่ละ type (0-5)
    const T_comp = Math.max(0, TF_score);
    const F_comp = Math.max(0, -TF_score);
    const S_comp = Math.max(0, SN_score);
    const N_comp = Math.max(0, -SN_score);
    const typeScores = [
      { title: 'นักวิเคราะห์',    icon: '/img/brain.png',  score: T_comp + N_comp },
      { title: 'นักคิดสร้างสรรค์', icon: '/img/idea.png',   score: F_comp + N_comp },
      { title: 'ผู้ปฏิบัติการ',    icon: '/img/pencil.png', score: T_comp + S_comp },
      { title: 'นักประสานงาน',     icon: '/img/make.png',   score: F_comp + S_comp },
    ];

    let title: string, desc: string, jobs: string[];
    let icon: string;
    if (T && !S) {
      // นักวิเคราะห์ (T + N)
      title = 'นักวิเคราะห์';
      desc = 'คุณคิดเชิงระบบ ชอบวิเคราะห์ปัญหาเชิงลึก และมองหาโซลูชันที่มีประสิทธิภาพสูงสุด มีความสามารถในการคิดเชิงนามธรรมและออกแบบระบบที่ซับซ้อนได้ดี';
      jobs = ['Data Analyst', 'Data Engineer', 'Backend Developer', 'Software Architect', 'AI/ML Engineer', 'Security Engineer'];
      icon = '/img/brain.png';
    } else if (!T && !S) {
      // นักคิดสร้างสรรค์ (F + N)
      title = 'นักคิดสร้างสรรค์';
      desc = 'คุณมีจินตนาการสูง ชอบคิดนอกกรอบ และสร้างสิ่งใหม่ที่มีความหมาย เข้าใจความต้องการของผู้ใช้และแปลงเป็นประสบการณ์ที่ดีได้อย่างเป็นธรรมชาติ';
      jobs = ['UI/UX Designer', 'Frontend Developer', 'Product Manager', 'Product Designer', 'Creative Technologist'];
      icon = '/img/idea.png';
    } else if (T && S) {
      // ผู้ปฏิบัติการ (T + S)
      title = 'ผู้ปฏิบัติการ';
      desc = 'คุณทำงานได้จริงจัง มีความแม่นยำสูง และพึ่งพาข้อเท็จจริงในการตัดสินใจ ชอบแก้ปัญหาที่จับต้องได้และเห็นผลลัพธ์ที่ชัดเจน เป็นคนที่ทีมวางใจได้';
      jobs = ['DevOps Engineer', 'System Administrator', 'QA Engineer', 'Database Administrator', 'Infrastructure Engineer'];
      icon = '/img/pencil.png';
    } else {
      // นักประสานงาน (F + S)
      title = 'นักประสานงาน';
      desc = 'คุณทำงานเป็นทีมได้ดีเยี่ยม เข้าใจความต้องการของผู้คน และสร้างบรรยากาศการทำงานที่ดี มีทักษะการสื่อสารและการประสานงานที่โดดเด่น';
      jobs = ['Project Manager', 'Scrum Master', 'Business Analyst', 'Tech Lead', 'Customer Success Manager'];
      icon = '/img/make.png';
    }

    setJobResult({ title, description: desc, jobs, icon, typeScores });
    setShowPopup(true);
  };

  // --- เพิ่ม: ปิด popup แล้วกลับ templates ---
  const handlePopupClose = () => {
    if (jobResult) {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const user = JSON.parse(raw);
        const updatedUser = {
          ...user,
          types: {
            ...user.types,
            programming: {
              title: jobResult.title,
              description: jobResult.description,
              jobs: jobResult.jobs,
              icon: jobResult.icon,
              typeScores: jobResult.typeScores,
              completedAt: new Date().toISOString(),
            }
          }
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        const usersRaw = localStorage.getItem('users');
        if (usersRaw) {
          const users = JSON.parse(usersRaw);
          const idx = users.findIndex((u: { name: string }) => u.name === user.name);
          if (idx >= 0) {
            users[idx] = { ...users[idx], types: updatedUser.types };
            localStorage.setItem('users', JSON.stringify(users));
          }
        }
      }
    }
    setShowPopup(false);
    router.push('/templates');
  };
  // --- สิ้นสุดส่วนที่เพิ่ม ---

  return (
    <div className="min-h-screen bg-[#E5E7EB] p-4 md:p-8 font-sans flex flex-col items-center">
      {/* Top Bar - ข้อมูลผู้ใช้ */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-yellow-100">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Wimolchai" 
              alt="User" 
              className="w-full h-full" 
            />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Wimolchai</h3>
            <p className="text-xs text-gray-400">นักเรียน</p>
          </div>
        </div>

        {/* ป้ายชื่อวิชาด้านขวา */}
        <div className="bg-[#F8A4A4] px-8 py-3 rounded-2xl shadow-sm">
          <h2 className="text-[#4B3E7A] font-black italic tracking-tight uppercase">
            PROGRAMMING
          </h2>
        </div>
      </div>

      {/* Container สำหรับคำถาม */}
      <div className="w-full max-w-5xl bg-white rounded-[40px] shadow-xl p-8 md:p-16 flex flex-col gap-12 border-b-8 border-gray-300">
        {questions.map((q, idx) => (
          <div key={q.id} className="flex flex-col items-center gap-8">
            {/* ข้อความคำถาม */}
            <h3 className="text-[#1A2E44] text-xl md:text-2xl font-black text-center leading-relaxed">
              "{q.text}"
            </h3>

            {/* ส่วนตัวเลือก Scale */}
            <div className="w-full flex items-center justify-between max-w-3xl">
              {/* ฝั่งเห็นด้วย */}
              <div className="flex items-center gap-3">
                <span className="text-[#22C55E] font-black text-lg md:text-xl">เห็นด้วย</span>
                <div className="w-10 h-10 rounded-full border-2 border-[#22C55E] flex items-center justify-center text-[#22C55E] bg-white">
                  <Plus size={24} strokeWidth={4} />
                </div>
              </div>

              {/* วงกลมตัวเลือก (Scale) */}
              <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center px-4">
                {[1, 2, 3, 4, 5, 6, 7].map((val) => {
                  const isSelected = answers[q.id] === val;
                  const sizeClass = val === 4 ? 'w-6 h-6' : 
                                   (val === 3 || val === 5) ? 'w-8 h-8' : 
                                   (val === 2 || val === 6) ? 'w-10 h-10' : 'w-12 h-12';
                  const borderColor = val < 4 ? 'border-[#22C55E]' : 
                                    val > 4 ? 'border-[#F8A4A4]' : 'border-gray-400';

                  return (
                    <button
                      key={val}
                      onClick={() => handleSelect(q.id, val)}
                      className={`
                        ${sizeClass} rounded-full border-2 transition-all duration-200
                        ${borderColor}
                        ${isSelected ? (val < 4 ? 'bg-[#22C55E]' : val > 4 ? 'bg-[#F8A4A4]' : 'bg-gray-400') : 'bg-transparent'}
                        hover:scale-110
                      `}
                    />
                  );
                })}
              </div>

              {/* ฝั่งไม่เห็นด้วย */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#F8A4A4] flex items-center justify-center text-[#F8A4A4] bg-white">
                  <Minus size={24} strokeWidth={4} />
                </div>
                <span className="text-[#F8A4A4] font-black text-lg md:text-xl whitespace-nowrap">ไม่เห็นด้วย</span>
              </div>
            </div>

            {/* เส้นคั่นระหว่างข้อ */}
            {idx !== questions.length - 1 && (
              <div className="w-full h-[2px] bg-gray-100 mt-4" />
            )}
          </div>
        ))}

        {/* ปุ่มยืนยัน */}
        <div className="flex justify-center mt-8">
          {/* --- แก้: เพิ่ม onClick ตรวจสอบและแสดง popup --- */}
          <button
            onClick={handleSubmit}
            className="bg-[#4B3E7A] text-white px-12 py-4 rounded-2xl font-black text-xl hover:bg-[#3b3161] transition-colors shadow-lg">
            ถัดไป
          </button>
        </div>
      </div>

      {/* --- เพิ่ม: Popup เสร็จแล้ว --- */}
      {showPopup && jobResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-8 flex flex-col items-center gap-5 shadow-2xl w-full max-w-md">
            <img src={jobResult.icon} alt={jobResult.title} className="w-24 h-24 object-contain" />
            <div className="text-center w-full">
              <h2 className="text-2xl font-black text-[#1A2E44] mb-1">เสร็จแล้ว!</h2>
              <p className="text-xs text-gray-400 font-medium mb-3">ประเภทบุคลิกภาพการทำงานของคุณ</p>
              <p className="text-2xl font-black text-[#4B3E7A] mb-3">{jobResult.title}</p>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{jobResult.description}</p>
              <div className="text-left">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">ตำแหน่งงานที่เหมาะสม</p>
                <div className="flex flex-wrap gap-2">
                  {jobResult.jobs.map((job) => (
                    <span key={job} className="bg-[#EDE9FF] text-[#4B3E7A] text-xs font-bold px-3 py-1.5 rounded-full">
                      {job}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-left w-full mt-2">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">คะแนนแต่ละประเภท</p>
                <div className="flex flex-col gap-3">
                  {jobResult.typeScores.map((t) => (
                    <div key={t.title} className="flex items-center gap-3">
                      <img src={t.icon} alt={t.title} className="w-8 h-8 object-contain flex-shrink-0" />
                      <span className="text-sm font-bold text-[#1A2E44] w-28 flex-shrink-0">{t.title}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-[#4B3E7A] h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${(t.score / 11) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-black text-[#4B3E7A] w-10 text-right flex-shrink-0">{t.score}/11</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={handlePopupClose}
              className="w-full bg-[#4B3E7A] text-white py-4 rounded-2xl font-black text-lg hover:bg-[#3b3161] transition-colors shadow-lg">
              Finished
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgrammingQuestionnaire;