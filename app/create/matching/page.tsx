'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const MatchingPage = () => {
  const router = useRouter();
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    const runMatchAndRedirect = async () => {
      try {
        const roomRaw = localStorage.getItem('currentRoom');
        if (!roomRaw) { router.push('/create/group'); return; }
        const localRoom = JSON.parse(roomRaw);
        const roomId = localRoom.roomId ?? localRoom.id;

        // การจับกลุ่มจริงคำนวณฝั่ง server ทั้งหมด (อ่าน matchMode/typeComposition/สมาชิก/ผล MBTI จาก DB เอง)
        // client แค่สั่งให้เริ่มจับกลุ่มเท่านั้น
        const matchPayload = JSON.stringify({ action: 'match' });
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

        if (!saveRes.ok) { setSaveError(true); return; }
        router.push('/create/group');
      } catch {
        setSaveError(true);
      }
    };

    const timer = setTimeout(() => { runMatchAndRedirect(); }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#1A2E44] flex flex-col items-center justify-center font-sans overflow-hidden relative">

      {/* Background glows */}
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[10%] right-[-5%] w-[35%] h-[35%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Text */}
      <h1 className="text-white text-4xl sm:text-5xl font-black tracking-tighter mb-8 sm:mb-12">Matching</h1>

      {saveError ? (
        <>
          <p className="text-red-300 text-sm font-bold mb-6">บันทึกผลการจับกลุ่มไม่สำเร็จ กรุณาลองใหม่</p>
          <button
            onClick={() => router.back()}
            className="bg-white text-[#1A2E44] px-8 py-3 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
          >
            กลับไปลองใหม่
          </button>
        </>
      ) : (
        <>
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
        </>
      )}

    </div>
  );
};

export default MatchingPage;
