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
  { top: '6%',  left: '4%',  fontSize: '7rem',  rotate: '-18deg', opacity: 0.18 },
  { top: '3%',  left: '55%', fontSize: '3.5rem', rotate: '12deg',  opacity: 0.14 },
  { top: '8%',  left: '78%', fontSize: '5.5rem', rotate: '-8deg',  opacity: 0.20 },
  { top: '28%', left: '2%',  fontSize: '3rem',   rotate: '22deg',  opacity: 0.13 },
  { top: '32%', left: '60%', fontSize: '8rem',   rotate: '-14deg', opacity: 0.16 },
  { top: '48%', left: '18%', fontSize: '5rem',   rotate: '10deg',  opacity: 0.18 },
  { top: '52%', left: '75%', fontSize: '3.5rem', rotate: '-20deg', opacity: 0.14 },
  { top: '65%', left: '5%',  fontSize: '6rem',   rotate: '16deg',  opacity: 0.20 },
  { top: '68%', left: '48%', fontSize: '4rem',   rotate: '-6deg',  opacity: 0.15 },
  { top: '80%', left: '22%', fontSize: '9rem',   rotate: '-12deg', opacity: 0.17 },
  { top: '82%', left: '72%', fontSize: '4.5rem', rotate: '18deg',  opacity: 0.13 },
  { top: '90%', left: '50%', fontSize: '3rem',   rotate: '-25deg', opacity: 0.15 },
];

const App = () => {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [reveal, setReveal] = useState<RevealState | null>(null);
  const [pendingEvalRooms, setPendingEvalRooms] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    fetch('/api/evaluations')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setPendingEvalRooms((data.pending ?? []).length); })
      .catch(() => {});
  }, [ready]);

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
      `}</style>

      <div className="min-h-screen bg-[#E8E8E8] font-sans flex flex-col">
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

        <Navbar />

        <main className="px-4 py-4 flex justify-center">
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Left Section: Create, Join, Team */}
          <div className="bg-white rounded-[24px] px-6 pt-5 pb-2 shadow-sm flex flex-col gap-6">
            {/* Create Button (Yellow) */}
            <button
              className="h-36 w-full bg-[#FFDB10] rounded-[20px] font-black italic tracking-tighter shadow-[0_8px_0_0_#C9A800] hover:shadow-[0_4px_0_0_#C9A800] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all flex flex-col items-center justify-center gap-1"
              onClick={(e) => handleReveal(e, '#FFDB10', '#A88200', 'Create', '/templates?mode=create')}
            >
              <h1 className="text-5xl text-[#A88200] [text-shadow:0_4px_0_rgba(201,168,0,0.5)]">Create</h1>
              <p className="text-[#A88200] font-bold text-sm not-italic tracking-normal" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>สร้างห้อง</p>
            </button>

            {/* Join Button (Blue) */}
            <button
              className="h-36 w-full bg-[#74D1FF] rounded-[20px] font-black italic tracking-tighter shadow-[0_8px_0_0_#3A9EC7] hover:shadow-[0_4px_0_0_#3A9EC7] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all flex flex-col items-center justify-center gap-1"
              onClick={(e) => handleReveal(e, '#74D1FF', '#2D85A0', 'Join', '/join/roomid')}
            >
              <h1 className="text-5xl text-[#2D85A0] [text-shadow:0_4px_0_rgba(58,158,199,0.5)]">Join</h1>
              <p className="text-[#2D85A0] font-bold text-sm not-italic tracking-normal" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>เข้าร่วมด้วยรหัส</p>
            </button>

            {/* Team Button (Purple) */}
            <button
              className="h-36 w-full bg-[#7F5CFF] rounded-[20px] font-black italic tracking-tighter shadow-[0_8px_0_0_#5B3FD4] hover:shadow-[0_4px_0_0_#5B3FD4] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all flex flex-col items-center justify-center gap-1"
              onClick={(e) => handleReveal(e, '#7F5CFF', '#4D34B8', 'Team', '/join/myprojects')}
            >
              <h1 className="text-5xl text-[#4D34B8] [text-shadow:0_4px_0_rgba(91,63,212,0.5)]">Team</h1>
              <p className="text-[#4D34B8] font-bold text-sm not-italic tracking-normal" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>ทีมของฉัน</p>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex flex-col gap-4 h-full overflow-hidden pb-2">

            {/* My Type Button */}
            <div
              onClick={() => router.push('/mytype')}
              className="bg-white rounded-[20px] h-64 cursor-pointer shadow-[0_8px_0_0_#d1d5db] hover:shadow-[0_4px_0_0_#d1d5db] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all relative flex items-center justify-center overflow-hidden"
            >
              <div className="w-52 h-52 bg-[#7ECECA] rounded-full flex items-center justify-center z-10">
                <h1 className="text-4xl text-[#2B6B6B] tracking-tight">MY TYPE</h1>
              </div>
              <img src="/img/brain.png" alt="brain" className="absolute top-4 left-10 w-28 h-28 object-contain z-20 -rotate-[30deg]" />
              <img src="/img/idea.png" alt="idea" className="absolute top-8 right-14 w-20 h-20 object-contain z-20 rotate-[30deg]" />
              <img src="/img/pencil.png" alt="pencil" className="absolute bottom-4 left-28 w-14 h-14 object-contain z-20 rotate-[20deg]" />
              <img src="/img/make.png" alt="make" className="absolute bottom-6 right-32 w-10 h-10 object-contain z-20 -rotate-6" />
            </div>

            {/* Quiz Button */}
            <div
              onClick={() => router.push('/templates')}
              className="bg-[#FFAAAA] rounded-[20px] flex-1 cursor-pointer shadow-[0_8px_0_0_#D87878] hover:shadow-[0_4px_0_0_#D87878] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all flex items-center justify-center gap-6 p-8"
            >
              <h1 className="text-5xl font-black italic text-white tracking-tighter [text-shadow:0_4px_0_rgba(216,120,120,0.5)]">Quiz</h1>
              <img src="/img/quiz.png" alt="Quiz" className="h-48 w-auto object-contain drop-shadow-lg" />
            </div>

          </div>
          </div>
        </main>

      </div>

      {pendingEvalRooms > 0 && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] px-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
              <ClipboardList size={32} />
            </div>
            <h2 className="text-xl font-black text-gray-800">มีแบบประเมินเพื่อนร่วมทีมค้างอยู่</h2>
            <p className="text-gray-500 text-sm">
              กรุณาประเมินเพื่อนร่วมทีมของกิจกรรมที่จบแล้วให้ครบ ({pendingEvalRooms} ห้อง) ก่อนสร้างหรือเข้าร่วมห้องใหม่
            </p>
            <button
              onClick={() => router.push('/evaluation')}
              className="w-full bg-[#2D3E50] text-white py-3 rounded-2xl font-bold hover:bg-slate-700 transition-all active:scale-95"
            >
              ไปทำแบบประเมิน
            </button>
            <button
              onClick={() => router.push('/join/myprojects')}
              className="text-gray-400 text-xs font-semibold hover:underline"
            >
              ดูทีมที่จับกลุ่มแล้ว
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
