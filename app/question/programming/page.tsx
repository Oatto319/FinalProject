'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, ChevronLeft } from 'lucide-react';
import Navbar from '../../navbar/page';
import { buildResult, pole, AXIS_LABELS, type MBTIResult, type AxisKey } from '@/lib/mbti';

const ProgrammingQuestionnaire = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatarSeed: number } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  // คำถามวัดแนวโน้ม — ไม่มีคำตอบถูกผิด วัดเฉพาะว่าคุณถนัดแบบไหน
  // แต่ละแกนมี 4 ข้อ เห็นด้วย (1-3) = ขั้วบวกของแกน, ไม่เห็นด้วย (5-7) = ขั้วลบ
  // ข้อ 1-4   E/I : เห็นด้วย → E (ทำงานร่วมกับคนอื่น)   | ไม่เห็นด้วย → I (โฟกัสเดี่ยว)
  // ข้อ 5-8   S/N : เห็นด้วย → S (รายละเอียด/ข้อมูลจริง) | ไม่เห็นด้วย → N (ภาพรวม/แนวคิดใหม่)
  // ข้อ 9-12  T/F : เห็นด้วย → T (logic/ผลลัพธ์)         | ไม่เห็นด้วย → F (ความรู้สึกคน/ความกลมเกลียว)
  // ข้อ 13-16 J/P : เห็นด้วย → J (วางแผน/มีระเบียบ)       | ไม่เห็นด้วย → P (ยืดหยุ่น/ลื่นไหล)
  // ข้อ 17-20 A/T : เห็นด้วย → A (มั่นใจ/นิ่ง)             | ไม่เห็นด้วย → T (เครียด/กังวลง่าย)
  const questions: { id: number; text: string; axis: AxisKey }[] = [
    { id: 1,  axis: 'EI', text: 'ฉันชอบคุยกับเพื่อนในทีมเพื่อ debug ปัญหาร่วมกัน มากกว่านั่งคิดเองคนเดียวเงียบๆ' },
    { id: 2,  axis: 'EI', text: 'เวลาติดปัญหาเรื่อง code ฉันมักจะถามเพื่อนหรือพูดออกมาดังๆ ก่อนคิดเอง' },
    { id: 3,  axis: 'EI', text: 'ฉันรู้สึกมีพลังเวลาทำงานเป็นทีมหรือทำ pair programming มากกว่าทำงานเดี่ยวคนเดียว' },
    { id: 4,  axis: 'EI', text: 'ฉันชอบ present แนวคิดหรือผลงานให้ทีมฟังบ่อยๆ มากกว่าทำงานเงียบๆแล้วส่งผลลัพธ์' },
    { id: 5,  axis: 'SN', text: 'ฉันชอบงานที่มี requirement ชัดเจนและวัดผลได้ มากกว่างานที่ต้องสร้าง vision ใหม่จากศูนย์' },
    { id: 6,  axis: 'SN', text: 'ฉันสนใจรายละเอียดของ implementation มากกว่าทิศทางระยะยาวของ product' },
    { id: 7,  axis: 'SN', text: 'ฉันชอบใช้ technology ที่ stable และพิสูจน์แล้ว มากกว่าทดลองสิ่งใหม่ที่ยังไม่ mature' },
    { id: 8,  axis: 'SN', text: 'ฉันสนใจว่าระบบทำงานยังไงในตอนนี้ มากกว่าจินตนาการว่ามันควรเป็นยังไงในอีก 3 ปีข้างหน้า' },
    { id: 9,  axis: 'TF', text: 'ฉันรู้สึกว่า performance และ correctness ของระบบสำคัญกว่าความสุขของทีมในการทำงาน' },
    { id: 10, axis: 'TF', text: 'ใน code review ฉันจะชี้ปัญหาตรงๆ แม้จะทำให้บรรยากาศอึดอัด มากกว่าเลือกพูดแบบกลมกล่อม' },
    { id: 11, axis: 'TF', text: 'เมื่อทีมขัดแย้งกัน ฉันมักหาข้อมูลมาตัดสินว่าแนวทางไหนดีกว่า มากกว่าหาจุดที่ทุกคนยอมรับได้' },
    { id: 12, axis: 'TF', text: 'เมื่อต้องตัดสินใจทิศทาง project ฉันพึ่งข้อมูลและ metrics มากกว่าฟังความรู้สึกของ stakeholder' },
    { id: 13, axis: 'JP', text: 'ฉันชอบวางแผนงานและทำตาม timeline ที่กำหนดไว้ มากกว่าปรับเปลี่ยนไปเรื่อยๆตามสถานการณ์' },
    { id: 14, axis: 'JP', text: 'ฉันรู้สึกอึดอัดเมื่อ scope ของงานเปลี่ยนแปลงกลางทางโดยไม่มีแผนรองรับ' },
    { id: 15, axis: 'JP', text: 'ฉันชอบปิดงานให้เสร็จก่อนเวลาเผื่อไว้ มากกว่าทำไปเรื่อยๆจนใกล้ deadline ค่อยเร่ง' },
    { id: 16, axis: 'JP', text: 'ฉันชอบทำตาม checklist หรือขั้นตอนที่กำหนดไว้ชัดเจน มากกว่าด้นสดแก้ปัญหาไปตามหน้างาน' },
    { id: 17, axis: 'AT', text: 'ต่อให้ code ของฉันถูกวิจารณ์ใน review ฉันก็ยังมั่นใจในฝีมือของตัวเองอยู่ดี' },
    { id: 18, axis: 'AT', text: 'เมื่อใกล้ deadline ฉันยังคงใจเย็นและโฟกัสกับงานได้โดยไม่กังวลมากเกินไป' },
    { id: 19, axis: 'AT', text: 'ฉันไม่ค่อยคิดวนเวียนถึงข้อผิดพลาดในงานที่ทำไปแล้ว' },
    { id: 20, axis: 'AT', text: 'เมื่อ production มีปัญหา (bug/incident) ฉันยังคงสงบและแก้ไขอย่างมีสติ ไม่ตื่นตระหนก' },
  ];

  // เก็บสถานะการเลือกของแต่ละคำถาม (1-7)
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const [showPopup, setShowPopup] = useState(false);
  const [jobResult, setJobResult] = useState<MBTIResult | null>(null);

  const handleSelect = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const allAnswered = questions.every((q) => answers[q.id] !== undefined);
    if (!allAnswered) {
      alert('กรุณาตอบให้ครบทุกข้อก่อนนะครับ');
      return;
    }

    const sums: Record<AxisKey, number> = { EI: 0, SN: 0, TF: 0, JP: 0, AT: 0 };
    questions.forEach((q) => { sums[q.axis] += pole(answers[q.id]); });

    const result = buildResult(sums);
    setJobResult(result);
    setShowPopup(true);
  };

  // --- เพิ่ม: ปิด popup แล้วกลับ templates ---
  const handlePopupClose = async () => {
    if (jobResult) {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const currentUser = JSON.parse(raw);
        const newTypes = { ...currentUser.types, programming: jobResult };
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
          className="flex-shrink-0 mt-8 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-700 transition-all active:scale-95"
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
            className="bg-[#4B3E7A] text-white px-12 py-4 rounded-2xl text-xl hover:bg-[#3b3161] transition-colors shadow-lg"
            style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>
            ถัดไป
          </button>
        </div>
        </div>
      </div>

      {/* --- เพิ่ม: Popup เสร็จแล้ว --- */}
      {showPopup && jobResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] p-8 flex flex-col items-center gap-5 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="text-center w-full">
              <h2 className="text-2xl text-[#1A2E44] mb-1" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif', textShadow: 'none' }}>เสร็จแล้ว!</h2>
              <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>ประเภทบุคลิกภาพการทำงานของคุณ</p>
              <p className="text-4xl font-black text-[#4B3E7A] mb-1 tracking-wider">{jobResult.fullCode}</p>
              <p className="text-sm text-gray-500 font-bold mb-3">{jobResult.groupLabel}</p>
              <p className="text-gray-500 text-sm leading-relaxed mb-2" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>{jobResult.description}</p>
              <p className="text-gray-400 text-xs leading-relaxed mb-4 italic">{jobResult.variantNote}</p>
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
              <div className="text-left w-full mt-4">
                <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>คะแนนแต่ละแกน</p>
                <div className="flex flex-col gap-3">
                  {(Object.keys(AXIS_LABELS) as (keyof typeof AXIS_LABELS)[]).map((key) => {
                    const labels = AXIS_LABELS[key];
                    const pct = jobResult.axisScores[key];
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-sm font-black text-[#4B3E7A] w-5 flex-shrink-0">{labels.posLetter}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div
                            className="bg-[#4B3E7A] h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-black text-gray-400 w-5 flex-shrink-0 text-right">{labels.negLetter}</span>
                      </div>
                    );
                  })}
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
