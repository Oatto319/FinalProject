'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import Navbar from './navbar/page';

type RevealState = {
  x: number; y: number;
  color: string; textColor: string;
  label: string; route: string;
};

const SCATTERED_TEXT = [
  { top: '6%',  left: '4%',  fontSize: 'clamp(1.5rem, 10vw, 7rem)',  rotate: '-18deg', opacity: 0.18 },
  { top: '3%',  left: '55%', fontSize: 'clamp(1rem,   5vw,  3.5rem)', rotate: '12deg',  opacity: 0.14 },
  { top: '8%',  left: '72%', fontSize: 'clamp(1.2rem, 8vw,  5.5rem)', rotate: '-8deg',  opacity: 0.20 },
  { top: '28%', left: '2%',  fontSize: 'clamp(1rem,   4vw,  3rem)',   rotate: '22deg',  opacity: 0.13 },
  { top: '35%', left: '55%', fontSize: 'clamp(1.5rem, 11vw, 8rem)',   rotate: '-14deg', opacity: 0.16 },
  { top: '50%', left: '15%', fontSize: 'clamp(1.2rem, 7vw,  5rem)',   rotate: '10deg',  opacity: 0.18 },
  { top: '55%', left: '70%', fontSize: 'clamp(1rem,   5vw,  3.5rem)', rotate: '-20deg', opacity: 0.14 },
  { top: '65%', left: '5%',  fontSize: 'clamp(1.2rem, 9vw,  6rem)',   rotate: '16deg',  opacity: 0.20 },
  { top: '70%', left: '45%', fontSize: 'clamp(1rem,   6vw,  4rem)',   rotate: '-6deg',  opacity: 0.15 },
  { top: '80%', left: '18%', fontSize: 'clamp(1.5rem, 12vw, 9rem)',   rotate: '-12deg', opacity: 0.17 },
  { top: '83%', left: '68%', fontSize: 'clamp(1rem,   6vw,  4.5rem)', rotate: '18deg',  opacity: 0.13 },
  { top: '91%', left: '48%', fontSize: 'clamp(1rem,   4vw,  3rem)',   rotate: '-25deg', opacity: 0.15 },
];

// ✅ ข้อความ "GROUP GENIUS" ลอยผ่านจอเป็นพื้นหลัง (ใหญ่ขึ้นบนมือถือ)
const BACKGROUND_FLOAT_TEXT = [
  { top: '6%',  left: '-10%', fontSize: 'clamp(1.2rem, 14vw, 5rem)',   rotate: '-24deg', opacity: 0.12, drift: 'waveDrift1', duration: '26s', delay: '0s' },
  { top: '20%', left: '-15%', fontSize: 'clamp(1.5rem, 20vw, 8rem)',  rotate: '16deg',  opacity: 0.10, drift: 'waveDrift2', duration: '32s', delay: '-4s' },
  { top: '38%', left: '-10%', fontSize: 'clamp(1rem,   12vw, 4rem)',  rotate: '-8deg',  opacity: 0.14, drift: 'waveDrift3', duration: '22s', delay: '-8s' },
  { top: '56%', left: '-15%', fontSize: 'clamp(1.5rem, 22vw, 9rem)',  rotate: '-18deg', opacity: 0.10, drift: 'waveDrift1', duration: '34s', delay: '-10s' },
  { top: '74%', left: '-10%', fontSize: 'clamp(1.2rem, 16vw, 6rem)',  rotate: '20deg',  opacity: 0.14, drift: 'waveDrift3', duration: '25s', delay: '-6s' },
  { top: '90%', left: '-15%', fontSize: 'clamp(1rem,   12vw, 4.5rem)',rotate: '-30deg', opacity: 0.12, drift: 'waveDrift2', duration: '30s', delay: '-14s' },
];

