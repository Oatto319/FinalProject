'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ArrowRightCircle } from 'lucide-react';
import Navbar from '../../navbar/page';

// ✅ ข้อความ "JOIN" ลอยผ่านจอเป็นพื้นหลัง (รูปแบบเดียวกับ app/page.tsx)
const BACKGROUND_FLOAT_TEXT = [
  { top: '6%',  left: '-10%', fontSize: 'clamp(1.2rem, 14vw, 5rem)',   rotate: '-24deg', opacity: 0.14, drift: 'waveDrift1', duration: '26s', delay: '0s' },
  { top: '20%', left: '-15%', fontSize: 'clamp(1.5rem, 20vw, 8rem)',  rotate: '16deg',  opacity: 0.12, drift: 'waveDrift2', duration: '32s', delay: '-4s' },
  { top: '38%', left: '-10%', fontSize: 'clamp(1rem,   12vw, 4rem)',  rotate: '-8deg',  opacity: 0.16, drift: 'waveDrift3', duration: '22s', delay: '-8s' },
  { top: '56%', left: '-15%', fontSize: 'clamp(1.5rem, 22vw, 9rem)',  rotate: '-18deg', opacity: 0.12, drift: 'waveDrift1', duration: '34s', delay: '-10s' },
  { top: '74%', left: '-10%', fontSize: 'clamp(1.2rem, 16vw, 6rem)',  rotate: '20deg',  opacity: 0.16, drift: 'waveDrift3', duration: '25s', delay: '-6s' },
  { top: '90%', left: '-15%', fontSize: 'clamp(1rem,   12vw, 4.5rem)',rotate: '-30deg', opacity: 0.14, drift: 'waveDrift2', duration: '30s', delay: '-14s' },
];

export default function EnterRoomIdPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  const handleBack = () => { setLeaving(true); setTimeout(() => router.back(), 480); };

  const handleNext = async () => {
    if (loading) return;
    if (!roomId.trim()) { setError('กรุณากรอก Room ID'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId.trim()}`);
      const data = await res.json();
      if (!data.room) { setError('ไม่พบห้องนี้ กรุณาตรวจสอบ Room ID อีกครั้ง'); return; }
      localStorage.setItem('enteredRoomId', roomId.trim());
      router.push('/join/check');
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes waveDrift1 {
          0%   { transform: translateX(-10vw) translateY(0vh); }
          50%  { transform: translateX(120vw) translateY(-6vh); }
          100% { transform: translateX(-10vw) translateY(0vh); }
        }

        @keyframes waveDrift2 {
          0%   { transform: translateX(-10vw) translateY(0vh); }
          50%  { transform: translateX(115vw) translateY(8vh); }
          100% { transform: translateX(-10vw) translateY(0vh); }
        }

        @keyframes waveDrift3 {
          0%   { transform: translateX(-10vw) translateY(0vh); }
          50%  { transform: translateX(125vw) translateY(-4vh); }
          100% { transform: translateX(-10vw) translateY(0vh); }
        }
      `}</style>

      <div
        className="h-screen font-sans flex flex-col overflow-hidden relative"
        style={{ background: '#74D1FF', fontFamily: 'var(--font-geologica), sans-serif' }}
      >
        {/* ✅ เลเยอร์พื้นหลัง JOIN ลอยผ่านจอ */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
        >
          {BACKGROUND_FLOAT_TEXT.map((s, i) => (
            <div
              key={`text-${i}`}
              style={{
                position: 'absolute',
                top: s.top,
                left: s.left,
                transform: `rotate(${s.rotate})`,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  fontSize: s.fontSize,
                  opacity: s.opacity,
                  color: '#F5F5F5',
                  fontFamily: 'var(--font-luckiest-guy), Arial, sans-serif',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  letterSpacing: '-0.03em',
                  whiteSpace: 'nowrap',
                  animation: `${s.drift} ${s.duration} linear infinite`,
                  animationDelay: s.delay,
                }}
              >
                JOIN
              </span>
            </div>
          ))}
        </div>

        <div className="relative z-20">
          <Navbar bgColor="#3A9EC7" nameColor="white" />
        </div>

        <main className={`relative z-10 flex-1 flex flex-col w-full max-w-5xl mx-auto mt-4 px-4 overflow-hidden transition-transform duration-500 ease-out ${mounted && !leaving ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="bg-white rounded-[24px] rounded-bl-none rounded-br-none p-4 sm:p-8 md:p-12 shadow-sm flex flex-col items-center flex-1 relative">
            <div className="w-full flex justify-center -mt-20 sm:-mt-36 mb-4 relative z-10">
              <img src="/img/team.png" alt="Team Illustration" className="w-full max-w-[460px] h-auto object-contain drop-shadow-xl"
                onError={(e) => { e.currentTarget.src = 'https://img.freepik.com/free-vector/team-holding-jigsaw-puzzle-pieces_74855-6962.jpg'; }} />
            </div>
            <div className="w-full max-w-[380px] bg-[#1D324B] rounded-[20px] p-5 sm:p-8 flex flex-col items-center gap-4 shadow-lg mb-8">
              <label className="text-white text-xl">&quot;Enter the room ID&quot;</label>
              <input type="text" placeholder="กรอก Room ID" value={roomId}
                onChange={(e) => { setRoomId(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                className="w-full bg-white rounded-xl py-4 px-6 text-[#2D3E50] font-bold text-2xl text-center focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all tracking-[0.2em] placeholder:text-gray-400 placeholder:font-normal placeholder:text-sm placeholder:tracking-normal" />
              {error && <p className="text-red-300 text-sm font-bold">{error}</p>}
            </div>
            <div className="w-full max-w-[380px] flex justify-between items-center mt-8">
              <button className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 transition-all active:scale-95" onClick={handleBack}>
                <ChevronLeft size={24} strokeWidth={2.5} />
              </button>
              <button onClick={handleNext} disabled={loading}
                className="bg-[#2D3E50] text-white flex items-center gap-3 px-8 py-3 rounded-2xl hover:bg-[#1E293B] transition-all active:scale-95 shadow-md group disabled:opacity-60">
                <span className="font-bold text-lg">{loading ? 'กำลังตรวจสอบ...' : 'Next'}</span>
                <ArrowRightCircle className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}