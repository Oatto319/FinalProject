'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const MatchingPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatarSeed: number } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Set matchDone flag so students can access /join/myteam
      const roomRaw = localStorage.getItem('currentRoom');
      if (roomRaw) {
        const room = JSON.parse(roomRaw);
        localStorage.setItem(`matchDone_${room.id}`, 'true');
      }
      router.push('/create/group');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="min-h-screen bg-[#1A2E44] flex flex-col items-center font-sans overflow-hidden">
      {/* ส่วนแถบโปรไฟล์ด้านบนสุด (Top Bar) */}
      <div className="w-full bg-[#1A2E44]/80 backdrop-blur-md p-4 flex items-center justify-start border-b border-white/5">
        <div className="max-w-7xl mx-auto w-full flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-sm">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.avatarSeed ?? 0}`}
              alt="Profile"
              className="w-full h-full bg-sky-300"
            />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm leading-none">{user?.name ?? '...'}</h3>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">อาจารย์</p>
          </div>
        </div>
      </div>

      {/* เนื้อหาหลัก: วงกลม Matching (Main Matching Animation) */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full px-4">
        <div className="relative flex items-center justify-center">
          {/* เอฟเฟกต์วงกลมซ้อน (Ripple Circles) */}
          <div className="absolute w-[280px] h-[280px] rounded-full border border-white/5 animate-pulse"></div>
          <div className="absolute w-[340px] h-[340px] rounded-full border border-white/10 animate-ping [animation-duration:3s]"></div>
          <div className="absolute w-[400px] h-[400px] rounded-full border border-white/[0.03]"></div>
          
          {/* วงกลมหลักตรงกลาง */}
          <div className="relative w-64 h-64 rounded-full bg-gradient-to-b from-[#2A435D] to-[#162536] flex items-center justify-center shadow-2xl border border-white/10">
            {/* วงกลมเงาด้านใน */}
            <div className="absolute inset-4 rounded-full bg-[#1A2E44] opacity-50 shadow-inner"></div>
            
            {/* ตัวอักษร Matching */}
            <h1 className="relative text-white text-6xl font-black tracking-tighter drop-shadow-lg animate-pulse">
              Matching
            </h1>
          </div>
        </div>

        {/* ข้อความสถานะด้านล่าง */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 font-medium tracking-wide animate-bounce">
            Please wait a moment
          </p>
          {/* จุดโหลดดิ้งแบบจุดไข่ปลา */}
          <div className="flex gap-1 justify-center mt-2">
            <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
        </div>
      </div>

      {/* ตกแต่งพื้นหลังด้วยแสงฟุ้ง (Background Glow) */}
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  );
};

export default MatchingPage;