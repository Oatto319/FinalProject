'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../navbar/page';

const MatchingPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatarSeed: number } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  useEffect(() => {
    const runMatchAndRedirect = () => {
      const roomRaw = localStorage.getItem('currentRoom');
      if (!roomRaw) { router.push('/create/group'); return; }
      const room = JSON.parse(roomRaw);

      // Load latest members
      const roomsRaw = localStorage.getItem('rooms');
      const rooms = roomsRaw ? JSON.parse(roomsRaw) : {};
      const latestRoom = rooms[room.id] ?? room;
      const members: { name: string; avatarSeed: number; gmail: string }[] = latestRoom.members ?? [];

      // Load match settings
      const pendingRaw = localStorage.getItem('pendingRoom');
      const pending = pendingRaw ? JSON.parse(pendingRaw) : {};
      const matchMode: string = pending.matchMode ?? 'auto';
      const typeComposition: Record<string, number> = pending.typeComposition ?? {};

      // Load users for MBTI lookup
      const usersRaw = localStorage.getItem('users');
      const allUsers: { name: string; types?: Record<string, { typeScores: { title: string; score: number }[] }> }[] = usersRaw ? JSON.parse(usersRaw) : [];
      const template = (room.template ?? 'programming').toLowerCase();

      const getMemberType = (memberName: string): string => {
        const u = allUsers.find((u) => u.name === memberName);
        if (!u?.types?.[template]?.typeScores?.length) return 'ไม่ระบุ';
        return u.types[template].typeScores.reduce((a, b) => a.score >= b.score ? a : b).title;
      };

      const groupSize: number = room.groupSize ?? 4;
      const numGroups = Math.max(1, Math.ceil(members.length / groupSize));
      const groups: { id: number; name: string; members: (typeof members[0] & { role: string })[] }[] =
        Array.from({ length: numGroups }, (_, i) => ({ id: i + 1, name: `ทีม ${i + 1}`, members: [] }));

      if (matchMode === 'auto') {
        // Interleave by type for balanced distribution
        const byType: Record<string, (typeof members[0] & { role: string })[]> = {};
        members.forEach((m) => {
          const t = getMemberType(m.name);
          if (!byType[t]) byType[t] = [];
          byType[t].push({ ...m, role: t });
        });
        const typeArrays = Object.values(byType);
        const interleaved: (typeof members[0] & { role: string })[] = [];
        const maxLen = Math.max(...typeArrays.map((a) => a.length), 0);
        for (let i = 0; i < maxLen; i++) {
          typeArrays.forEach((arr) => { if (arr[i]) interleaved.push(arr[i]); });
        }
        interleaved.forEach((m, idx) => { groups[idx % numGroups].members.push(m); });

      } else {
        // Selection mode: fill each group by typeComposition slots
        const byType: Record<string, (typeof members[0] & { role: string })[]> = {};
        members.forEach((m) => {
          const t = getMemberType(m.name);
          if (!byType[t]) byType[t] = [];
          byType[t].push({ ...m, role: t });
        });
        for (let g = 0; g < numGroups; g++) {
          Object.entries(typeComposition).forEach(([typeKey, count]) => {
            const pool = byType[typeKey] ?? [];
            for (let c = 0; c < count && pool.length > 0; c++) {
              groups[g].members.push(pool.shift()!);
            }
          });
        }
        // Assign remaining (unmatched type) members
        const assigned = new Set(groups.flatMap((g) => g.members.map((m) => m.name)));
        members.filter((m) => !assigned.has(m.name)).forEach((m) => {
          const smallest = groups.reduce((a, b) => a.members.length <= b.members.length ? a : b);
          smallest.members.push({ ...m, role: getMemberType(m.name) });
        });
      }

      localStorage.setItem(`matchedGroups_${room.id}`, JSON.stringify(groups));
      localStorage.setItem(`matchDone_${room.id}`, 'true');
      router.push('/create/group');
    };

    const timer = setTimeout(runMatchAndRedirect, 3000);
    return () => clearTimeout(timer);
  }, [router]);
  return (
    <div className="min-h-screen bg-[#1A2E44] flex flex-col items-center font-sans overflow-hidden">
      <Navbar />

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