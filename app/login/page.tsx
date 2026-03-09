'use client';

import React from 'react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#1E293B] flex items-center justify-center p-4 font-sans">
      {/* Main White Container */}
      <div className="bg-white w-full max-w-[500px] rounded-[40px] overflow-hidden shadow-2xl flex flex-col items-center p-8 md:p-12">
        
        {/* Top Illustration - ปรับให้ใหญ่ขึ้นและขยับขึ้นด้านบนด้วย -mt-12 */}
        <div className="w-full flex justify-center -mt-12 mb-4">
          <img 
            src="/img/team.png" 
            alt="Team Illustration" 
            className="w-full max-w-[360px] h-auto object-contain drop-shadow-lg"
            onError={(e) => {
              // Fallback ในกรณีที่ยังไม่มีไฟล์รูปในเครื่องจริง
              e.currentTarget.src = "https://img.freepik.com/free-vector/team-holding-jigsaw-puzzle-pieces_74855-6962.jpg";
            }}
          />
        </div>

        {/* Title */}
        <h1 className="text-[#2D3142] text-xl font-bold mb-8">เข้าสู่ระบบ</h1>

        {/* Login Form Gray Box */}
        <div className="w-full bg-[#D1D5DB] rounded-[30px] p-8 mb-6 flex flex-col gap-4 shadow-inner">
          <div className="flex flex-col gap-2">
            <label className="text-[#4A4E69] font-bold text-lg ml-2">Username</label>
            <input 
              type="text" 
              placeholder="กรอกชื่อผู้ใช้......" 
              className="w-full bg-white rounded-full py-4 px-6 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all placeholder:text-gray-300"
            />
          </div>

          <div className="flex flex-col gap-2 relative">
            <input 
              type="password" 
              placeholder="กรอกรหัสผ่าน......" 
              className="w-full bg-white rounded-full py-4 px-6 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all placeholder:text-gray-300 mt-4"
            />
          </div>

          {/* Register Button (Right Aligned inside gray box) */}
          <div className="flex justify-end mt-2">
            <button className="bg-[#64748B] text-white px-8 py-2 rounded-full hover:bg-[#475569] transition-colors text-sm font-medium">
              Register
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button className="w-full bg-[#607D8B] text-white py-4 rounded-[20px] font-bold text-lg hover:brightness-95 transition-all shadow-md active:scale-95">
            Sign in
          </button>
          
          <button className="w-full bg-[#D1D5DB] text-[#475569] py-4 rounded-[20px] font-bold text-lg hover:bg-gray-200 transition-all shadow-md active:scale-95">
            Guest login
          </button>
        </div>

      </div>
    </div>
  );
}