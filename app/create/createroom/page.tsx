'use client';

import React, { useState } from 'react';
import { LucideMessageCircle, ChevronLeft, Users, BookOpen, AlignLeft } from 'lucide-react';

export default function CreateRoomPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    totalMembers: '',
    groupSize: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      {/* Header Section */}
      <header className="w-full flex items-center justify-between bg-white p-6 shadow-sm">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-orange-100 border-2 border-orange-200 shadow-sm">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Simon" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-bold text-2xl text-gray-800 leading-tight">Simon14</h2>
              <p className="text-sm text-gray-500 font-medium">อาจารย์</p>
            </div>
          </div>
          <button className="bg-green-500 p-4 rounded-full text-white shadow-lg hover:scale-105 transition-transform active:scale-95">
            <LucideMessageCircle fill="currentColor" size={32} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl mt-12 px-4 pb-12">
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm flex flex-col items-center min-h-[600px] relative">
          
          {/* Back Button */}
          <button className="absolute left-8 top-8 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-all active:scale-90">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>

          {/* Form Container - ขยับขึ้นเล็กน้อยหลังจากเอารูปออก */}
          <div className="w-full max-w-2xl bg-[#2D3E50] rounded-[40px] p-10 shadow-2xl space-y-8 mt-4">
            <h1 className="text-white text-3xl font-black italic text-center mb-8 tracking-wide">
              &ldquo;Create your room&rdquo;
            </h1>

            <div className="space-y-6">
              {/* Activity Name */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <BookOpen size={24} />
                </div>
                <input 
                  type="text"
                  name="title"
                  placeholder="ชื่อกิจกรรม"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-white rounded-2xl py-5 pl-14 pr-6 text-[#2D3E50] font-bold text-xl focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all placeholder:text-gray-300"
                />
              </div>

              {/* Room Description - เปลี่ยนจากกำหนดส่งเป็นรายละเอียดห้อง */}
              <div className="relative">
                <div className="absolute left-4 top-6 text-gray-400">
                  <AlignLeft size={24} />
                </div>
                <textarea 
                  name="description"
                  placeholder="รายละเอียดกิจกรรม / รายละเอียดห้อง"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-white rounded-2xl py-5 pl-14 pr-6 text-[#2D3E50] font-bold text-xl focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all placeholder:text-gray-300 resize-none"
                />
              </div>

              {/* Members Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Users size={24} />
                  </div>
                  <input 
                    type="number"
                    name="totalMembers"
                    placeholder="จำนวนนักเรียนทั้งหมด"
                    value={formData.totalMembers}
                    onChange={handleChange}
                    className="w-full bg-white rounded-2xl py-5 pl-14 pr-6 text-[#2D3E50] font-bold text-xl focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all placeholder:text-gray-300"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Users size={24} />
                  </div>
                  <input 
                    type="number"
                    name="groupSize"
                    placeholder="จำนวนกลุ่มละกี่คน"
                    value={formData.groupSize}
                    onChange={handleChange}
                    className="w-full bg-white rounded-2xl py-5 pl-14 pr-6 text-[#2D3E50] font-bold text-xl focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Create Button */}
            <div className="pt-4">
              <button className="w-full bg-[#7096D1] text-white py-6 rounded-[25px] font-black text-3xl shadow-[0_8px_0_0_#4A6FA5] hover:shadow-[0_4px_0_0_#4A6FA5] hover:translate-y-[4px] transition-all active:shadow-none active:translate-y-[8px] uppercase tracking-widest">
                CREATE
              </button>
            </div>
          </div>

          <div className="mt-8 text-gray-400 text-sm font-medium italic opacity-60">
            * ตรวจสอบข้อมูลให้ครบถ้วนก่อนกดสร้างห้อง
          </div>
        </div>
      </main>
    </div>
  );
}