'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Lightbulb, Settings, Pencil, Plus, Minus } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      <Navbar />

      {/* Main Content Grid - เพิ่ม mt-8 เพื่อเลื่อนระยะลงมาจาก App Bar */}
      <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 px-4 pb-8">

        {/* Left Section: Create, Join, Team (Keeping Original Design) */}
        <div className="bg-white rounded-[40px] p-6 shadow-sm flex flex-col gap-4 min-h-[500px]">
          {/* Create Button (Yellow) */}
          <div
            className="relative bg-yellow-400 flex-1 rounded-[30px] flex flex-col items-center justify-center cursor-pointer hover:brightness-95 transition-all"
            onClick={() => router.push('/templates?mode=create')}
          >
            <h1 className="text-5xl font-black text-emerald-900 italic tracking-tighter">Create</h1>
            <p className="text-emerald-800 font-bold text-xl mt-1">สร้างห้อง</p>
          </div>

          {/* Join Button (Blue) */}
          <div
            className="relative bg-sky-400 flex-1 rounded-[30px] flex flex-col items-center justify-center cursor-pointer hover:brightness-95 transition-all"
            onClick={() => router.push('/join/roomid')}
          >
            <h1 className="text-5xl font-black text-orange-600 italic tracking-tighter">Join</h1>
            <p className="text-orange-700 font-bold text-xl mt-1">เข้าร่วมด้วยรหัส</p>
          </div>

          {/* Team Button (Purple) */}
          <div
            onClick={() => router.push('/join/myprojects')}
            className="relative bg-indigo-500 flex-1 rounded-[30px] flex flex-col items-center justify-center cursor-pointer hover:brightness-95 transition-all">
            <h1 className="text-5xl font-black text-white italic tracking-tighter">Team</h1>
            <p className="text-indigo-100 font-bold text-xl mt-1">ทีมของฉัน</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col gap-4">

          {/* My Type Card (Keeping Original Design) */}
          <div className="bg-white rounded-[40px] p-8 shadow-sm relative h-[240px] flex items-center justify-center overflow-hidden">
            {/* Decorative Icons */}
            <div className="absolute top-6 left-6 w-14 h-14 bg-indigo-900 rounded-full flex items-center justify-center text-pink-500">
              <Brain size={32} fill="currentColor" />
            </div>
            <div className="absolute top-10 right-6 w-12 h-12 bg-indigo-900 rounded-full flex items-center justify-center text-yellow-400">
              <Lightbulb size={28} fill="currentColor" />
            </div>
            <div className="absolute bottom-8 left-16 w-10 h-10 bg-rose-400 rounded-full flex items-center justify-center text-white">
              <Pencil size={20} />
            </div>
            <div className="absolute bottom-12 right-12 w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white border-2 border-white">
              <Settings size={16} />
            </div>

            {/* Central Circle */}
            <div
              onClick={() => router.push('/mytype')}
              className="w-44 h-44 bg-teal-200 rounded-full flex items-center justify-center shadow-inner border-4 border-white z-10 cursor-pointer hover:bg-teal-300 transition-colors"
            >
              <h2 className="text-3xl font-black text-indigo-900 tracking-tighter">MY TYPE</h2>
            </div>
          </div>

          {/* Adjustments Section (Matched with Image style) */}
          <div className="bg-white rounded-[40px] p-8 shadow-sm flex flex-col justify-center gap-6 flex-grow min-h-[244px]">
            {/* Red Row */}
            <div className="flex items-center gap-4">
              <div className="flex-grow bg-rose-300 h-16 rounded-2xl"></div>
              <div
                onClick={() => router.push('/templates')}
                className="w-16 h-16 bg-green-100 border-4 border-green-200 rounded-full flex items-center justify-center text-green-500 cursor-pointer hover:bg-green-200 transition-colors">
                <Plus size={32} strokeWidth={4} />
              </div>
            </div>

            {/* Green Row */}
            <div className="flex items-center gap-4">
              <div className="flex-grow bg-teal-300 h-16 rounded-2xl"></div>
              <div className="w-16 h-16 bg-rose-100 border-4 border-rose-200 rounded-full flex items-center justify-center text-rose-400 cursor-pointer hover:bg-rose-200 transition-colors">
                <Minus size={32} strokeWidth={4} />
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
};

export default App;