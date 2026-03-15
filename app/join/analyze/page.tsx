'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LucideMessageCircle, ChevronLeft, Sparkles, BrainCircuit } from 'lucide-react';

export default function AnalyzePage() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  // ข้อมูลสมาชิกในทีมพร้อมคะแนนการวิเคราะห์จำลอง
  const teamMembers = [
    { id: 1, name: 'อีวาน นาวาริน', role: 'นักเรียน', score: 85, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan', traits: ['Creative', 'Diligent'] },
    { id: 2, name: 'เจษฎา ชาร้อน', role: 'นักเรียน', score: 92, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jed', traits: ['Technical', 'Fast Learner'] },
    { id: 3, name: 'Wimolchai', role: 'นักเรียน', score: 88, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wimolchai', traits: ['Organized', 'Helpful'] },
  ];

  // จำลองการโหลดการวิเคราะห์
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnalyzing(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#1A2635] font-sans flex flex-col items-center">
      {/* Header Section */}
      <header className="w-full flex items-center justify-between bg-white p-4 shadow-sm">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-orange-100 border-2 border-orange-200">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Wimolchai"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-bold text-xl text-gray-800 leading-tight">Wimolchai</h2>
              <p className="text-xs text-gray-500 font-medium">นักเรียน</p>
            </div>
          </div>
          <button className="bg-[#4ade80] p-3 rounded-full text-white shadow-lg">
            <LucideMessageCircle fill="currentColor" size={28} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl mt-8 px-4 pb-12">
        <div className="bg-[#E5E7EB] rounded-[40px] p-8 md:p-12 shadow-2xl flex flex-col items-center min-h-[700px] relative overflow-hidden">

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="absolute left-8 top-8 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-700 shadow-md hover:bg-gray-100 transition-all z-20">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>

          {/* Analyze Icon & Animation */}
          <div className="relative mb-8">
            <div className={`p-6 rounded-full bg-white shadow-xl transition-all duration-1000 ${isAnalyzing ? 'animate-pulse scale-110' : 'scale-100'}`}>
              <BrainCircuit size={64} className={isAnalyzing ? 'text-blue-500' : 'text-[#2D3E50]'} />
            </div>
            {isAnalyzing && (
              <div className="absolute inset-0 border-4 border-blue-400 rounded-full animate-ping opacity-25"></div>
            )}
          </div>

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-[#2D3E50] text-3xl font-black uppercase tracking-tight mb-2">
              &ldquo;Analyze for leader&rdquo;
            </h1>
            <p className="text-gray-500 font-medium">ระบบกำลังวิเคราะห์ความเหมาะสมจากข้อมูลสมาชิก...</p>
          </div>

          {/* Analysis Results Grid */}
          <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className={`
                  bg-white rounded-[35px] p-6 flex flex-col items-center gap-4 shadow-sm relative overflow-hidden
                  transition-all duration-500 border-4
                  ${!isAnalyzing && member.id === 2 ? 'border-yellow-400 scale-105 shadow-2xl' : 'border-transparent'}
                `}
              >
                {/* Result Badge */}
                {!isAnalyzing && member.id === 2 && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-white p-1 rounded-full">
                    <Sparkles size={16} fill="currentColor" />
                  </div>
                )}

                {/* Avatar with Scanning Effect */}
                <div className="relative w-24 h-24 md:w-28 md:h-28">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 border-2 border-gray-100 shadow-inner">
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-pulse flex items-center justify-center">
                      <div className="w-full h-1 bg-blue-400 absolute animate-[scan_2s_ease-in-out_infinite]"></div>
                    </div>
                  )}
                </div>

                <div className="text-center w-full">
                  <h4 className="font-bold text-gray-800 text-lg leading-tight">{member.name}</h4>
                  <p className="text-sm text-gray-400 mt-1 mb-3">{member.role}</p>

                  {/* Suitability Score Bar */}
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ease-out ${isAnalyzing ? 'w-0' : 'w-full'}`}
                      style={{
                        width: isAnalyzing ? '0%' : `${member.score}%`,
                        backgroundColor: member.id === 2 ? '#FACC15' : '#7096D1'
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 px-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Suitability</span>
                    <span className="text-[10px] font-bold text-gray-700">{isAnalyzing ? '...' : `${member.score}%`}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Result Action Button */}
          <button
            onClick={() => !isAnalyzing && router.push('/join/myteam')}
            className={`
    w-full max-w-sm py-5 rounded-[25px] font-black text-3xl shadow-lg transition-all transform active:scale-95
    ${isAnalyzing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#2D3E50] text-white hover:bg-[#1E293B] shadow-[#1A2635]/30'}
  `}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'ANALYZING...' : 'CONFIRM LEADER'}
          </button>

          {/* Helper Legend */}
          <div className="mt-8 flex gap-6 text-gray-500 text-xs font-bold italic opacity-60">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Competency</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Best Fit</span>
          </div>

        </div>
      </main>

      <style jsx global>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
      `}</style>
    </div>
  );
}