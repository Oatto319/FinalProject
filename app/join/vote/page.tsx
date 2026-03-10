'use client';

import React, { useState } from 'react';
import { LucideMessageCircle, ChevronLeft } from 'lucide-react';

export default function VotePage() {
  // กำหนดเป็น number | null เพื่อความชัดเจน
  const [selectedMember, setSelectedMember] = useState<number | null>(null);

  // ข้อมูลสมาชิกในทีมสำหรับโหวต
  const teamMembers = [
    { id: 1, name: 'อีวาน นาวาริน', role: 'นักเรียน', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan' },
    { id: 2, name: 'เจษฎา ชาร้อน', role: 'นักเรียน', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jed' },
    { id: 3, name: 'Wimolchai', role: 'นักเรียน', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wimolchai' },
  ];

  const handleVote = () => {
    if (selectedMember !== null) {
      const member = teamMembers.find(m => m.id === selectedMember);
      console.log('Voted for:', member?.name);
      // เพิ่ม Logic การส่งข้อมูลโหวตที่นี่
    }
  };

  return (
    <div className="min-h-screen bg-[#1A2635] font-sans flex flex-col items-center">
      {/* Header Section */}
      <header className="w-full flex items-center justify-between bg-white p-4 shadow-sm">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-orange-100 border-2 border-orange-200 shadow-sm">
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
          <button className="bg-[#4ade80] p-3 rounded-full text-white shadow-lg hover:scale-105 transition-transform active:scale-95">
            <LucideMessageCircle fill="currentColor" size={28} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl mt-8 px-4 pb-12">
        <div className="bg-[#E5E7EB] rounded-[40px] p-8 md:p-12 shadow-2xl flex flex-col items-center min-h-[700px] relative">
          
          {/* Back Button */}
          <button className="absolute left-8 top-8 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-700 shadow-md hover:bg-gray-100 transition-all active:scale-90">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>

          {/* Top Illustration */}
          <div className="w-full flex justify-center -mt-16 mb-6">
            <img 
              src="/img/team.png" 
              alt="Team Illustration" 
              className="w-full max-w-[280px] h-auto object-contain drop-shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://img.freepik.com/free-vector/team-holding-jigsaw-puzzle-pieces_74855-6962.jpg";
              }}
            />
          </div>

          {/* Title */}
          <h1 className="text-[#2D3E50] text-3xl font-black mb-10 text-center uppercase tracking-tight">
            &ldquo;Vote your team leader&rdquo;
          </h1>

          {/* Members Selection Grid */}
          <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {teamMembers.map((member) => (
              <button 
                key={member.id}
                onClick={() => setSelectedMember(member.id)}
                className={`
                  bg-white rounded-[30px] p-6 flex flex-col items-center gap-4 shadow-sm cursor-pointer
                  transition-all duration-200 border-4 outline-none
                  ${selectedMember === member.id 
                    ? 'border-[#7096D1] scale-105 shadow-xl' 
                    : 'border-transparent hover:border-gray-200'}
                `}
              >
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-gray-50 border-2 border-gray-100 shadow-inner">
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                
                <div className="text-center">
                  <h4 className="font-bold text-gray-800 text-lg leading-tight">{member.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">{member.role}</p>
                </div>
                
                {/* Radio Indicator */}
                <div className={`
                  w-7 h-7 rounded-full border-2 flex items-center justify-center mt-2
                  ${selectedMember === member.id 
                    ? 'bg-[#7096D1] border-[#7096D1]' 
                    : 'border-gray-200'}
                `}>
                  {selectedMember === member.id && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Vote Button */}
          <button 
            disabled={selectedMember === null}
            onClick={handleVote}
            className={`
              w-full max-w-xs py-5 rounded-[25px] font-black text-3xl shadow-lg transition-all transform active:scale-95
              ${selectedMember !== null 
                ? 'bg-[#2D3E50] text-white hover:bg-[#1E293B] shadow-[#1A2635]/30' 
                : 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'}
            `}
          >
            VOTE
          </button>

          {/* Helper Text */}
          <div className="mt-8 text-gray-500 text-sm font-bold italic opacity-60">
            * เลือกสมาชิกหนึ่งคนเพื่อโหวตเป็นหัวหน้ากลุ่ม
          </div>

        </div>
      </main>
    </div>
  );
}