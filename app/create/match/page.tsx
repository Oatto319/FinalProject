'use client';

import React, { useState } from 'react';
import { Copy } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  role: string;
  status: 'ready' | 'wait';
  avatar: string;
}

const MatchPage = () => {
  // จำลองข้อมูลนักเรียน: ปรับสถานะทุกคนเป็น 'ready' เพื่อจำลองเหตุการณ์ที่ทุกคนพร้อมแล้ว
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: 'เจษฎา ชาร์รอน', role: 'นักเรียน', status: 'ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jedsada' },
    { id: 2, name: 'Thanaphon', role: 'นักเรียน', status: 'ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thanaphon' },
    { id: 3, name: 'Wimolchai', role: 'นักเรียน', status: 'ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wimolchai' },
    { id: 4, name: 'Pathiphat', role: 'นักเรียน', status: 'ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pathiphat' },
    { id: 5, name: 'ลีโอ วัฒนเดชา', role: 'นักเรียน', status: 'ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' },
  ]);

  // คำนวณจำนวนคนที่พร้อม
  const readyCount = students.filter(s => s.status === 'ready').length;
  const totalCount = students.length;
  const isAllReady = readyCount === totalCount;

  // ฟังก์ชันสลับสถานะ (ใช้สำหรับทดสอบโดยการคลิกที่แถบชื่อนักเรียน)
  const toggleReady = (id: number) => {
    setStudents(prev => prev.map(s => 
      s.id === id ? { ...s, status: s.status === 'wait' ? 'ready' : 'wait' } : s
    ));
  };

  // ฟังก์ชันคัดลอกรหัสห้อง
  const handleCopy = () => {
    const text = "#8993633";
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  return (
    <div className="min-h-screen bg-[#E5E7EB] p-4 md:p-8 font-sans flex flex-col items-center">
      {/* โปรไฟล์อาจารย์ด้านบน */}
      <div className="w-full max-w-6xl flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-sky-300">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Simon" alt="Host" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-sm leading-none">Simon14</h3>
          <p className="text-[10px] text-gray-400 mt-1 uppercase">อาจารย์</p>
        </div>
      </div>

      <div className="w-full max-w-6xl">
        {/* ส่วนหัววิชาสีชมพู */}
        <div className="bg-[#F8A4A4] rounded-t-[40px] p-6 md:p-8 flex flex-wrap justify-between items-center shadow-sm gap-4">
          <h1 className="text-[#4B3E7A] text-4xl md:text-5xl font-black italic tracking-tighter uppercase">
            PROGRAMMING
          </h1>
          <div className="flex items-center gap-4 bg-white/20 px-6 py-2 rounded-2xl backdrop-blur-sm">
            <span className="text-[#4B3E7A] text-2xl md:text-3xl font-black">#8993633</span>
            <button 
              onClick={handleCopy}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
            >
              <Copy className="text-sky-500" size={20} />
            </button>
          </div>
        </div>

        {/* ส่วนเนื้อหารายชื่อและสถานะ */}
        <div className="bg-[#D1D5DB]/40 p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 rounded-b-[40px] border-b-8 border-gray-300 shadow-inner">
          
          {/* รายชื่อนักเรียนทางด้านซ้าย */}
          <div className="flex flex-col gap-3">
            {students.map((student) => (
              <div 
                key={student.id} 
                onClick={() => toggleReady(student.id)}
                className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:scale-[1.01] transition-all border-2 border-transparent hover:border-blue-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-yellow-100 border border-gray-100">
                    <img src={student.avatar} alt={student.name} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-700 leading-tight">{student.name}</h4>
                    <p className="text-[10px] text-gray-400 uppercase font-medium">{student.role}</p>
                  </div>
                </div>
                
                <div className={`
                  px-6 py-1.5 rounded-xl font-bold text-sm min-w-[100px] text-center shadow-sm transition-colors
                  ${student.status === 'ready' ? 'bg-[#608BC1] text-white' : 'bg-[#C86D6D] text-white'}
                `}>
                  {student.status}
                </div>
              </div>
            ))}
          </div>

          {/* รายละเอียดห้องและปุ่ม Match ทางด้านขวา */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-[32px] p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-sky-200">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Simon" alt="Host" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800">Simon14</h3>
                    <span className="bg-[#94A3B8] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-tighter">HOST</span>
                  </div>
                  <p className="text-xs text-gray-400">อาจารย์</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">จับกลุ่มวิชา Ai</h2>
                <div className="grid grid-cols-2 gap-y-4 text-sm font-medium">
                  <div className="text-gray-500">
                    <p>กำหนดส่ง 12 พ.ย. นี้</p>
                    <p className="italic">จำนวน 30 คน กลุ่มละ 3 คน</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">เข้าร่วมแล้ว:</p>
                    <p className="text-3xl font-black text-[#4B3E7A] leading-none">30/30</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ส่วนแสดงผลเงื่อนไข: ตอนนี้ทุกคน Ready แล้ว จะแสดงปุ่ม Match */}
            <div className="flex-1 flex flex-col justify-end">
              {!isAllReady ? (
                /* กรณีที่มีคนยังไม่พร้อม */
                <div className="bg-white rounded-[32px] overflow-hidden flex shadow-sm min-h-[160px] border border-white/50">
                  <div className="flex-[3] flex items-center justify-center">
                    <span className="text-[#4B3E7A] text-6xl font-black italic tracking-tighter uppercase opacity-30 select-none">
                      READY
                    </span>
                  </div>
                  <div className="flex-[2] bg-[#7C3AED] flex flex-col items-center justify-center text-white">
                    <span className="text-6xl font-black leading-none">{readyCount}/{totalCount}</span>
                    <span className="text-xs font-bold uppercase mt-2 tracking-widest opacity-80">Waiting...</span>
                  </div>
                </div>
              ) : (
                /* กรณีที่ทุกคนพร้อมแล้ว (MATCH) */
                <button className="w-full relative group transition-transform active:scale-95">
                  <div className="absolute inset-0 bg-[#D97706] rounded-[32px] translate-y-2 group-active:translate-y-1"></div>
                  <div className="relative bg-[#FF8A00] hover:bg-[#FF9D2E] text-white py-10 rounded-[32px] flex items-center justify-center transition-all border-b-4 border-white/20">
                    <h1 className="text-7xl font-black italic tracking-tighter uppercase drop-shadow-md">
                      MATCH
                    </h1>
                  </div>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
      
      {/* คำแนะนำทดสอบ */}
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-[10px] italic">
          * จำลองสถานะทุกคนเป็น Ready เพื่อแสดงปุ่ม MATCH
        </p>
      </div>
    </div>
  );
};

export default MatchPage;