'use client';

import React, { useState } from 'react';
import { LucideMessageCircle, ChevronLeft, Settings2, Users2, LayoutGrid, CheckCircle2 } from 'lucide-react';

export default function TypesettingPage() {
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);

  const settingOptions = [
    {
      id: 'random',
      title: 'RANDOM',
      description: 'สุ่มสมาชิกเข้ากลุ่มโดยอัตโนมัติ เหมาะสำหรับกิจกรรมที่ต้องการความรวดเร็วและให้สมาชิกทำความรู้จักกันใหม่',
      icon: <LayoutGrid className="w-8 h-8" />
    },
    {
      id: 'skill',
      title: 'SKILL BASED',
      description: 'จัดกลุ่มตามทักษะและความสามารถ เพื่อให้ในหนึ่งกลุ่มมีสมาชิกที่มีทักษะหลากหลายครอบคลุมความต้องการของงาน',
      icon: <Settings2 className="w-8 h-8" />
    },
    {
      id: 'manual',
      title: 'MANUAL',
      description: 'อาจารย์เป็นผู้เลือกสมาชิกเข้ากลุ่มด้วยตนเอง เหมาะสำหรับกรณีที่มีการวางแผนกลุ่มไว้ล่วงหน้าแล้ว',
      icon: <Users2 className="w-8 h-8" />
    }
  ];

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
      <main className="w-full max-w-5xl mt-8 px-4 pb-12">
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm flex flex-col items-center min-h-[600px] relative">
          
          {/* Back Button */}
          <button className="absolute left-8 top-8 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-all active:scale-90">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>

          {/* Title Section */}
          <div className="text-center mt-4 mb-12">
            <h1 className="text-[#2D3E50] text-3xl font-black italic mb-2 tracking-wide uppercase">
              &ldquo;Typesetting&rdquo;
            </h1>
            <p className="text-gray-500 font-bold">เลือกรูปแบบการจัดกลุ่มที่ต้องการ</p>
          </div>

          {/* Settings Options Grid */}
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {settingOptions.map((option) => (
              <button 
                key={option.id}
                onClick={() => setSelectedSetting(option.id)}
                className={`
                  bg-[#2D3E50] rounded-[35px] p-8 flex flex-col items-center text-center gap-4 shadow-xl
                  transition-all duration-300 border-4 relative overflow-hidden group
                  ${selectedSetting === option.id 
                    ? 'border-[#7096D1] scale-105 ring-4 ring-[#7096D1]/20' 
                    : 'border-transparent hover:border-gray-500'}
                `}
              >
                {/* Active Indicator */}
                {selectedSetting === option.id && (
                  <div className="absolute top-4 right-4 text-[#7096D1] animate-in zoom-in duration-300">
                    <CheckCircle2 size={24} fill="currentColor" className="text-white" />
                  </div>
                )}

                {/* Icon Circle */}
                <div className={`
                  w-20 h-20 rounded-full flex items-center justify-center mb-2 transition-colors
                  ${selectedSetting === option.id ? 'bg-[#7096D1] text-white' : 'bg-white/10 text-white/60 group-hover:bg-white/20'}
                `}>
                  {option.icon}
                </div>
                
                <h3 className="text-white text-2xl font-black italic tracking-wider">
                  {option.title}
                </h3>
                
                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                  {option.description}
                </p>
              </button>
            ))}
          </div>

          {/* Action Button - ปรับให้เหมือนหน้า Create Room (3D Style) */}
          <div className="w-full flex justify-center pt-4">
            <button 
              disabled={!selectedSetting}
              className={`
                w-full max-w-sm py-6 rounded-[25px] font-black text-3xl transition-all transform uppercase tracking-widest
                ${selectedSetting 
                  ? 'bg-[#7096D1] text-white shadow-[0_8px_0_0_#4A6FA5] hover:shadow-[0_4px_0_0_#4A6FA5] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px]' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}
              `}
            >
              CONFIRM
            </button>
          </div>

          <div className="mt-8 text-gray-400 text-xs font-bold italic opacity-60">
            * คุณสามารถกลับมาแก้ไขรูปแบบการจัดกลุ่มได้ในภายหลัง
          </div>
        </div>
      </main>
    </div>
  );
}