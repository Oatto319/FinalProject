'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Sparkles, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

const MODES = [
  {
    id: 'auto',
    title: 'จับคู่อัตโนมัติ',
    subtitle: 'AUTO MATCH',
    description: 'ระบบวิเคราะห์ MBTI ของสมาชิกทุกคนแล้วจัดกลุ่มให้สมดุล แต่ละทีมจะได้สมาชิกที่มีความถนัดหลากหลายและเสริมกัน',
    icon: <Sparkles className="w-8 h-8" />,
  },
  {
    id: 'selection',
    title: 'กำหนดเอง',
    subtitle: 'SELECTION',
    description: 'คุณเป็นคนกำหนดว่าแต่ละกลุ่มจะประกอบด้วย MBTI type ไหนบ้าง และจำนวนเท่าไหร่ เหมาะสำหรับงานที่ต้องการทีมในรูปแบบเฉพาะเจาะจง',
    icon: <SlidersHorizontal className="w-8 h-8" />,
  },
];

export default function TypeSelectionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    const raw = localStorage.getItem('pendingRoom');
    const room = raw ? JSON.parse(raw) : {};
    localStorage.setItem('pendingRoom', JSON.stringify({ ...room, matchMode: selected }));

    if (selected === 'selection') {
      router.push('/create/typesetting');
    } else {
      router.push('/create/match');
    }
  };

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      <main className="w-full max-w-3xl mt-8 px-4 pb-12">
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm flex flex-col items-center min-h-[520px] relative">

          {/* Back */}
          <button
            onClick={() => router.back()}
            className="absolute left-8 top-8 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-all active:scale-90"
          >
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>

          {/* Title */}
          <div className="text-center mt-4 mb-10">
            <h1 className="text-[#2D3E50] text-3xl font-black italic mb-2 tracking-wide uppercase">
              &ldquo;Type Selection&rdquo;
            </h1>
            <p className="text-gray-500 font-bold">เลือกรูปแบบการจัดกลุ่มตาม MBTI</p>
          </div>

          {/* Mode Cards */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelected(mode.id)}
                className={`
                  bg-[#2D3E50] rounded-[30px] p-8 flex flex-col items-center text-center gap-4 shadow-xl
                  transition-all duration-300 border-4 relative group
                  ${selected === mode.id
                    ? 'border-[#7096D1] scale-105 ring-4 ring-[#7096D1]/20'
                    : 'border-transparent hover:border-gray-500'}
                `}
              >
                {selected === mode.id && (
                  <div className="absolute top-4 right-4 text-white">
                    <CheckCircle2 size={24} fill="#7096D1" />
                  </div>
                )}

                <div className={`
                  w-20 h-20 rounded-full flex items-center justify-center mb-1 transition-colors
                  ${selected === mode.id ? 'bg-[#7096D1] text-white' : 'bg-white/10 text-white/60 group-hover:bg-white/20'}
                `}>
                  {mode.icon}
                </div>

                <div>
                  <p className="text-[#7096D1] text-xs font-bold tracking-widest uppercase mb-1">{mode.subtitle}</p>
                  <h3 className="text-white text-2xl font-black">{mode.title}</h3>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed font-medium">{mode.description}</p>
              </button>
            ))}
          </div>

          {/* Confirm */}
          <div className="w-full flex justify-center">
            <button
              disabled={!selected}
              onClick={handleConfirm}
              className={`
                w-full max-w-sm py-5 rounded-[25px] font-black text-2xl transition-all transform uppercase tracking-widest
                ${selected
                  ? 'bg-[#7096D1] text-white shadow-[0_8px_0_0_#4A6FA5] hover:shadow-[0_4px_0_0_#4A6FA5] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              CONFIRM
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
