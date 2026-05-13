'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './navbar/page';

const App = () => {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-[#E8E8E8] font-sans flex flex-col">
      <Navbar />

      <main className="px-4 py-4 flex justify-center">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Left Section: Create, Join, Team */}
        <div className="bg-white rounded-[24px] px-6 pt-5 pb-2 shadow-sm flex flex-col gap-6">
          {/* Create Button (Yellow) */}
          <button
            className="h-36 w-full bg-[#FFDB10] rounded-[20px] font-black italic tracking-tighter shadow-[0_8px_0_0_#C9A800] hover:shadow-[0_4px_0_0_#C9A800] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all flex flex-col items-center justify-center gap-1"
            onClick={() => router.push('/templates?mode=create')}
          >
            <h1 className="text-5xl text-[#A88200] [text-shadow:0_4px_0_rgba(201,168,0,0.5)]">Create</h1>
            <p className="text-[#A88200] font-bold text-sm not-italic tracking-normal" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>สร้างห้อง</p>
          </button>

          {/* Join Button (Blue) */}
          <button
            className="h-36 w-full bg-[#74D1FF] rounded-[20px] font-black italic tracking-tighter shadow-[0_8px_0_0_#3A9EC7] hover:shadow-[0_4px_0_0_#3A9EC7] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all flex flex-col items-center justify-center gap-1"
            onClick={() => router.push('/join/roomid')}
          >
            <h1 className="text-5xl text-[#2D85A0] [text-shadow:0_4px_0_rgba(58,158,199,0.5)]">Join</h1>
            <p className="text-[#2D85A0] font-bold text-sm not-italic tracking-normal" style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}>เข้าร่วมด้วยรหัส</p>
          </button>

          {/* Team Button (Purple) */}
          <button
            className="h-36 w-full bg-[#7F5CFF] rounded-[20px] font-black italic tracking-tighter shadow-[0_8px_0_0_#5B3FD4] hover:shadow-[0_4px_0_0_#5B3FD4] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all flex flex-col items-center justify-center gap-1"
            onClick={() => router.push('/join/myprojects')}
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
            {/* วงกลมสีเขียวมิ้นกลาง */}
            <div className="w-52 h-52 bg-[#7ECECA] rounded-full flex items-center justify-center z-10">
              <h1 className="text-4xl text-[#2B6B6B] tracking-tight">MY TYPE</h1>
            </div>
            {/* Brain - บนซ้าย ใหญ่ เอียงซ้าย */}
            <img src="/img/brain.png" alt="brain" className="absolute top-4 left-10 w-28 h-28 object-contain z-20 -rotate-[30deg]" />
            {/* Idea - บนขวา ใหญ่ เอียงขวา */}
            <img src="/img/idea.png" alt="idea" className="absolute top-8 right-14 w-20 h-20 object-contain z-20 rotate-[30deg]" />
            {/* Pencil - ล่างซ้าย กลาง เอียงขวา */}
            <img src="/img/pencil.png" alt="pencil" className="absolute bottom-4 left-28 w-14 h-14 object-contain z-20 rotate-[20deg]" />
            {/* Gear - ล่างขวา เล็ก */}
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
  );
};

export default App;