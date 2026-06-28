'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, ChevronLeft } from 'lucide-react';
import Navbar from '../../navbar/page';

const ProgrammingQuestionnaire = () => {
  const router = useRouter();

  // คำถามวัดแนวโน้ม — ไม่มีคำตอบถูกผิด วัดเฉพาะว่าคุณถนัดแบบไหน
  // ข้อ 1-10, 21-40: เห็นด้วย → ชอบ logic/data/system  | ไม่เห็นด้วย → ชอบ people/empathy
  // ข้อ 11-20, 41-60: เห็นด้วย → ชอบ detail/concrete  | ไม่เห็นด้วย → ชอบ vision/abstract
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
    { id: 21, text: 'ฉันชอบเขียน unit test ที่ครอบคลุมทุก edge case มากกว่าถามความเห็นทีมว่าฟีเจอร์นี้ใช้งานง่ายหรือไม่' },
    { id: 22, text: 'เมื่อเกิดบั๊กในโปรดักชัน ฉันสนใจหาสาเหตุทางเทคนิคมากกว่าปลอบใจทีมที่เครียดกับเหตุการณ์นั้น' },
    { id: 23, text: 'ฉันเลือกใช้ดาต้าและ log มาวิเคราะห์ปัญหามากกว่าฟังความรู้สึกของผู้ใช้ที่บ่นเข้ามา' },
    { id: 24, text: 'ฉันสนุกกับการอ่าน documentation เชิงเทคนิคมากกว่าพูดคุยเรื่องบรรยากาศการทำงานของทีม' },
    { id: 25, text: 'ฉันให้ความสำคัญกับความถูกต้องของ algorithm มากกว่าความรู้สึกของคนที่เขียนโค้ดนั้นมาก่อน' },
    { id: 26, text: 'เมื่อ pair programming ฉันมุ่งหาคำตอบที่ถูกต้องมากกว่าประคับประคองความมั่นใจของคู่หู' },
    { id: 27, text: 'ฉันชอบ benchmark ประสิทธิภาพของระบบมากกว่าสำรวจความพึงพอใจของทีมต่อเครื่องมือที่ใช้' },
    { id: 28, text: 'ฉันเลือกเทคโนโลยีจากการเปรียบเทียบข้อมูลเชิงเทคนิคมากกว่าความคุ้นเคยที่ทีมรู้สึกสบายใจ' },
    { id: 29, text: 'ฉันชี้ให้เห็นข้อผิดพลาดใน design doc ตรงๆ มากกว่าพูดให้ดูนุ่มนวลเพื่อไม่ให้เสียน้ำใจ' },
    { id: 30, text: 'ฉันสนใจ trade-off ด้าน scalability มากกว่าฟังว่าทีมรู้สึกอย่างไรกับการเปลี่ยน architecture' },
    { id: 31, text: 'ฉันตัดสินใจ merge code โดยดูจากผลเทสต์ผ่านมากกว่าความรู้สึกอยากให้กำลังใจเพื่อนที่เพิ่งเขียนเสร็จ' },
    { id: 32, text: 'ฉันสนุกกับการไล่ stack trace เพื่อหาต้นตอบั๊กมากกว่าพูดคุยปลอบใจคนที่ทำให้เกิดบั๊กนั้น' },
    { id: 33, text: 'ฉันให้น้ำหนักกับตัวเลข performance metric มากกว่าความรู้สึกภูมิใจของทีมที่ทำฟีเจอร์นั้นสำเร็จ' },
    { id: 34, text: 'ฉันเลือกอธิบายปัญหาทางเทคนิคด้วยข้อมูลล้วนๆ มากกว่าปรับคำพูดให้ทีมที่ไม่ถนัดเรื่องนี้เข้าใจง่ายขึ้น' },
    { id: 35, text: 'ฉันสนใจความเป็นระเบียบของ codebase มากกว่าความสนุกสนานในการทำงานร่วมกันของทีม' },
    { id: 36, text: 'เมื่อต้องเลือกระหว่างวิธีแก้บั๊กที่เร็วกับการรักษาน้ำใจคนที่เขียนโค้ดเดิม ฉันเลือกวิธีที่เร็วกว่าเสมอ' },
    { id: 37, text: 'ฉันชอบตรวจสอบความถูกต้องของ unit test มากกว่าการพูดให้กำลังใจเพื่อนร่วมทีมหลังเดดไลน์หนักๆ' },
    { id: 38, text: 'ฉันให้ความสำคัญกับ consistency ของโค้ดมากกว่าความรู้สึกอยากเขียนสไตล์ของตัวเองให้ทีมยอมรับ' },
    { id: 39, text: 'ฉันเลือกฟีเจอร์ที่มี data รองรับชัดเจนมากกว่าฟีเจอร์ที่ทีมรู้สึกอยากทำเพราะมันท้าทาย' },
    { id: 40, text: 'ฉันมองว่าการแก้ปัญหาทางเทคนิคให้ตรงจุดสำคัญกว่าการประชุมเพื่อสร้างความเข้าใจร่วมกันในทีม' },
    { id: 41, text: 'ฉันชอบทำงานตาม spec ที่ระบุไว้ละเอียดมากกว่าตีความ requirement ที่ยังคลุมเครือเอง' },
    { id: 42, text: 'ฉันสนใจปรับปรุงโค้ดที่มีอยู่ให้ดีขึ้นทีละนิดมากกว่ารื้อระบบใหม่ทั้งหมดเพื่อทำตามไอเดียใหม่' },
    { id: 43, text: 'ฉันถนัดเขียนเอกสารอธิบายขั้นตอนการทำงานปัจจุบันมากกว่าจินตนาการ roadmap ระยะยาวของผลิตภัณฑ์' },
    { id: 44, text: 'ฉันชอบใช้ library ที่มีคนใช้กันแพร่หลายและมีตัวอย่างชัดเจนมากกว่าทดลอง framework ใหม่ที่ยังไม่มีคนรีวิว' },
    { id: 45, text: 'ฉันสนใจ debug ปัญหาที่เกิดขึ้นจริงตรงหน้ามากกว่าคิดว่าระบบควรพัฒนาไปทางไหนในอีกหลายปี' },
    { id: 46, text: 'ฉันชอบเขียนโค้ดตามรูปแบบที่ทีมตกลงกันไว้แล้วมากกว่าทดลองแพทเทิร์นใหม่ที่ยังไม่มีใครลองในทีม' },
    { id: 47, text: 'ฉันให้ความสำคัญกับการตรวจสอบทุก edge case ที่ระบุไว้มากกว่าการคิดฟีเจอร์ใหม่ที่ยังไม่มีใครขอ' },
    { id: 48, text: 'ฉันชอบทำงานในโปรเจกต์ที่มี timeline และ milestone ชัดเจนมากกว่าโปรเจกต์เชิงสำรวจที่ยังไม่รู้ผลลัพธ์' },
    { id: 49, text: 'ฉันถนัดไล่อ่าน log และข้อมูล error ทีละบรรทัดมากกว่าระดมไอเดียเชิงกลยุทธ์กับทีม' },
    { id: 50, text: 'ฉันเลือกใช้วิธีแก้ปัญหาที่เคยทำสำเร็จมาก่อนมากกว่าทดลองวิธีใหม่ที่ยังไม่มีใครพิสูจน์' },
    { id: 51, text: 'ฉันสนใจรายละเอียดของ API contract ทุกฟิลด์มากกว่าวิสัยทัศน์รวมของระบบในอีก 5 ปี' },
    { id: 52, text: 'ฉันชอบงานที่ทำซ้ำแล้วทำให้ชำนาญขึ้นเรื่อยๆ มากกว่างานที่ต้องคิดสิ่งใหม่ตลอดเวลา' },
    { id: 53, text: 'ฉันให้ความสำคัญกับการปิด ticket ที่มีอยู่ให้ครบมากกว่าเสนอ roadmap ผลิตภัณฑ์ใหม่' },
    { id: 54, text: 'ฉันถนัดเขียน migration script ที่แม่นยำมากกว่าออกแบบ architecture ที่ยังเป็นแค่แนวคิด' },
    { id: 55, text: 'ฉันชอบตรวจทาน pull request ทีละบรรทัดมากกว่าคิดไอเดียฟีเจอร์ใหม่ที่ยังไม่มีคนขอ' },
    { id: 56, text: 'ฉันสนใจปรับแต่งประสิทธิภาพของฟังก์ชันที่มีอยู่มากกว่าออกแบบระบบใหม่ทั้งหมดจากศูนย์' },
    { id: 57, text: 'ฉันชอบทำงานกับ requirement ที่ระบุไว้ชัดเจนเป็นข้อๆ มากกว่าโจทย์ปลายเปิดที่ต้องตีความเอง' },
    { id: 58, text: 'ฉันถนัดเขียน regression test ให้ครอบคลุมมากกว่าเสนอแนวทาง technology ใหม่ที่ยังไม่มีใครในทีมรู้จัก' },
    { id: 59, text: 'ฉันชอบงานซ่อมแซมหรือปรับปรุง legacy code มากกว่าเริ่มโปรเจกต์ใหม่ที่ยังไม่มีอะไรเป็นรูปเป็นร่าง' },
    { id: 60, text: 'ฉันสนใจรายละเอียดของ test case มากกว่าการคาดเดาว่าผู้ใช้ในอนาคตจะต้องการอะไร' },
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
              &ldquo;{q.text}&rdquo;
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