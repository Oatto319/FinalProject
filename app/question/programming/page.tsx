'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, CheckCircle2 } from 'lucide-react';

const ProgrammingQuestionnaire = () => {
  const router = useRouter();

  // ข้อมูลคำถาม (จำลองจากรูปภาพ)
  const questions = [
    { id: 1, text: "เมื่อเริ่มโปรเจกต์ใหม่ คุณมักทำอะไรเป็นอันดับแรก?" },
    { id: 2, text: "เมื่อเริ่มโปรเจกต์ใหม่ คุณมักทำอะไรเป็นอันดับแรก?" },
    { id: 3, text: "เมื่อเริ่มโปรเจกต์ใหม่ คุณมักทำอะไรเป็นอันดับแรก?" },
  ];

  // เก็บสถานะการเลือกของแต่ละคำถาม (1-7)
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // --- เพิ่ม: state สำหรับ popup ---
  const [showPopup, setShowPopup] = useState(false);

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
    setShowPopup(true);
  };

  // --- เพิ่ม: ปิด popup แล้วกลับ templates ---
  const handlePopupClose = () => {
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
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[40px] p-10 flex flex-col items-center gap-6 shadow-2xl mx-4 max-w-sm w-full">
            <CheckCircle2 size={72} className="text-green-500" strokeWidth={1.5} />
            <div className="text-center">
              <h2 className="text-2xl font-black text-[#1A2E44] mb-2">เสร็จแล้ว!</h2>
              <p className="text-gray-400 font-medium">คุณตอบแบบทดสอบครบทุกข้อแล้ว</p>
            </div>
            <button
              onClick={handlePopupClose}
              className="w-full bg-[#4B3E7A] text-white py-4 rounded-2xl font-black text-lg hover:bg-[#3b3161] transition-colors shadow-lg">
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgrammingQuestionnaire;