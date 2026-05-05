'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ArrowRightCircle } from 'lucide-react';
import Navbar from '../../navbar/page';

export default function EnterRoomIdPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
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
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      <Navbar />
      <main className="w-full max-w-5xl mt-4 px-4 pb-12">
        <div className="bg-white rounded-[24px] p-8 md:p-12 shadow-sm flex flex-col items-center min-h-[600px] relative">
          <div className="w-full flex justify-center -mt-20 mb-6 relative z-10">
            <img src="/img/team.png" alt="Team Illustration" className="w-full max-w-[400px] h-auto object-contain drop-shadow-xl"
              onError={(e) => { e.currentTarget.src = 'https://img.freepik.com/free-vector/team-holding-jigsaw-puzzle-pieces_74855-6962.jpg'; }} />
          </div>
          <div className="w-full max-w-[500px] bg-[#2D3E50] rounded-[20px] p-8 flex flex-col items-center gap-4 shadow-lg mb-8">
            <label className="text-white text-xl font-bold italic">&quot;Enter the room ID&quot;</label>
            <input type="text" placeholder="เช่น 1234567" value={roomId}
              onChange={(e) => { setRoomId(e.target.value.replace(/\D/g, '')); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              className="w-full bg-white rounded-xl py-4 px-6 text-[#2D3E50] font-bold text-2xl text-center focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all tracking-[0.2em]" />
            {error && <p className="text-red-300 text-sm font-bold">{error}</p>}
          </div>
          <div className="w-full max-w-[500px] flex justify-between items-center">
            <button className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-300 transition-all active:scale-90" onClick={() => router.back()}>
              <ChevronLeft size={32} strokeWidth={2.5} />
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
  );
}
