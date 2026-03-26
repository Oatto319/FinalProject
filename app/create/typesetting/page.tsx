'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Minus } from 'lucide-react';

const TYPES = [
  { key: 'ผู้ประสานงาน', label: 'ผู้ประสานงาน', icon: '/img/make.png' },
  { key: 'นักสร้างสรรค์', label: 'นักสร้างสรรค์', icon: '/img/idea.png' },
  { key: 'ผู้ปฏิบัติ',    label: 'ผู้ปฏิบัติ',    icon: '/img/pencil.png' },
  { key: 'นักวิเคราะห์',  label: 'นักวิเคราะห์',  icon: '/img/brain.png' },
];

export default function TypeSelectionPage() {
  const router = useRouter();
  const [groupSize, setGroupSize] = useState(4);
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(TYPES.map((t) => [t.key, 0]))
  );
  const [warning, setWarning] = useState('');

  useEffect(() => {
    const pending = localStorage.getItem('pendingRoom');
    const current = localStorage.getItem('currentRoom');
    const size =
      (pending && JSON.parse(pending).groupSize) ||
      (current && JSON.parse(current).groupSize);
    if (size) setGroupSize(Number(size));
  }, []);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const increment = (key: string) => {
    if (total >= groupSize) return;
    setCounts((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    setWarning('');
  };

  const decrement = (key: string) => {
    if (counts[key] <= 0) return;
    setCounts((prev) => ({ ...prev, [key]: prev[key] - 1 }));
    setWarning('');
  };

  const handleCreate = () => {
    if (total < groupSize) {
      setWarning(`ยังเลือกไม่ครบ (${total}/${groupSize}) — กด Create อีกครั้งเพื่อดำเนินการต่อ`);
      if (!warning) return;
    }
    const raw = localStorage.getItem('pendingRoom');
    const room = raw ? JSON.parse(raw) : {};
    localStorage.setItem('pendingRoom', JSON.stringify({ ...room, typeComposition: counts }));
    router.push('/create/match');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">

      {/* Decorative icons — corners */}
      <img src="/img/brain.png"  alt="" className="absolute top-6  left-6  w-28 h-28 object-contain opacity-90 pointer-events-none" />
      <img src="/img/idea.png"   alt="" className="absolute top-6  right-6 w-28 h-28 object-contain opacity-90 pointer-events-none" />
      <img src="/img/pencil.png" alt="" className="absolute bottom-6 left-6  w-24 h-24 object-contain opacity-90 pointer-events-none" />
      <img src="/img/make.png"   alt="" className="absolute bottom-6 right-6 w-24 h-24 object-contain opacity-90 pointer-events-none" />

      {/* Title */}
      <h1 className="text-5xl font-black uppercase tracking-tight text-[#2D3E50] mb-8"
          style={{ fontFamily: 'sans-serif', letterSpacing: '-1px' }}>
        Type Settings
      </h1>

      {/* Card */}
      <div className="bg-[#C4C9E2] rounded-[32px] p-8 w-full max-w-lg shadow-lg">

        {/* Members count */}
        <p className="text-center text-2xl font-black text-[#5B5EA6] mb-6">
          {groupSize} <span className="font-bold">:Members</span>
        </p>

        {/* Types grid */}
        <div className="bg-[#E8EAF3] rounded-2xl p-6">
          <div className="grid grid-cols-4 gap-4">
            {/* Icons row */}
            {TYPES.map((t) => (
              <div key={t.key} className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 flex items-center justify-center">
                  <img src={t.icon} alt={t.label} className="w-12 h-12 object-contain" />
                </div>
                <span className="text-[10px] font-bold text-[#3D3D6B] text-center leading-tight">
                  {t.label}
                </span>
              </div>
            ))}

            {/* Plus buttons row */}
            {TYPES.map((t) => (
              <div key={t.key + '-plus'} className="flex justify-center">
                <button
                  onClick={() => increment(t.key)}
                  disabled={total >= groupSize}
                  className="w-10 h-10 rounded-full bg-[#7C6FCD] text-white flex items-center justify-center shadow hover:bg-[#6B5FB8] active:scale-95 transition-all disabled:opacity-40"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>
            ))}

            {/* Count boxes row */}
            {TYPES.map((t) => (
              <div key={t.key + '-count'} className="flex justify-center">
                <button
                  onClick={() => decrement(t.key)}
                  className="w-12 h-12 rounded-xl bg-[#8B8FAD] text-white text-xl font-black flex items-center justify-center shadow active:scale-95 transition-all select-none"
                >
                  {counts[t.key]}
                </button>
              </div>
            ))}
          </div>

          {/* Total indicator */}
          <p className="text-center text-xs font-semibold text-[#5B5EA6] mt-4">
            รวม {total} / {groupSize}
          </p>
        </div>

        {warning && (
          <p className="text-center text-xs text-orange-600 font-semibold mt-3">{warning}</p>
        )}

        {/* Bottom buttons */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => router.back()}
            className="w-12 h-12 rounded-full bg-[#4A4E6B] text-white flex items-center justify-center shadow hover:bg-[#3A3E58] active:scale-95 transition-all"
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>

          <button
            onClick={handleCreate}
            className="bg-[#2D3E50] text-white px-10 py-3 rounded-2xl font-bold text-lg shadow hover:bg-[#1E293B] active:scale-95 transition-all"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
