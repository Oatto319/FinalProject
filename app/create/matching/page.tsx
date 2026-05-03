'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '../../navbar/page';

const MatchingPage = () => {
  const router = useRouter();

  useEffect(() => {
    const runMatchAndRedirect = async () => {
      const roomRaw = localStorage.getItem('currentRoom');
      if (!roomRaw) { router.push('/create/group'); return; }
      const localRoom = JSON.parse(roomRaw);
      const roomId = localRoom.roomId ?? localRoom.id;

      // โหลดข้อมูล room จาก MongoDB
      const roomRes = await fetch(`/api/rooms/${roomId}`);
      const roomData = await roomRes.json();
      if (!roomData.room) { router.push('/create/group'); return; }
      const room = roomData.room;

      const members: { name: string; avatarSeed: number; gmail: string }[] = room.members ?? [];

      const pendingRaw = localStorage.getItem('pendingRoom');
      const pending = pendingRaw ? JSON.parse(pendingRaw) : {};
      const matchMode: string = pending.matchMode ?? 'auto';
      const typeComposition: Record<string, number> = pending.typeComposition ?? {};

      const template = (room.template ?? 'programming').toLowerCase();

      // ดึง MBTI type ของแต่ละ member จาก MongoDB
      const memberTypeMap: Record<string, string> = {};
      await Promise.all(
        members.map(async (m) => {
          try {
            // ถ้าไม่มี gmail ให้ fallback ค้นหาด้วย name แทน
            const url = m.gmail
              ? `/api/users?gmail=${encodeURIComponent(m.gmail)}`
              : `/api/users?name=${encodeURIComponent(m.name)}`;
            const res = await fetch(url);
            const data = await res.json();
            const types: Record<string, { title?: string; typeScores?: { title: string; score: number }[] }> = data.user?.types ?? {};
            let typeTitle = types[template]?.title;
            if (!typeTitle) {
              const fallback = Object.values(types).find((t) => t?.title);
              typeTitle = fallback?.title;
            }
            if (typeTitle) memberTypeMap[m.name] = typeTitle;
          } catch { /* ไม่มี type */ }
        })
      );

      const getMemberTypeLocal = (memberName: string): string =>
        memberTypeMap[memberName] ?? 'ไม่ระบุ';

      const groupSize: number = room.groupSize ?? 4;
      const numGroups = Math.max(1, Math.ceil(members.length / groupSize));
      const groups: { id: number; name: string; members: (typeof members[0] & { role: string })[] }[] =
        Array.from({ length: numGroups }, (_, i) => ({ id: i + 1, name: `ทีม ${i + 1}`, members: [] }));

      if (matchMode === 'auto') {
        const byType: Record<string, (typeof members[0] & { role: string })[]> = {};
        members.forEach((m) => {
          const t = getMemberTypeLocal(m.name);
          if (!byType[t]) byType[t] = [];
          byType[t].push({ ...m, role: t });
        });
        const typeArrays = Object.values(byType);
        const interleaved: (typeof members[0] & { role: string })[] = [];
        const maxLen = Math.max(...typeArrays.map((a) => a.length), 0);
        for (let i = 0; i < maxLen; i++) typeArrays.forEach((arr) => { if (arr[i]) interleaved.push(arr[i]); });
        interleaved.forEach((m, idx) => { groups[idx % numGroups].members.push(m); });
      } else {
        const byType: Record<string, (typeof members[0] & { role: string })[]> = {};
        members.forEach((m) => {
          const t = getMemberTypeLocal(m.name);
          if (!byType[t]) byType[t] = [];
          byType[t].push({ ...m, role: t });
        });
        for (let g = 0; g < numGroups; g++) {
          Object.entries(typeComposition).forEach(([typeKey, count]) => {
            const pool = byType[typeKey] ?? [];
            for (let c = 0; c < count && pool.length > 0; c++) groups[g].members.push(pool.shift()!);
          });
        }
        const assigned = new Set(groups.flatMap((g) => g.members.map((m) => m.name)));
        members.filter((m) => !assigned.has(m.name)).forEach((m) => {
          const smallest = groups.reduce((a, b) => a.members.length <= b.members.length ? a : b);
          smallest.members.push({ ...m, role: getMemberTypeLocal(m.name) });
        });
      }

      // บันทึกผลลัพธ์ไปยัง MongoDB
      await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchedGroups: groups, matchDone: true }),
      });

      router.push('/create/group');
    };

    const timer = setTimeout(runMatchAndRedirect, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#1A2E44] flex flex-col items-center font-sans overflow-hidden">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center relative w-full px-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-[280px] h-[280px] rounded-full border border-white/5 animate-pulse"></div>
          <div className="absolute w-[340px] h-[340px] rounded-full border border-white/10 animate-ping [animation-duration:3s]"></div>
          <div className="absolute w-[400px] h-[400px] rounded-full border border-white/[0.03]"></div>
          <div className="relative w-64 h-64 rounded-full bg-gradient-to-b from-[#2A435D] to-[#162536] flex items-center justify-center shadow-2xl border border-white/10">
            <div className="absolute inset-4 rounded-full bg-[#1A2E44] opacity-50 shadow-inner"></div>
            <h1 className="relative text-white text-6xl font-black tracking-tighter drop-shadow-lg animate-pulse">Matching</h1>
          </div>
        </div>
        <div className="mt-16 text-center">
          <p className="text-gray-400 font-medium tracking-wide animate-bounce">Please wait a moment</p>
          <div className="flex gap-1 justify-center mt-2">
            <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  );
};

export default MatchingPage;
