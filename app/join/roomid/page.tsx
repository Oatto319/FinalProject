'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LucideMessageCircle, ChevronLeft, ArrowRightCircle } from 'lucide-react';

export default function EnterRoomIdPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      {/* Header Section - สไตล์เดิม ชนขอบจอสุด */}
      <header className="w-full flex items-center justify-between bg-white p-6 shadow-sm">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-orange-100 border-2 border-orange-200">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Wimolchai" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-bold text-2xl text-gray-800 leading-tight">Wimolchai</h2>
              <p className="text-sm text-gray-500 font-medium">นักเรียน</p>
            </div>
          </div>
          <button className="bg-green-500 p-4 rounded-full text-white shadow-lg hover:scale-105 transition-transform active:scale-95">
            <LucideMessageCircle fill="currentColor" size={32} />
          </button>
        </div>
      </header>

      {/* Main Content - mt-8 ตามที่ต้องการ */}
      <main className="w-full max-w-5xl mt-8 px-4 pb-12">
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm flex flex-col items-center min-h-[600px] relative">
          
          {/* Illustration Section - ปรับให้ใหญ่ขึ้นเป็น max-w-[400px] และขยับขึ้นด้วย -mt-20 */}
          <div className="w-full flex justify-center -mt-20 mb-6 relative z-10">
            <img 
              src="/img/team.png" 
              alt="Team Illustration" 
              className="w-full max-w-[400px] h-auto object-contain drop-shadow-xl"
              onError={(e) => {
                e.currentTarget.src = "https://img.freepik.com/free-vector/team-holding-jigsaw-puzzle-pieces_74855-6962.jpg";
              }}
            />
          </div>

          {/* Room ID Input Box */}
          <div className="w-full max-w-[500px] bg-[#2D3E50] rounded-[30px] p-8 flex flex-col items-center gap-6 shadow-lg mb-12">
            <label className="text-white text-xl font-bold italic">
              “Enter the room ID”
            </label>
            <input 
              type="text" 
              placeholder="8993633"
              className="w-full bg-white rounded-xl py-4 px-6 text-[#2D3E50] font-bold text-2xl text-center focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all tracking-[0.2em]"
            />
          </div>

          {/* Navigation Buttons */}
          <div className="w-full max-w-[500px] flex justify-between items-center">
            {/* Back Button */}
            <button 
  className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-300 transition-all active:scale-90"
  onClick={() => router.back()}
>
  <ChevronLeft size={32} strokeWidth={2.5} />
</button>

            {/* Next Button */}
            <button className="bg-[#2D3E50] text-white flex items-center gap-3 px-8 py-3 rounded-2xl hover:bg-[#1E293B] transition-all active:scale-95 shadow-md group">
              <span className="font-bold text-lg">Next</span>
              <ArrowRightCircle className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}