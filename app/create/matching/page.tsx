'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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

      // ดึง MBTI type + typeScores ของแต่ละ member จาก MongoDB
      const memberTypeMap: Record<string, string> = {};
      const memberScoreMap: Record<string, Record<string, number>> = {};
      await Promise.all(
        members.map(async (m) => {
          try {
            const url = m.gmail
              ? `/api/users?gmail=${encodeURIComponent(m.gmail)}`
              : `/api/users?name=${encodeURIComponent(m.name)}`;
            const res = await fetch(url);
            const data = await res.json();
            const types: Record<string, { title?: string; typeScores?: { title: string; score: number }[] }> = data.user?.types ?? {};
            let typeData: { title?: string; typeScores?: { title: string; score: number }[] } | undefined = types[template];
            if (!typeData) typeData = Object.values(types).find((t) => t?.title);
            if (typeData?.title) memberTypeMap[m.name] = typeData.title;
            // เก็บ typeScores สำหรับ secondary matching
            const scores: Record<string, number> = {};
            (typeData?.typeScores ?? []).forEach((ts) => { scores[ts.title] = ts.score; });
            memberScoreMap[m.name] = scores;
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
        // ── Manual / selection mode ──────────────────────────────────────

        // หา member ในกลุ่ม unassigned ที่มี secondary score สูงสุดสำหรับ typeKey
        const findBestSecondary = (
          pool: (typeof members[0] & { role: string })[],
          typeKey: string
        ): number => {
          let bestIdx = -1, bestScore = -Infinity;
          pool.forEach((m, i) => {
            const score = memberScoreMap[m.name]?.[typeKey] ?? 0;
            if (score > bestScore) { bestScore = score; bestIdx = i; }
          });
          return bestIdx;
        };

        const hasComposition = Object.values(typeComposition).some((v) => v > 0);

        if (hasComposition) {
          // pool ที่ยังไม่ถูก assign
          const unassigned: (typeof members[0] & { role: string })[] =
            members.map((m) => ({ ...m, role: getMemberTypeLocal(m.name) }));

          for (let g = 0; g < numGroups; g++) {
            for (const [typeKey, count] of Object.entries(typeComposition)) {
              if (!count) continue;
              for (let c = 0; c < count && unassigned.length > 0; c++) {
                // Phase 1: หา member ที่มี primary type ตรงกับ typeKey
                let idx = unassigned.findIndex((m) => getMemberTypeLocal(m.name) === typeKey);
                // Phase 2: ถ้าไม่มี primary → หาคนที่มี secondary score สูงสุดสำหรับ typeKey
                if (idx === -1) idx = findBestSecondary(unassigned, typeKey);
                if (idx === -1) break;
                const [member] = unassigned.splice(idx, 1);
                // กำหนด role ตาม slot ที่ถูก assign (ไม่ใช่ primary type เดิม)
                groups[g].members.push({ ...member, role: typeKey });
              }
            }
          }

          // member ที่เหลือ → กลุ่มที่เล็กที่สุด (ใช้ primary type เดิม)
          for (const m of unassigned) {
            const smallest = groups.reduce((a, b) => (a.members.length <= b.members.length ? a : b));
            smallest.members.push(m);
          }
        } else {
          // ไม่ได้ตั้ง composition → interleave ตาม type
          const byType: Record<string, (typeof members[0] & { role: string })[]> = {};
          for (const m of members) {
            const t = getMemberTypeLocal(m.name);
            if (!byType[t]) byType[t] = [];
            byType[t].push({ ...m, role: t });
          }
          const typeArrays = Object.values(byType);
          const interleaved: (typeof members[0] & { role: string })[] = [];
          const maxLen = Math.max(...typeArrays.map((a) => a.length), 0);
          for (let i = 0; i < maxLen; i++) typeArrays.forEach((arr) => { if (arr[i]) interleaved.push(arr[i]); });
          interleaved.forEach((m, idx) => { groups[idx % numGroups].members.push(m); });
        }
      }

      // บันทึกผลลัพธ์ไปยัง MongoDB
      const matchPayload = JSON.stringify({ matchedGroups: groups, matchDone: true, matchMode: pending.matchMode ?? 'auto' });
      let saveRes = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: matchPayload,
      });
      // retry ครั้งเดียวถ้าล้มเหลว
      if (!saveRes.ok) {
        saveRes = await fetch(`/api/rooms/${roomId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: matchPayload,
        });
      }

      router.push('/create/group');
    };

    const timer = setTimeout(runMatchAndRedirect, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#1A2E44] flex flex-col items-center justify-center font-sans overflow-hidden relative">

      {/* Background glows */}
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[10%] right-[-5%] w-[35%] h-[35%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Text */}
      <h1 className="text-white text-5xl font-black tracking-tighter mb-12">Matching</h1>

      {/* Bouncing dots */}
      <div className="flex gap-4 justify-center mb-8">
        {[0, 0.15, 0.3, 0.45, 0.6].map((delay, i) => (
          <div key={i}
            className="w-4 h-4 rounded-full bg-blue-400/80 animate-bounce"
            style={{ animationDelay: `${delay}s` }}
          ></div>
        ))}
      </div>

      <p className="text-gray-400 text-sm font-medium tracking-widest">กำลังจัดกลุ่ม กรุณารอสักครู่</p>

    </div>
  );
};

export default MatchingPage;
