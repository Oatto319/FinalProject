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
    bg: 'bg-[#E39B56]',
    shadow: 'shadow-[0_6px_0_0_#B9743A]',
    hoverShadow: 'hover:shadow-[0_3px_0_0_#B9743A]',
    ring: 'ring-white/40',
    iconBgActive: 'bg-white text-[#E39B56]',
    iconBgIdle: 'bg-white/20 text-white',
  },
  {
    id: 'selection',
    title: 'กำหนดเอง',
    subtitle: 'SELECTION',
    description: 'คุณเป็นคนกำหนดว่าแต่ละกลุ่มจะประกอบด้วย MBTI type ไหนบ้าง และจำนวนเท่าไหร่ เหมาะสำหรับงานที่ต้องการทีมในรูปแบบเฉพาะเจาะจง',
    icon: <SlidersHorizontal className="w-8 h-8" />,
    bg: 'bg-[#9C7BC9]',
    shadow: 'shadow-[0_6px_0_0_#6D4B98]',
    hoverShadow: 'hover:shadow-[0_3px_0_0_#6D4B98]',
    ring: 'ring-white/40',
    iconBgActive: 'bg-white text-[#9C7BC9]',
    iconBgIdle: 'bg-white/20 text-white',
  },
];

export default function TypeSelectionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selected) return;

    // บันทึกลง localStorage
    const raw = localStorage.getItem('pendingRoom');
    const room = raw ? JSON.parse(raw) : {};
    localStorage.setItem('pendingRoom', JSON.stringify({ ...room, matchMode: selected }));

    // บันทึกลง DB ด้วย เพื่อให้ทุกหน้าอ่านได้ถูกต้อง
    const roomRaw = localStorage.getItem('currentRoom');
    if (roomRaw) {
      const currentRoom = JSON.parse(roomRaw);
      const roomId = currentRoom.roomId ?? currentRoom.id;
      await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'settings', matchMode: selected }),
      });
    }

    if (selected === 'selection') {
      router.push('/create/manual');
    } else {
      router.push('/create/match');
    }
  };

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      <main className="w-full max-w-3xl mt-8 px-4 pb-12">
        <div className="bg-white rounded-[24px] p-4 sm:p-8 md:p-12 shadow-sm flex flex-col items-center min-h-[520px] relative">

          {/* Back */}
          <button
            onClick={() => router.back()}
            className="absolute left-4 bottom-4 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
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
                  ${mode.bg} ${mode.shadow} ${mode.hoverShadow}
                  rounded-[20px] p-6 md:p-8 flex flex-row md:flex-col items-center text-left md:text-center gap-4
                  transition-all duration-150 transform relative group
                  ${selected === mode.id
                    ? `scale-105 ring-4 ${mode.ring}`
                    : 'hover:translate-y-[3px] active:translate-y-[6px] active:shadow-none'}
                `}
              >
                {selected === mode.id && (
                  <div className="absolute top-4 right-4 text-white">
                    <CheckCircle2 size={24} fill="rgba(255,255,255,0.3)" />
                  </div>
                )}

                <div className={`
                  w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shrink-0 md:mb-1 transition-colors
                  ${selected === mode.id ? mode.iconBgActive : mode.iconBgIdle}
                `}>
                  {mode.icon}
                </div>

                <div className="flex flex-col items-start md:items-center">
                  <p className="text-white/80 text-xs font-bold tracking-widest uppercase mb-1">{mode.subtitle}</p>
                  <h3 className="text-white text-2xl font-black">{mode.title}</h3>
                  <p className="text-white/90 text-sm leading-relaxed font-medium mt-2 md:mt-0">{mode.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Confirm */}
          <div className="w-full flex justify-end">
            <button
              disabled={!selected}
              onClick={handleConfirm}
              className={`
                px-10 py-3 rounded-[18px] font-black text-lg transition-all transform uppercase tracking-widest
                ${selected
                  ? 'bg-[#7096D1] text-white shadow-[0_6px_0_0_#4A6FA5] hover:shadow-[0_3px_0_0_#4A6FA5] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px]'
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