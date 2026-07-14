'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Minus } from 'lucide-react';
import { TYPES_BY_TEMPLATE, DEFAULT_TEMPLATE_TYPES as DEFAULT_TYPES } from '@/lib/type-composition';
import { roleColor } from '@/lib/mbti';

export default function TypeSelectionPage() {
  const router = useRouter();
  const [groupSize, setGroupSize] = useState(4);
  const [types, setTypes] = useState(DEFAULT_TYPES);
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(DEFAULT_TYPES.map((t) => [t.key, 0]))
  );
  const [warning, setWarning] = useState('');

  useEffect(() => {
    const pending = localStorage.getItem('pendingRoom');
    const current = localStorage.getItem('currentRoom');
    const pendingParsed = pending ? JSON.parse(pending) : null;
    const size =
      (pendingParsed?.groupSize) ||
      (current && JSON.parse(current).groupSize);
    if (size) setGroupSize(Number(size));

    const template = (pendingParsed?.template ?? 'programming').toLowerCase();
    const resolvedTypes = TYPES_BY_TEMPLATE[template] ?? DEFAULT_TYPES;
    setTypes(resolvedTypes);
    setCounts(Object.fromEntries(resolvedTypes.map((t) => [t.key, 0])));
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
      setWarning(`ยังเลือกไม่ครบ (${total}/${groupSize})`);
      return;
    }
    const raw = localStorage.getItem('pendingRoom');
    const room = raw ? JSON.parse(raw) : {};
    localStorage.setItem('pendingRoom', JSON.stringify({ ...room, typeComposition: counts }));
    router.push('/create/match');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">

      {/* Decorative type labels — corners */}
      {types[0] && <span className="absolute top-2 left-2 sm:top-6 sm:left-6 text-lg sm:text-2xl md:text-3xl font-black opacity-20 pointer-events-none select-none" style={{ color: roleColor(types[0].icon) }}>{types[0].label}</span>}
      {types[1] && <span className="absolute top-2 right-2 sm:top-6 sm:right-6 text-lg sm:text-2xl md:text-3xl font-black opacity-20 pointer-events-none select-none" style={{ color: roleColor(types[1].icon) }}>{types[1].label}</span>}
      {types[2] && <span className="absolute bottom-2 left-2 sm:bottom-6 sm:left-6 text-base sm:text-xl md:text-2xl font-black opacity-20 pointer-events-none select-none" style={{ color: roleColor(types[2].icon) }}>{types[2].label}</span>}
      {types[3] && <span className="absolute bottom-2 right-2 sm:bottom-6 sm:right-6 text-base sm:text-xl md:text-2xl font-black opacity-20 pointer-events-none select-none" style={{ color: roleColor(types[3].icon) }}>{types[3].label}</span>}

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-[#2D3E50] mb-6 sm:mb-8"
          style={{ fontFamily: 'sans-serif', letterSpacing: '-1px' }}>
        Type Settings
      </h1>

      {/* Card */}
      <div className="bg-[#C4C9E2] rounded-[20px] p-4 sm:p-6 md:p-8 w-full max-w-lg shadow-lg">

        {/* Members count */}
        <p className="text-center text-xl sm:text-2xl font-black text-[#5B5EA6] mb-4 sm:mb-6">
          {groupSize} <span className="font-bold">:Members</span>
        </p>

        {/* Types grid */}
        <div className="bg-[#E8EAF3] rounded-2xl p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {/* Icons row */}
            {types.map((t) => (
              <div key={t.key} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full" style={{ backgroundColor: `${roleColor(t.icon)}22` }}>
                  <img src={t.icon} alt={t.label} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-contain" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-[#3D3D6B] text-center leading-tight">{t.label}</span>
                {t.subtitle && (
                  <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${roleColor(t.icon)}22`, color: roleColor(t.icon) }}>{t.subtitle}</span>
                )}
              </div>
            ))}

            {/* Plus buttons row */}
            {types.map((t) => (
              <div key={t.key + '-plus'} className="flex justify-center">
                <button
                  onClick={() => increment(t.key)}
                  disabled={total >= groupSize}
                  className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-[#7C6FCD] text-white flex items-center justify-center shadow hover:bg-[#6B5FB8] active:scale-95 transition-all disabled:opacity-40"
                >
                  <Plus size={16} strokeWidth={3} className="sm:hidden" />
                  <Plus size={20} strokeWidth={3} className="hidden sm:block" />
                </button>
              </div>
            ))}

            {/* Count boxes row */}
            {types.map((t) => (
              <div key={t.key + '-count'} className="flex justify-center">
                <button
                  onClick={() => decrement(t.key)}
                  className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-[#8B8FAD] text-white text-base sm:text-lg md:text-xl font-black flex items-center justify-center shadow active:scale-95 transition-all select-none"
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
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
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
