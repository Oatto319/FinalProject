'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, ChevronLeft } from 'lucide-react';
import Navbar from '../../navbar/page';
import { buildResult, pole, AXIS_LABELS, type MBTIResult, type AxisKey } from '@/lib/mbti';

const PresentationQuestionnaire = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatarSeed: number } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  // คำถามวัดแนวโน้ม — ไม่มีคำตอบถูกผิด วัดเฉพาะว่าคุณถนัดแบบไหน
  // แต่ละแกนมี 4 ข้อ เห็นด้วย (1-3) = ขั้วบวกของแกน, ไม่เห็นด้วย (5-7) = ขั้วลบ
  // ข้อ 1-4   E/I : เห็นด้วย → E (พูดต่อหน้าคน/โต้ตอบสด)     | ไม่เห็นด้วย → I (เขียนรายงาน/ซ้อมคนเดียว)
  // ข้อ 5-8   S/N : เห็นด้วย → S (ข้อมูล/รายละเอียดที่ตรวจสอบได้) | ไม่เห็นด้วย → N (ภาพรวม/วิสัยทัศน์)
  // ข้อ 9-12  T/F : เห็นด้วย → T (ข้อเท็จจริง/ตรรกะ)          | ไม่เห็นด้วย → F (สร้างแรงบันดาลใจผู้ฟัง)
  // ข้อ 13-16 J/P : เห็นด้วย → J (เตรียม/ซ้อมล่วงหน้า)         | ไม่เห็นด้วย → P (ด้นสดบนเวที)
  // ข้อ 17-20 A/T : เห็นด้วย → A (มั่นใจ/นิ่ง)                 | ไม่เห็นด้วย → T (เครียด/กังวลง่าย)
  const questions: { id: number; text: string; axis: AxisKey }[] = [
    { id: 1,  axis: 'EI', text: 'ฉันสนุกกับการพูดต่อหน้าผู้ฟังจำนวนมาก มากกว่าการเขียนรายงานส่งแทน' },
    { id: 2,  axis: 'EI', text: 'ฉันชอบเปิดให้ผู้ฟังถามคำถามและโต้ตอบสดระหว่างพูด มากกว่าพูดจบแล้วค่อยรับคำถามทีเดียว' },
    { id: 3,  axis: 'EI', text: 'ฉันรู้สึกมีพลังเวลาได้ยืนพูดต่อหน้าคนหลายคน มากกว่าซ้อมพูดอยู่คนเดียวหน้ากระจก' },
    { id: 4,  axis: 'EI', text: 'ฉันชอบเดินไปคุยกับผู้ฟังหลังเลิกงานเพื่อฟัง feedback มากกว่ารอผลตอบรับทางแบบฟอร์ม' },
    { id: 5,  axis: 'SN', text: 'ฉันชอบใส่ข้อมูลและตัวเลขละเอียดในสไลด์ มากกว่าเล่าเป็นภาพรวมกว้างๆ' },
    { id: 6,  axis: 'SN', text: 'ฉันเตรียมเนื้อหาตามข้อเท็จจริงที่ตรวจสอบได้ มากกว่าเล่าด้วยความรู้สึกหรือวิสัยทัศน์' },
    { id: 7,  axis: 'SN', text: 'ฉันสนใจว่าข้อมูลในสไลด์ถูกต้องครบถ้วน มากกว่าการตีความความหมายที่ซ่อนอยู่' },
    { id: 8,  axis: 'SN', text: 'ฉันชอบนำเสนอเรื่องที่มีหลักฐานชัดเจนรองรับ มากกว่าพูดถึงแนวโน้มในอนาคตที่ยังไม่แน่นอน' },
    { id: 9,  axis: 'TF', text: 'ฉันเน้นความถูกต้องของข้อมูลในการนำเสนอมากกว่าการสร้างแรงบันดาลใจให้ผู้ฟัง' },
    { id: 10, axis: 'TF', text: 'เมื่อมีคนค้านข้อมูลของฉัน ฉันใช้หลักฐานโต้แย้งมากกว่าปรับน้ำเสียงให้นุ่มนวลขึ้น' },
    { id: 11, axis: 'TF', text: 'ฉันเลือกเนื้อหาที่นำเสนอจากความสำคัญเชิงข้อมูล มากกว่าจากว่าผู้ฟังอยากได้ยินอะไร' },
    { id: 12, axis: 'TF', text: 'ฉันให้ความสำคัญกับ logic ของการนำเสนอมากกว่าอารมณ์ร่วมของผู้ฟัง' },
    { id: 13, axis: 'JP', text: 'ฉันชอบเตรียมสไลด์และซ้อมพูดให้ครบก่อนถึงวันนำเสนอจริง มากกว่าด้นสดบนเวที' },
    { id: 14, axis: 'JP', text: 'ฉันรู้สึกอึดอัดเมื่อต้องเปลี่ยนเนื้อหานำเสนอกะทันหันก่อนขึ้นพูด' },
    { id: 15, axis: 'JP', text: 'ฉันชอบกำหนดเวลาแต่ละหัวข้อในการพูดให้ชัดเจน มากกว่าปล่อยให้ไหลไปตามบรรยากาศ' },
    { id: 16, axis: 'JP', text: 'ฉันเตรียมคำตอบสำหรับคำถามที่คาดว่าจะถูกถามไว้ก่อนเสมอ' },
    { id: 17, axis: 'AT', text: 'ก่อนขึ้นพูดต่อหน้าคนจำนวนมาก ฉันมั่นใจในตัวเองโดยไม่ค่อยกังวล' },
    { id: 18, axis: 'AT', text: 'ต่อให้พูดผิดหรือลืมเนื้อหากลางคัน ฉันยังคงตั้งสติและพูดต่อได้อย่างมั่นใจ' },
    { id: 19, axis: 'AT', text: 'หลังจบการนำเสนอ ฉันไม่ค่อยคิดวนเวียนว่าตัวเองพูดดีพอหรือเปล่า' },
    { id: 20, axis: 'AT', text: 'เมื่อถูกถามคำถามยากจากผู้ฟัง ฉันยังคงใจเย็นและตอบได้อย่างมั่นใจ' },
  ];

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showPopup, setShowPopup] = useState(false);
  const [jobResult, setJobResult] = useState<MBTIResult | null>(null);

  const handleSelect = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const allAnswered = questions.every((q) => answers[q.id] !== undefined);
    if (!allAnswered) { alert('กรุณาตอบให้ครบทุกข้อก่อนนะครับ'); return; }

    const sums: Record<AxisKey, number> = { EI: 0, SN: 0, TF: 0, JP: 0, AT: 0 };
    questions.forEach((q) => { sums[q.axis] += pole(answers[q.id]); });

    const result = buildResult(sums, 'presentation');
    setJobResult(result);
    setShowPopup(true);
  };

  const handlePopupClose = async () => {
    if (jobResult) {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const currentUser = JSON.parse(raw);
        const newTypes = { ...currentUser.types, presentation: jobResult };
        const updatedUser = { ...currentUser, types: newTypes };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        try {
          await fetch('/api/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gmail: currentUser.gmail, types: newTypes }),
          });
        } catch (e) {
          console.error('Failed to save MBTI result to DB:', e);
        }
      }
    }
    setShowPopup(false);
    router.push('/templates');
  };

  return (
    <div className="min-h-screen bg-[#E5E7EB] font-sans flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-5xl flex items-center justify-between px-4 md:px-8 mt-6 mb-6">
        <button onClick={() => router.back()} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all">
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <div className="bg-[#E2F37C] px-8 py-3 rounded-2xl shadow-sm">
          <h2 className="text-[#22C55E] font-black italic tracking-tight uppercase">PRESENTATION</h2>
        </div>
      </div>

      <div className="w-full max-w-5xl bg-white rounded-[24px] shadow-xl p-8 md:p-16 flex flex-col gap-12 border-b-8 border-gray-300">
        {questions.map((q, idx) => (
          <div key={q.id} className="flex flex-col items-center gap-8">
            <h3 className="text-[#1A2E44] text-xl md:text-2xl font-black text-center leading-relaxed">&quot;{q.text}&quot;</h3>
            <div className="w-full flex items-center justify-between max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="text-[#22C55E] font-black text-lg md:text-xl">เห็นด้วย</span>
                <div className="w-10 h-10 rounded-full border-2 border-[#22C55E] flex items-center justify-center text-[#22C55E] bg-white"><Plus size={24} strokeWidth={4} /></div>
              </div>
              <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center px-4">
                {[1, 2, 3, 4, 5, 6, 7].map((val) => {
                  const isSelected = answers[q.id] === val;
                  const sizeClass = val === 4 ? 'w-6 h-6' : (val === 3 || val === 5) ? 'w-8 h-8' : (val === 2 || val === 6) ? 'w-10 h-10' : 'w-12 h-12';
                  const borderColor = val < 4 ? 'border-[#22C55E]' : val > 4 ? 'border-[#E2F37C]' : 'border-gray-400';
                  return (
                    <button key={val} onClick={() => handleSelect(q.id, val)}
                      className={`${sizeClass} rounded-full border-2 transition-all duration-200 ${borderColor} ${isSelected ? (val < 4 ? 'bg-[#22C55E]' : val > 4 ? 'bg-[#E2F37C]' : 'bg-gray-400') : 'bg-transparent'} hover:scale-110`} />
                  );
                })}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#E2F37C] flex items-center justify-center text-[#22C55E] bg-white"><Minus size={24} strokeWidth={4} /></div>
                <span className="text-[#22C55E] font-black text-lg md:text-xl whitespace-nowrap">ไม่เห็นด้วย</span>
              </div>
            </div>
            {idx !== questions.length - 1 && <div className="w-full h-[2px] bg-gray-100 mt-4" />}
          </div>
        ))}
        <div className="flex justify-center mt-8">
          <button onClick={handleSubmit} className="bg-[#4B3E7A] text-white px-12 py-4 rounded-2xl font-black text-xl hover:bg-[#3b3161] transition-colors shadow-lg">ถัดไป</button>
        </div>
      </div>

      {showPopup && jobResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] p-8 flex flex-col items-center gap-5 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="text-center w-full">
              <h2 className="text-2xl font-black text-[#1A2E44] mb-1">เสร็จแล้ว!</h2>
              <p className="text-xs text-gray-400 font-medium mb-3">ประเภทบุคลิกภาพการทำงานของคุณ</p>
              <p className="text-4xl font-black text-[#4B3E7A] mb-1 tracking-wider">{jobResult.fullCode}</p>
              <p className="text-sm text-gray-500 font-bold mb-3">{jobResult.groupLabel}</p>
              <p className="text-gray-500 text-sm leading-relaxed mb-2">{jobResult.description}</p>
              <p className="text-gray-400 text-xs leading-relaxed mb-4 italic">{jobResult.variantNote}</p>
              <div className="text-left">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">ตำแหน่งงานที่เหมาะสม</p>
                <div className="flex flex-wrap gap-2">
                  {jobResult.jobs.map((job) => (
                    <span key={job} className="bg-[#EDE9FF] text-[#4B3E7A] text-xs font-bold px-3 py-1.5 rounded-full">{job}</span>
                  ))}
                </div>
              </div>
              <div className="text-left w-full mt-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">คะแนนแต่ละแกน</p>
                <div className="flex flex-col gap-3">
                  {(Object.keys(AXIS_LABELS) as (keyof typeof AXIS_LABELS)[]).map((key) => {
                    const labels = AXIS_LABELS[key];
                    const pct = jobResult.axisScores[key];
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-sm font-black text-[#4B3E7A] w-5 flex-shrink-0">{labels.posLetter}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div className="bg-[#4B3E7A] h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-black text-gray-400 w-5 flex-shrink-0 text-right">{labels.negLetter}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <button onClick={handlePopupClose} className="w-full bg-[#4B3E7A] text-white py-4 rounded-2xl font-black text-lg hover:bg-[#3b3161] transition-colors shadow-lg">Finished</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationQuestionnaire;
