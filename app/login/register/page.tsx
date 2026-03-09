'use client';

import React from 'react';
import { ChevronDown, ArrowRightCircle } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#1E293B] flex flex-col items-center justify-center p-4 font-sans">
      
      {/* Header Text */}
      <div className="text-center mb-8">
        <h1 className="text-white text-5xl md:text-6xl font-black tracking-tighter uppercase mb-2">
          WHO ARE YOU?
        </h1>
        <p className="text-gray-400 text-lg">
          เลือกประเภทผู้ใช้งานเพื่อเข้าสู่ระบบ
        </p>
      </div>

      {/* Form Container */}
      <div className="bg-white w-full max-w-[600px] rounded-[40px] p-8 md:p-12 shadow-2xl flex flex-col gap-6">
        
        {/* Name Input Section */}
        <div className="bg-[#2D3E50] rounded-[25px] p-6 flex flex-col gap-4">
          <label className="text-white text-xl font-bold italic">
            “What’s your name?”
          </label>
          <input 
            type="text" 
            defaultValue="Wimolchai"
            className="w-full bg-white rounded-xl py-4 px-6 text-[#2D3E50] font-bold text-lg focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all"
          />
        </div>

        {/* Gender Select Section */}
        <div className="bg-[#2D3E50] rounded-[25px] p-6 flex flex-col gap-4">
          <label className="text-white text-xl font-bold italic">
            “What is your gender?”
          </label>
          <div className="relative group">
            <select 
              className="w-full bg-white rounded-xl py-4 px-6 text-[#2D3E50] font-bold text-lg appearance-none focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all cursor-pointer"
              defaultValue="Male"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <div className="absolute right-0 top-0 h-full w-14 bg-[#D1D5DB] rounded-r-xl flex items-center justify-center pointer-events-none border-l border-gray-300 group-hover:bg-gray-300 transition-colors">
              <ChevronDown className="text-[#2D3E50]" size={28} strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Next Button */}
        <div className="flex justify-end mt-4">
          <button className="bg-[#2D3E50] text-white flex items-center gap-3 px-8 py-3 rounded-2xl hover:bg-[#1E293B] transition-all active:scale-95 shadow-lg group">
            <span className="font-bold text-lg">Next</span>
            <ArrowRightCircle className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
}