// ✅ รูป crown.PNG ลอยแทรกในเลเยอร์เดียวกัน (ขนาดใหญ่ขึ้น + opacity เข้มขึ้นเล็กน้อย)
const BACKGROUND_FLOAT_CROWN = [
  { top: '14%', left: '-10%', size: '5rem',   rotate: '-15deg', opacity: 0.16, drift: 'waveDrift2', duration: '28s', delay: '-2s' },
  { top: '46%', left: '-15%', size: '3.5rem', rotate: '20deg',  opacity: 0.13, drift: 'waveDrift1', duration: '31s', delay: '-9s' },
  { top: '65%', left: '-10%', size: '5.5rem', rotate: '-10deg', opacity: 0.15, drift: 'waveDrift3', duration: '24s', delay: '-5s' },
  { top: '84%', left: '-15%', size: '4.2rem', rotate: '12deg',  opacity: 0.12, drift: 'waveDrift2', duration: '27s', delay: '-12s' },
];

const App = () => {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reveal, setReveal] = useState<RevealState | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      router.replace('/login');
    } else {
      setReady(true);
      setTimeout(() => setMounted(true), 10);
    }
  }, [router]);

  // ✅ เช็คว่ามีแบบประเมินเพื่อนร่วมทีมค้างอยู่หรือไม่ (ใช้กันปุ่ม Create / Join / MY TYPE / Quiz)
  useEffect(() => {
    if (!localStorage.getItem('currentUser')) return;

    const check = () => {
      fetch('/api/evaluations')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => { if (data) setPendingCount((data.pending ?? []).length); })
        .catch(() => {});
    };

    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // ✅ ปุ่มที่ต้องถูกกันด้วยแบบประเมิน (ไม่ใช่ Team / Evaluate) จะเรียกผ่านฟังก์ชันนี้
  // ถ้ามีแบบประเมินค้างอยู่ -> กดเข้าไม่ได้ ขึ้น popup แทนทันที ไม่มีการนำทางเกิดขึ้น
  const guardedAction = (action: () => void) => {
    if (pendingCount > 0) {
      setShowPendingModal(true);
      return;
    }
    action();
  };

  const handleReveal = (e: React.MouseEvent, color: string, textColor: string, label: string, route: string) => {
    setReveal({ x: e.clientX, y: e.clientY, color, textColor, label, route });
  };

  useEffect(() => {
    if (!reveal) return;
    const timer = setTimeout(() => {
      router.push(reveal.route);
    }, 700);
    return () => clearTimeout(timer);
  }, [reveal, router]);

  if (!ready) return null;

  return (
    <>
      <style>{`
        @keyframes circleReveal {
          from { clip-path: circle(0% at var(--ox) var(--oy)); }
          to   { clip-path: circle(150% at var(--ox) var(--oy)); }
        }

        @keyframes bgGradientMove {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

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
        className="min-h-screen font-sans flex flex-col relative overflow-hidden"
        style={{
          background: '#7F5CFF',
        }}
      >
        {/* ✅ เลเยอร์พื้นหลัง GROUP GENIUS + crown ลอยผ่านจอ */}
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
                  color: `color-mix(in srgb, #F5F5F5 ${Math.round(s.opacity * 100)}%, #7F5CFF)`,
                  fontFamily: 'var(--font-luckiest-guy), Arial, sans-serif',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  letterSpacing: '-0.03em',
                  whiteSpace: 'nowrap',
                  animation: `${s.drift} ${s.duration} linear infinite`,
                  animationDelay: s.delay,
                }}
              >
                GROUP GENIUS
              </span>
            </div>
          ))}

          {BACKGROUND_FLOAT_CROWN.map((c, i) => (
            <div
              key={`crown-${i}`}
              style={{
                position: 'absolute',
                top: c.top,
                left: c.left,
                transform: `rotate(${c.rotate})`,
              }}
            >
              <img
                src="/img/crown.PNG"
                alt=""
                style={{
                  display: 'inline-block',
                  height: c.size,
                  width: 'auto',
                  opacity: c.opacity,
                  animation: `${c.drift} ${c.duration} linear infinite`,
                  animationDelay: c.delay,
                }}
              />
            </div>
          ))}
        </div>

        {reveal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: reveal.color,
              ['--ox' as string]: `${reveal.x}px`,
              ['--oy' as string]: `${reveal.y}px`,
              animation: 'circleReveal 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards',
              overflow: 'hidden',
            }}
          >
            {SCATTERED_TEXT.map((s, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  top: s.top,
                  left: s.left,
                  fontSize: s.fontSize,
                  transform: `rotate(${s.rotate})`,
                  opacity: s.opacity,
                  color: reveal.textColor,
                  fontFamily: 'var(--font-luckiest-guy), Arial, sans-serif',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  letterSpacing: '-0.03em',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              >
                {reveal.label}
              </span>
            ))}
          </div>
        )}

        <div className="relative z-20">
          <Navbar bgColor="#5B3FD4" nameColor="white" showSummaryButton />
        </div>

        <main className={`relative z-10 px-4 py-4 lg:px-8 lg:py-6 flex justify-center transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-full max-w-6xl lg:max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">

          {/* Left Section: Create, Join, Team */}
          <div className="bg-[#FFFFFF] rounded-[24px] px-4 sm:px-6 lg:px-8 pt-5 pb-6 sm:pb-8 lg:pt-7 lg:pb-10 shadow-sm flex flex-col gap-4 sm:gap-6 lg:gap-8">
            {/* Create Button (Yellow) */}
            <button
              className="h-28 sm:h-32 md:h-36 lg:h-44 w-full bg-[#FFDB10] rounded-[20px] font-black italic tracking-tighter shadow-[0_8px_0_0_#C9A800] hover:shadow-[0_4px_0_0_#C9A800] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all flex flex-col items-start justify-center pl-5 pt-6 relative overflow-hidden"
              onClick={(e) => guardedAction(() => handleReveal(e, '#FFDB10', '#A88200', 'Create', '/templates?mode=create'))}
            >
              <img src="/img/teacher.png" alt="" aria-hidden="true" className="absolute right-0 bottom-0 h-[110%] w-auto object-contain opacity-90 pointer-events-none select-none translate-y-4" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#A88200] [text-shadow:0_4px_0_rgba(201,168,0,0.5)] relative z-10">Create</h1>
              <p className="text-[#A88200] font-bold text-xs sm:text-sm lg:text-base not-italic tracking-normal relative z-10" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>สร้างห้อง</p>
            </button>

            {/* Join Button (Blue) */}
            <button
              className="h-28 sm:h-32 md:h-36 lg:h-44 w-full bg-[#74D1FF] rounded-[20px] font-black italic tracking-tighter shadow-[0_8px_0_0_#3A9EC7] hover:shadow-[0_4px_0_0_#3A9EC7] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all flex flex-col items-end justify-center pr-5 relative overflow-hidden"
              onClick={(e) => guardedAction(() => handleReveal(e, '#74D1FF', '#2D85A0', 'Join', '/join/roomid'))}
            >
              <img src="/img/team.png" alt="" aria-hidden="true" className="absolute left-0 bottom-0 h-[145%] w-auto object-contain opacity-90 pointer-events-none select-none" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#2D85A0] [text-shadow:0_4px_0_rgba(58,158,199,0.5)] relative z-10">Join</h1>
              <p className="text-[#2D85A0] font-bold text-xs sm:text-sm lg:text-base not-italic tracking-normal relative z-10" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>เข้าร่วมด้วยรหัส</p>
            </button>

            {/* Team Button (Purple) */}
            <button
              className="h-28 sm:h-32 md:h-36 lg:h-44 w-full bg-[#7F5CFF] rounded-[20px] font-black italic tracking-tighter shadow-[0_8px_0_0_#5B3FD4] hover:shadow-[0_4px_0_0_#5B3FD4] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all flex flex-col items-start justify-center pl-5 pt-6 relative overflow-hidden"
              onClick={(e) => handleReveal(e, '#7F5CFF', '#4D34B8', 'Team', '/join/myprojects')}
            >
              <img src="/img/student.png" alt="" aria-hidden="true" className="absolute right-0 bottom-0 h-[110%] w-auto object-contain opacity-90 pointer-events-none select-none translate-y-4" />
              <img src="/img/crown.PNG" alt="" aria-hidden="true" className="absolute top-4 left-[30%] h-10 w-auto object-contain opacity-70 rotate-[10deg] pointer-events-none select-none" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#4D34B8] [text-shadow:0_4px_0_rgba(91,63,212,0.5)] relative z-10">Team</h1>
              <p className="text-[#4D34B8] font-bold text-xs sm:text-sm lg:text-base not-italic tracking-normal relative z-10" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>ทีมของฉัน</p>
            </button>

          </div>

          {/* Right Section */}
          <div className="flex flex-col gap-4 h-full overflow-hidden pb-2">

            {/* My Type Button */}
             <div
              onClick={() => guardedAction(() => router.push('/mytype'))}
              className="bg-[#5B3FD4] rounded-[20px] h-48 sm:h-56 md:h-64 lg:h-80 cursor-pointer shadow-[0_8px_0_0_#4630A8] hover:shadow-[0_4px_0_0_#4630A8] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all relative flex items-center justify-center overflow-hidden"
            >
              <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-64 lg:h-64 bg-[#B3A0FF] rounded-full flex items-center justify-center z-10 flex-shrink-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white tracking-tight">MY TYPE</h1>
              </div>
              <img src="/img/b2.PNG" alt="" aria-hidden="true" className="absolute right-4 bottom-8 h-[72%] w-auto object-contain pointer-events-none select-none z-20" />
            </div>
            
            {/* Quiz + Evaluate row */}
            <div className="flex gap-4 flex-1 mt-2">
              {/* Quiz Button — square */}
              <div
                onClick={() => guardedAction(() => router.push('/templates'))}
                className="flex-1 aspect-square bg-[#FFAAAA] rounded-[20px] cursor-pointer shadow-[0_8px_0_0_#D87878] hover:shadow-[0_4px_0_0_#D87878] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all flex flex-col items-center justify-center gap-2 p-4 overflow-hidden"
              >
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black italic text-white tracking-tighter [text-shadow:0_4px_0_rgba(216,120,120,0.5)]">Quiz</h1>
                <img src="/img/quiz.png" alt="Quiz" className="h-16 sm:h-24 md:h-28 lg:h-36 w-auto object-contain drop-shadow-lg" />
              </div>

              {/* Evaluate Button — square */}
              <button
                className="flex-1 aspect-square bg-[#FFAD60] rounded-[20px] font-black italic tracking-tighter shadow-[0_8px_0_0_#E8854A] hover:shadow-[0_4px_0_0_#E8854A] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all flex flex-col items-center justify-center gap-2 p-4 relative overflow-hidden"
                onClick={(e) => handleReveal(e, '#FFAD60', '#A05A20', 'Evaluate', '/evaluation')}
              >
                <img src="/img/analyze.PNG" alt="" aria-hidden="true" className="absolute bottom-0 right-0 h-[70%] w-auto object-contain opacity-25 pointer-events-none select-none" />
                <h1 className="text-3xl sm:text-4xl lg:text-5xl text-[#A05A20] [text-shadow:0_4px_0_rgba(160,90,32,0.4)] relative z-10">Evaluate</h1>
                <p className="text-[#A05A20] font-bold text-[10px] sm:text-xs lg:text-sm not-italic tracking-normal text-center relative z-10" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>ประเมินเพื่อนร่วมทีม</p>
              </button>
            </div>

          </div>
          </div>
        </main>

        {/* ✅ Popup แจ้งเตือนแบบประเมินค้างอยู่ — ขึ้นทันทีตอนกด Create / Join / MY TYPE / Quiz โดยไม่นำทางออกจากหน้านี้ */}
        {showPendingModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] px-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                <ClipboardList size={32} />
              </div>
              <h2 className="text-xl font-black text-gray-800" style={{ textShadow: 'none' }}>มีแบบประเมินเพื่อนร่วมทีมค้างอยู่</h2>
              <p className="text-gray-500 text-sm">
                กรุณาประเมินเพื่อนร่วมทีมของกิจกรรมที่จบแล้วให้ครบ ({pendingCount} ห้อง) ก่อนสร้างหรือเข้าร่วมห้องใหม่
              </p>
              <button
                onClick={() => router.push('/evaluation')}
                className="w-full bg-[#2D3E50] text-white py-3 rounded-2xl font-bold hover:bg-slate-700 transition-all active:scale-95"
              >
                ไปทำแบบประเมิน
              </button>
              <button
                onClick={() => setShowPendingModal(false)}
                className="text-gray-400 text-xs font-semibold hover:underline"
              >
                ปิด
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default App;