'use client';

import React from 'react';
import { LucideMessageCircle, ArrowRightCircle } from 'lucide-react';

export default function JoinCheckPage() {
  // ข้อมูลจำลองสำหรับรายชื่อสมาชิก
  const members = [
    { id: 1, name: 'เจษฎา ชาร้อน', role: 'นักเรียน', status: 'Ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jed' },
    { id: 2, name: 'Thanaphon', role: 'นักเรียน', status: 'Ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Than' },
    { id: 3, name: 'Wimolchai', role: 'นักเรียน', status: 'Wait', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wimolchai' },
    { id: 4, name: 'Pathiphat', role: 'นักเรียน', status: 'Ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pathi' },
    { id: 5, name: 'ลีโอ วัฒนเดชา', role: 'นักเรียน', status: 'Wait', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' },
  ];

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      {/* Header Section */}
      <header className="w-full flex items-center justify-between bg-white p-6 shadow-sm">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between px-4">
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
          <button className="bg-green-500 p-4 rounded-full text-white shadow-lg">
            <LucideMessageCircle fill="currentColor" size={32} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-6xl mt-8 px-4 grid grid-cols-1 md:grid-cols-12 gap-6 pb-12">
        
        {/* Left Column: Room Info & Buttons */}
        <div className="md:col-span-5 flex flex-col gap-6">
          {/* Room Details Card */}
          <div className="bg-white rounded-[30px] p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-100">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Simon" alt="Host" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-gray-700">Simon14</span>
                  <span className="bg-[#8E97B0] text-white text-xs px-2 py-0.5 rounded uppercase font-bold">Host</span>
                </div>
                <p className="text-gray-400 text-sm">อาจารย์</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 text-gray-700">
              <div className="font-bold text-lg">จับกลุ่มวิชาAi</div>
              <div className="text-right font-bold text-lg text-[#2D3E50]">ID: 8993633</div>
              
              <div className="font-bold text-lg">กำหนดส่ง 12 พ.ย. นี้</div>
              <div className="text-right font-bold text-lg text-[#2D3E50]">เข้าร่วมแล้ว:</div>
              
              <div className="font-bold text-lg text-gray-600">จำนวน 30 คน กลุ่มละ 3 คน</div>
              <div className="text-right font-bold text-xl text-[#2D3E50]">29/30</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-auto">
            <button className="flex-1 bg-gray-500 text-white py-4 rounded-2xl font-bold text-xl shadow-md hover:bg-gray-600 transition-colors">
              Cancel
            </button>
            <button className="flex-2 bg-[#2D3E50] text-white py-4 px-12 rounded-2xl font-bold text-xl shadow-md flex items-center justify-center gap-3 hover:bg-[#1E293B] transition-colors">
              Join <ArrowRightCircle size={24} />
            </button>
          </div>
        </div>

        {/* Right Column: Template & Members */}
        <div className="md:col-span-7 flex flex-col gap-4">
          {/* Header Template Box */}
          <div className="bg-[#FFA4A4] rounded-[30px] p-6 text-center shadow-sm">
            <h1 className="text-[#4A4E69] text-5xl font-black tracking-widest uppercase">
              PROGRAMMING
            </h1>
          </div>

          {/* Member List */}
          <div className="flex flex-col gap-3">
            {members.map((member) => (
              <div key={member.id} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{member.name}</h4>
                    <p className="text-xs text-gray-400">{member.role}</p>
                  </div>
                </div>
                <button className={`px-6 py-1.5 rounded-xl font-bold text-white text-sm ${member.status === 'Ready' ? 'bg-[#7096D1]' : 'bg-[#C76A6A]'}`}>
                  {member.status}
                </button>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}