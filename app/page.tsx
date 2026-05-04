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
    <div className="h-screen bg-gray-300 font-sans flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 min-h-0 px-4 py-4 flex justify-center">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 h-full">

        {/* Left Section: Create, Join, Team */}
        <div className="bg-white rounded-[24px] px-6 py-10 shadow-sm flex flex-col gap-6">
          {/* Create Button (Yellow) */}
          <button
            className="flex-1 w-full bg-yellow-400 rounded-[20px] font-black italic tracking-tighter shadow-[0_8px_0_0_#A16207] hover:shadow-[0_4px_0_0_#A16207] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all flex flex-col items-center justify-center gap-1"
            onClick={() => router.push('/templates?mode=create')}
          >
            <h1 className="text-5xl text-emerald-900">Create</h1>
            <p className="text-emerald-800 font-bold text-xl not-italic tracking-normal">สร้างห้อง</p>
          </button>

          {/* Join Button (Blue) */}
          <button
            className="flex-1 w-full bg-sky-400 rounded-[20px] font-black italic tracking-tighter shadow-[0_8px_0_0_#0369A1] hover:shadow-[0_4px_0_0_#0369A1] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all flex flex-col items-center justify-center gap-1"
            onClick={() => router.push('/join/roomid')}
          >
            <h1 className="text-5xl text-orange-600">Join</h1>
            <p className="text-orange-700 font-bold text-xl not-italic tracking-normal">เข้าร่วมด้วยรหัส</p>
          </button>

          {/* Team Button (Purple) */}
          <button
            className="flex-1 w-full bg-indigo-500 rounded-[20px] font-black italic tracking-tighter shadow-[0_8px_0_0_#3730A3] hover:shadow-[0_4px_0_0_#3730A3] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all flex flex-col items-center justify-center gap-1"
            onClick={() => router.push('/join/myprojects')}
          >
            <h1 className="text-5xl text-white">Team</h1>
            <p className="text-indigo-100 font-bold text-xl not-italic tracking-normal">ทีมของฉัน</p>
          </button>
        </div>

        {/* Right Section */}
        <div className="flex flex-col gap-4 h-full">

          {/* My Type Card (Keeping Original Design) */}
          <div
            onClick={() => router.push('/mytype')}
            className="bg-white rounded-[24px] p-8 shadow-sm relative flex-1 flex items-center justify-center overflow-hidden cursor-pointer hover:brightness-95 transition-all"
          >
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
            <div className="w-44 h-44 bg-teal-200 rounded-full flex items-center justify-center shadow-inner border-4 border-white z-10">
              <h2 className="text-3xl font-black text-indigo-900 tracking-tighter">MY TYPE</h2>
            </div>
          </div>

          {/* Adjustments Section (Matched with Image style) */}
          <div
            onClick={() => router.push('/templates')}
            className="bg-white rounded-[24px] p-8 shadow-sm flex flex-col justify-center gap-6 flex-1 cursor-pointer hover:brightness-95 transition-all"
          >
            {/* Red Row */}
            <div className="flex items-center gap-4">
              <div className="flex-grow bg-rose-300 h-16 rounded-2xl"></div>
              <div className="w-16 h-16 bg-green-100 border-4 border-green-200 rounded-full flex items-center justify-center text-green-500">
                <Plus size={32} strokeWidth={4} />
              </div>
            </div>

            {/* Green Row */}
            <div className="flex items-center gap-4">
              <div className="flex-grow bg-teal-300 h-16 rounded-2xl"></div>
              <div className="w-16 h-16 bg-rose-100 border-4 border-rose-200 rounded-full flex items-center justify-center text-rose-400">
                <Minus size={32} strokeWidth={4} />
              </div>
            </div>
          </div>

        </div>
        </div>
      </main>

    </div>
  );
};

export default App;