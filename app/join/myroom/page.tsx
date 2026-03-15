'use client';

import React, { useState, useEffect } from 'react';
import { LucideMessageCircle, Copy } from 'lucide-react';

const MY_NAME = 'Wimolchai';

export default function MyRoomPage() {
  // ข้อมูลจำลองสำหรับรายชื่อสมาชิก
  const members = [
    { id: 1, name: 'เจษฎา ชาร้อน', role: 'นักเรียน', status: 'Ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jed' },
    { id: 2, name: 'Thanaphon', role: 'นักเรียน', status: 'Ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Than' },
    { id: 3, name: 'Wimolchai', role: 'นักเรียน', status: 'Wait', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wimolchai' },
    { id: 4, name: 'Pathiphat', role: 'นักเรียน', status: 'Ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pathi' },
    { id: 5, name: 'ลีโอ วัฒนเดชา', role: 'นักเรียน', status: 'Wait', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' },
  ];

  // --- เพิ่ม: state สำหรับสถานะ ready ของตัวเองและของทุกคน ---
  const [isReady, setIsReady] = useState(false);
  const [readyUsers, setReadyUsers] = useState<string[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('readyUsers') || '[]') as string[];
    setReadyUsers(stored);
    setIsReady(stored.includes(MY_NAME));
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      const stored = JSON.parse(localStorage.getItem('readyUsers') || '[]') as string[];
      setReadyUsers(stored);
      setIsReady(stored.includes(MY_NAME));
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const handleReady = () => {
    const newStatus = !isReady;
    setIsReady(newStatus);
    const stored = JSON.parse(localStorage.getItem('readyUsers') || '[]') as string[];
    const updated = newStatus
      ? stored.includes(MY_NAME) ? stored : [...stored, MY_NAME]
      : stored.filter((n) => n !== MY_NAME);
    localStorage.setItem('readyUsers', JSON.stringify(updated));
    setReadyUsers(updated);
    window.dispatchEvent(new StorageEvent('storage', { key: 'readyUsers' }));
  };
  // --- สิ้นสุดส่วนที่เพิ่ม ---

  const copyToClipboard = () => {
    const roomId = "8993633";
    // ใช้ document.execCommand สำหรับสภาพแวดล้อมที่มีข้อจำกัด
    const el = document.createElement('textarea');
    el.value = roomId;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

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
          <button className="bg-green-500 p-4 rounded-full text-white shadow-lg hover:scale-105 transition-transform active:scale-95">
            <LucideMessageCircle fill="currentColor" size={32} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-6xl mt-8 px-4 pb-12">
        <div className="bg-white rounded-[40px] overflow-hidden shadow-sm min-h-[700px]">
          
          {/* Top Banner Section */}
          <div className="bg-[#FFA4A4] p-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-[#4A4E69] text-5xl font-black tracking-widest uppercase">
              PROGRAMMING
            </h1>
            <div className="flex items-center gap-3 bg-[#4A4E69]/10 px-6 py-2 rounded-2xl">
              <span className="text-[#4A4E69] text-4xl font-black">#8993633</span>
              <button 
                onClick={copyToClipboard}
                className="bg-white/80 p-2 rounded-full hover:bg-white transition-colors text-[#4A4E69]"
              >
                <Copy size={24} />
              </button>
            </div>
          </div>

          {/* Content Columns */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-8 bg-gray-200/50 min-h-[600px]">
            
            {/* Left Column: Member List (Now on the left in image_97f8d4.png) */}
            <div className="md:col-span-6 flex flex-col gap-3">
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
                  {/* --- แก้: สถานะแสดงตาม readyUsers จริง --- */}
                  <button className={`px-6 py-1.5 rounded-xl font-bold text-white text-sm ${readyUsers.includes(member.name) ? 'bg-[#7096D1]' : 'bg-[#C76A6A]'}`}>
                    {readyUsers.includes(member.name) ? 'Ready' : 'Wait'}
                  </button>
                </div>
              ))}
            </div>

            {/* Right Column: Room Details & Ready Button */}
            <div className="md:col-span-6 flex flex-col gap-6">
              {/* Room Info Card */}
              <div className="bg-white rounded-[30px] p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-100 bg-blue-50">
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

                <div className="space-y-4 text-gray-700">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="font-bold text-lg">จับกลุ่มวิชาAi</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="font-bold text-lg text-gray-500 font-medium">กำหนดส่ง 12 พ.ย. นี้</span>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">เข้าร่วมแล้ว:</p>
                      <p className="font-bold text-xl text-[#2D3E50]">30/30</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="font-bold text-lg text-gray-600">จำนวน 30 คน กลุ่มละ 3 คน</p>
                  </div>
                </div>
              </div>

              {/* --- แก้: ปุ่ม READY กด toggle ได้ และเปลี่ยนสีเมื่อ ready --- */}
              <button
                onClick={handleReady}
                className={`mt-auto w-full py-8 rounded-[30px] font-black text-5xl uppercase tracking-[0.2em] text-white transition-all
                  ${isReady
                    ? 'bg-green-500 shadow-[0_10px_0_0_#15803d] hover:shadow-[0_5px_0_0_#15803d] hover:translate-y-[5px] active:shadow-none active:translate-y-[10px]'
                    : 'bg-[#7096D1] shadow-[0_10px_0_0_#4A6FA5] hover:shadow-[0_5px_0_0_#4A6FA5] hover:translate-y-[5px] active:shadow-none active:translate-y-[10px]'
                  }`}
              >
                {isReady ? 'READY ✓' : 'READY'}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}