import React from 'react';
import { Copy } from 'lucide-react';

const MatchRoom = () => {
  // ข้อมูลนักเรียนที่สถานะ Ready ทั้งหมดตามรูปภาพใหม่
  const students = [
    { id: 1, name: 'เจษฎา ชาร้อน', role: 'นักเรียน', status: 'ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
    { id: 2, name: 'Thanaphon', role: 'นักเรียน', status: 'ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
    { id: 3, name: 'Wimolchai', role: 'นักเรียน', status: 'ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wimolchai' },
    { id: 4, name: 'Pathiphat', role: 'นักเรียน', status: 'ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pathiphat' },
    { id: 5, name: 'ลีโอ วัฒนเดชา', role: 'นักเรียน', status: 'ready', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' },
  ];

  return (
    <div className="min-h-screen bg-[#E5E7EB] p-4 md:p-8 font-sans flex flex-col items-center">
      {/* ส่วนแถบโปรไฟล์ด้านบนสุด */}
      <div className="w-full max-w-5xl flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Simon" alt="Host" className="w-full h-full bg-sky-300" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-sm">Simon14</h3>
          <p className="text-xs text-gray-400">อาจารย์</p>
        </div>
      </div>

      <div className="w-full max-w-5xl bg-white rounded-[40px] shadow-xl overflow-hidden flex flex-col border-b-8 border-gray-300">
        {/* ส่วนหัวสีชมพู (Header Section) */}
        <div className="bg-[#F8A4A4] p-6 md:px-10 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[#4B3E7A] text-4xl md:text-5xl font-black italic tracking-tighter">
            PROGRAMMING
          </h1>
          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl">
            <span className="text-[#4B3E7A] text-2xl md:text-3xl font-black">#8993633</span>
            <button className="p-2 bg-white rounded-xl shadow-sm text-sky-400 hover:bg-gray-50 transition-colors">
              <Copy size={20} />
            </button>
          </div>
        </div>

        {/* ส่วนเนื้อหาหลัก (Main Content) */}
        <div className="p-6 md:p-10 bg-[#E5E7EB] grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ฝั่งซ้าย: รายชื่อนักเรียน (Student List) */}
          <div className="flex flex-col gap-3">
            {students.map((student) => (
              <div 
                key={student.id} 
                className="bg-white rounded-2xl p-3 flex items-center justify-between shadow-sm border border-transparent hover:border-white transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-yellow-100 border-2 border-white">
                    <img src={student.avatar} alt={student.name} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-700 leading-tight">{student.name}</h4>
                    <p className="text-xs text-gray-400">{student.role}</p>
                  </div>
                </div>
                
                <div className="px-6 py-1.5 rounded-xl font-bold text-sm text-white shadow-sm bg-[#6B8DCC]">
                  Ready
                </div>
              </div>
            ))}
          </div>

          {/* ฝั่งขวา: รายละเอียดห้องและปุ่ม Match */}
          <div className="flex flex-col gap-10">
            {/* การ์ดข้อมูลห้อง (Room Info Card) */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm flex flex-col gap-6 relative">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-sky-200">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Simon" alt="Host" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-700">Simon14</h3>
                    <span className="bg-[#7B85A4] text-[10px] text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">HOST</span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium">อาจารย์</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-[#4B3E7A]">จับกลุ่มวิชา Ai</h2>
                <div className="grid grid-cols-2 gap-y-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-medium">กำหนดส่ง 12 พ.ย. นี้</p>
                    <p className="text-sm text-gray-500 font-medium italic">จำนวน 30 คน กลุ่มละ 3 คน</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 font-medium">เข้าร่วมแล้ว:</p>
                    <p className="text-xl font-black text-[#4B3E7A]">30/30</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ปุ่ม MATCH สีส้มขนาดใหญ่ (Big Match Button) */}
            <button className="relative group w-full">
              <div className="absolute inset-0 bg-[#D97706] rounded-[28px] translate-y-2"></div>
              <div className="relative bg-[#FF8A00] hover:bg-[#FF9D2E] active:translate-y-1 transition-all rounded-[28px] py-6 flex items-center justify-center border-b-4 border-white/20">
                <h1 className="text-white text-5xl md:text-6xl font-black italic tracking-widest uppercase">
                  MATCH
                </h1>
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MatchRoom;