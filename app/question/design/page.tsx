'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, ChevronLeft } from 'lucide-react';
import Navbar from '../../navbar/page';
import { buildResult, pole, AXIS_LABELS, type MBTIResult, type AxisKey } from '@/lib/mbti';

const DesignQuestionnaire = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatarSeed: number } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  // คำถามวัดแนวโน้ม — ไม่มีคำตอบถูกผิด วัดเฉพาะว่าคุณถนัดแบบไหน
  // แต่ละแกนมี 4 ข้อ เห็นด้วย (1-3) = ขั้วบวกของแกน, ไม่เห็นด้วย (5-7) = ขั้วลบ
  // ข้อ 1-4   E/I : เห็นด้วย → E (ระดมไอเดียกับทีม)         | ไม่เห็นด้วย → I (คิดคอนเซปต์คนเดียว)
  // ข้อ 5-8   S/N : เห็นด้วย → S (รายละเอียด pixel-perfect)  | ไม่เห็นด้วย → N (คอนเซปต์/วิสัยทัศน์ภาพรวม)
  // ข้อ 9-12  T/F : เห็นด้วย → T (usability/ตรรกะ)           | ไม่เห็นด้วย → F (ความสวยงาม/อารมณ์)
  // ข้อ 13-16 J/P : เห็นด้วย → J (wireframe/วางแผนก่อนทำ)     | ไม่เห็นด้วย → P (ลงมือทำแล้วค่อยปรับ)
  // ข้อ 17-20 A/T : เห็นด้วย → A (มั่นใจ/นิ่ง)                | ไม่เห็นด้วย → T (เครียด/กังวลง่าย)
  const questions: { id: number; text: string; axis: AxisKey }[] = [
    { id: 1,  axis: 'EI', text: 'ฉันชอบระดมไอเดียร่วมกับทีมเป็นกลุ่ม มากกว่าคิดคอนเซปต์อยู่คนเดียวเงียบๆ' },
    { id: 2,  axis: 'EI', text: 'ฉันชอบเปิด design ให้ทีมหรือลูกค้าวิจารณ์สดระหว่างทำงาน มากกว่าทำเสร็จแล้วค่อยส่งให้ดูทีเดียว' },
    { id: 3,  axis: 'EI', text: 'ฉันรู้สึกมีพลังเวลาได้ workshop ออกแบบร่วมกับคนอื่น มากกว่านั่งออกแบบเดี่ยวที่โต๊ะตัวเอง' },
    { id: 4,  axis: 'EI', text: 'ฉันชอบพูดคุยไอเดียออกมาดังๆกับทีมตอนกำลังคิดงาน มากกว่าคิดในหัวจนตกผลึกก่อนค่อยพูด' },
    { id: 5,  axis: 'SN', text: 'ฉันให้ความสำคัญกับรายละเอียดที่ pixel-perfect มากกว่าคอนเซปต์ภาพรวมของงาน' },
    { id: 6,  axis: 'SN', text: 'ฉันชอบทำตาม design system หรือ guideline ที่มีอยู่แล้ว มากกว่าออกแบบอะไรใหม่หมดจากศูนย์' },
    { id: 7,  axis: 'SN', text: 'ฉันสนใจว่าองค์ประกอบในงานออกแบบถูกต้องตรงตาม spec มากกว่าตีความ vision เบื้องหลังงาน' },
    { id: 8,  axis: 'SN', text: 'ฉันชอบงานที่มี requirement ชัดเจนวัดผลได้ มากกว่างานที่ต้องจินตนาการ direction ใหม่เอง' },
    { id: 9,  axis: 'TF', text: 'ฉันตัดสินใจเรื่องดีไซน์โดยยึดหลัก usability และข้อมูลผู้ใช้ มากกว่าความสวยงามทางศิลปะ' },
    { id: 10, axis: 'TF', text: 'เมื่อทีมเห็นไม่ตรงกันเรื่องดีไซน์ ฉันใช้ data หรือเหตุผลมาตัดสิน มากกว่าหาทางที่ทุกคนรู้สึกดี' },
    { id: 11, axis: 'TF', text: 'ฉันให้ feedback งานออกแบบตรงๆตามหลักการ มากกว่าพูดให้กำลังใจเจ้าของงานก่อน' },
    { id: 12, axis: 'TF', text: 'ฉันเลือก solution ที่ทำงานได้ดีที่สุดมากกว่า solution ที่ทีมรู้สึกผูกพันด้วย' },
    { id: 13, axis: 'JP', text: 'ฉันชอบทำ wireframe หรือ moodboard ให้ชัดเจนก่อนเริ่มออกแบบจริง มากกว่าลงมือทำเลยแล้วค่อยปรับ' },
    { id: 14, axis: 'JP', text: 'ฉันรู้สึกอึดอัดเมื่อ scope ของงานออกแบบเปลี่ยนกลางทางโดยไม่มีแผนรองรับ' },
    { id: 15, axis: 'JP', text: 'ฉันชอบส่งงานออกแบบให้เสร็จก่อน deadline ที่ตั้งไว้ มากกว่าปรับแก้ไปเรื่อยๆจนนาทีสุดท้าย' },
    { id: 16, axis: 'JP', text: 'ฉันชอบวางแผนขั้นตอนการออกแบบทั้งหมดไว้ก่อน มากกว่าค่อยคิดไปทำไปตามหน้างาน' },
    { id: 17, axis: 'AT', text: 'ต่อให้งานออกแบบของฉันถูกวิจารณ์อย่างตรงไปตรงมา ฉันยังคงมั่นใจในฝีมือตัวเอง' },
    { id: 18, axis: 'AT', text: 'หลัง feedback session ที่ดุเดือด ฉันไม่ค่อยคิดวนเวียนว่างานตัวเองแย่หรือเปล่า' },
    { id: 19, axis: 'AT', text: 'ฉันมั่นใจในการตัดสินใจเชิงดีไซน์ของตัวเอง แม้จะมีความเห็นที่ขัดแย้งจากทีม' },
    { id: 20, axis: 'AT', text: 'เมื่อใกล้ deadline งานออกแบบ ฉันยังคงใจเย็นและโฟกัสกับงานได้' },
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

    const result = buildResult(sums, 'design');
    setJobResult(result);
    setShowPopup(true);
  };

  const handlePopupClose = async () => {
    if (jobResult) {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const currentUser = JSON.parse(raw);
        const newTypes = { ...currentUser.types, design: jobResult };
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
        <div className="bg-[#C7D2FE] px-8 py-3 rounded-2xl shadow-sm">
          <h2 className="text-[#818CF8] font-black italic tracking-tight uppercase">DESIGN / CREATIVE</h2>
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
                  const borderColor = val < 4 ? 'border-[#22C55E]' : val > 4 ? 'border-[#C7D2FE]' : 'border-gray-400';
                  return (
                    <button key={val} onClick={() => handleSelect(q.id, val)}
                      className={`${sizeClass} rounded-full border-2 transition-all duration-200 ${borderColor} ${isSelected ? (val < 4 ? 'bg-[#22C55E]' : val > 4 ? 'bg-[#C7D2FE]' : 'bg-gray-400') : 'bg-transparent'} hover:scale-110`} />
                  );
                })}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#C7D2FE] flex items-center justify-center text-[#818CF8] bg-white"><Minus size={24} strokeWidth={4} /></div>
                <span className="text-[#818CF8] font-black text-lg md:text-xl whitespace-nowrap">ไม่เห็นด้วย</span>
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

export default DesignQuestionnaire;
