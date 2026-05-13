'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, ChevronLeft } from 'lucide-react';
import Navbar from '../../navbar/page';

const ProgrammingQuestionnaire = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatarSeed: number } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  // คำถามวัดแนวโน้ม — ไม่มีคำตอบถูกผิด วัดเฉพาะว่าคุณถนัดแบบไหน
  // ข้อ 1-10: เห็นด้วย → ชอบ logic/data/system  | ไม่เห็นด้วย → ชอบ people/empathy
  // ข้อ 11-20: เห็นด้วย → ชอบ detail/concrete  | ไม่เห็นด้วย → ชอบ vision/abstract
  const questions = [
    { id: 1,  text: 'ฉันสนุกกับการ debug โดยวิเคราะห์ logic เองมากกว่าการพูดคุยกับทีมเพื่อหาสาเหตุร่วมกัน' },
    { id: 2,  text: 'ใน code review ฉันจะชี้ปัญหาตรงๆ แม้จะทำให้บรรยากาศอึดอัด มากกว่าเลือกพูดแบบกลมกล่อม' },
    { id: 3,  text: 'ฉันรู้สึกว่า performance และ correctness ของระบบสำคัญกว่าความสุขของทีมในการทำงาน' },
    { id: 4,  text: 'เมื่อต้องตัดสินใจทิศทาง project ฉันพึ่งข้อมูลและ metrics มากกว่าฟังความรู้สึกของ stakeholder' },
    { id: 5,  text: 'ฉันสนุกกับการวิเคราะห์ tradeoff ทาง technical มากกว่าการทำความเข้าใจว่า user รู้สึกยังไงกับ product' },
    { id: 6,  text: 'ฉันสนใจ optimize performance ของระบบมากกว่าดูแลความสัมพันธ์และบรรยากาศภายในทีม' },
    { id: 7,  text: 'ฉันให้ความสำคัญกับ technical correctness มากกว่าความรู้สึกของเจ้าของ code เมื่อต้อง review งาน' },
    { id: 8,  text: 'เมื่อทีมขัดแย้งกัน ฉันมักหาข้อมูลมาตัดสินว่าแนวทางไหนดีกว่า มากกว่าหาจุดที่ทุกคนยอมรับได้' },
    { id: 9,  text: 'ฉันสนุกกับการ optimize algorithm มากกว่าการปรับปรุง developer experience ของ codebase' },
    { id: 10, text: 'ฉันชอบออกแบบ system architecture ที่ซับซ้อนมากกว่าการช่วยให้ทีมทำงานร่วมกันได้ราบรื่น' },
    { id: 11, text: 'ฉันชอบงานที่มี requirement ชัดเจนและวัดผลได้ มากกว่างานที่ต้องสร้าง vision ใหม่จากศูนย์' },
    { id: 12, text: 'ฉันสนใจรายละเอียดของ implementation มากกว่าทิศทางระยะยาวของ product' },
    { id: 13, text: 'ฉันชอบใช้ technology ที่ stable และพิสูจน์แล้ว มากกว่าทดลองสิ่งใหม่ที่ยังไม่ mature' },
    { id: 14, text: 'ฉันชอบ maintain และปรับปรุงระบบที่มีอยู่ให้ดีขึ้น มากกว่าออกแบบ architecture ใหม่ทั้งหมด' },
    { id: 15, text: 'ฉันให้ความสำคัญกับการเขียน test ให้ครอบคลุมมากกว่าการ prototype ไอเดียใหม่อย่างรวดเร็ว' },
    { id: 16, text: 'ฉันชอบ project ที่มีขอบเขตและ scope ชัดเจน มากกว่า project ที่ scope เปลี่ยนแปลงได้ตลอด' },
    { id: 17, text: 'ฉันสนใจว่าระบบทำงานยังไงในตอนนี้ มากกว่าจินตนาการว่ามันควรเป็นยังไงในอีก 3 ปีข้างหน้า' },
    { id: 18, text: 'ฉันชอบ refine และ polish feature ที่มีอยู่ให้สมบูรณ์ มากกว่าเสนอ feature ใหม่ที่น่าตื่นเต้น' },
    { id: 19, text: 'ฉันรู้สึกสนุกกับงาน QA หรือ testing มากกว่างาน brainstorm หรือ design thinking' },
    { id: 20, text: 'ฉันชอบปรับปรุง process ที่มีอยู่ให้ดีขึ้น มากกว่าเสนอวิธีการทำงานแบบใหม่ทั้งหมด' },
  ];

  // เก็บสถานะการเลือกของแต่ละคำถาม (1-7)
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const [showPopup, setShowPopup]   = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  const handleSubmit = async () => {
    const allAnswered = questions.every((q) => answers[q.id] !== undefined);
    if (!allAnswered) {
      alert('กรุณาตอบให้ครบทุกข้อก่อนนะครับ');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          questions: questions.map(({ id, text }) => ({ id, text })),
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setJobResult(data);
      setShowPopup(true);
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- เพิ่ม: ปิด popup แล้วกลับ templates ---
  const handlePopupClose = async () => {
    if (jobResult) {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const currentUser = JSON.parse(raw);
        const newTypes = {
          ...currentUser.types,
          programming: {
            title: jobResult.title,
            description: jobResult.description,
            jobs: jobResult.jobs,
            icon: jobResult.icon,
            typeScores: jobResult.typeScores,
            completedAt: new Date().toISOString(),
          }
        };
        const updatedUser = { ...currentUser, types: newTypes };

        // บันทึก localStorage
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        // บันทึก MongoDB
        try {
          const res = await fetch('/api/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gmail: currentUser.gmail, types: newTypes }),
          });
          if (!res.ok) {
            const err = await res.json();
            console.error('Failed to save MBTI result to DB:', err);
          }
        } catch (e) {
          console.error('Failed to save MBTI result to DB:', e);
        }
      }
    }
    setShowPopup(false);
    router.push('/templates');
  };
  // --- สิ้นสุดส่วนที่เพิ่ม ---

  return (
    <div className="min-h-screen bg-[#E5E7EB] font-sans flex flex-col items-center">
      <Navbar />
      {/* Wrapper: ปุ่ม back + กล่องคำถาม */}
      <div className="w-full max-w-5xl flex items-start gap-4 mt-4 px-4 md:px-0">
        <button
          onClick={() => router.back()}
          className="flex-shrink-0 mt-8 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>

        {/* Container สำหรับคำถาม */}
        <div className="relative flex-1 bg-white rounded-[24px] shadow-xl p-8 md:p-16 flex flex-col gap-12 border-b-8 border-gray-300">
        {/* ป้ายชื่อวิชามุมบนขวา */}
        <div className="absolute top-6 right-6 bg-[#F8A4A4] px-6 py-2 rounded-2xl shadow-sm">
          <h2 className="text-[#4B3E7A] font-black italic tracking-tight uppercase">
            PROGRAMMING
          </h2>
        </div>
        {questions.map((q, idx) => (
          <div key={q.id} className="flex flex-col items-center gap-8">
            {/* ข้อความคำถาม */}
            <h3 className="text-[#1A2E44] text-xl md:text-2xl text-center leading-relaxed" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif', textShadow: 'none' }}>
              "{q.text}"
            </h3>

            {/* ส่วนตัวเลือก Scale */}
            <div className="w-full flex items-center justify-between max-w-3xl">
              {/* ฝั่งเห็นด้วย */}
              <div className="flex items-center gap-3">
                <span className="text-[#22C55E] text-lg md:text-xl" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>เห็นด้วย</span>
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
                <span className="text-[#F8A4A4] text-lg md:text-xl whitespace-nowrap" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>ไม่เห็นด้วย</span>
              </div>
            </div>

            {/* เส้นคั่นระหว่างข้อ */}
            {idx !== questions.length - 1 && (
              <div className="w-full h-[2px] bg-gray-100 mt-4" />
            )}
          </div>
        ))}

        <div className="flex justify-center mt-8">
          <button
            onClick={handleSubmit}
            disabled={isAnalyzing}
            className="bg-[#4B3E7A] text-white px-12 py-4 rounded-2xl text-xl hover:bg-[#3b3161] transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
            style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>
            {isAnalyzing ? (
              <>
                <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                กำลังวิเคราะห์...
              </>
            ) : 'ถัดไป'}
          </button>
        </div>
        </div>
      </div>

      {/* --- เพิ่ม: Popup เสร็จแล้ว --- */}
      {showPopup && jobResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] p-8 flex flex-col items-center gap-5 shadow-2xl w-full max-w-md">
            <img src={jobResult.icon} alt={jobResult.title} className="w-24 h-24 object-contain" />
            <div className="text-center w-full">
              <h2 className="text-2xl text-[#1A2E44] mb-1" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif', textShadow: 'none' }}>เสร็จแล้ว!</h2>
              <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>ประเภทบุคลิกภาพการทำงานของคุณ</p>
              <p className="text-2xl text-[#4B3E7A] mb-3" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>{jobResult.title}</p>
              <p className="text-gray-500 text-sm leading-relaxed mb-4" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>{jobResult.description}</p>
              <div className="text-left">
                <p className="text-xs text-gray-400 mb-2" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>ตำแหน่งงานที่เหมาะสม</p>
                <div className="flex flex-wrap gap-2">
                  {jobResult.jobs.map((job) => (
                    <span key={job} className="bg-[#EDE9FF] text-[#4B3E7A] text-xs font-bold px-3 py-1.5 rounded-full">
                      {job}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-left w-full mt-2">
                <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>คะแนนแต่ละประเภท</p>
                <div className="flex flex-col gap-3">
                  {jobResult.typeScores.map((t) => (
                    <div key={t.title} className="flex items-center gap-3">
                      <img src={t.icon} alt={t.title} className="w-8 h-8 object-contain flex-shrink-0" />
                      <span className="text-sm text-[#1A2E44] w-28 flex-shrink-0" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>{t.title}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-[#4B3E7A] h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${t.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-black text-[#4B3E7A] w-10 text-right flex-shrink-0">{t.score}</span>
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