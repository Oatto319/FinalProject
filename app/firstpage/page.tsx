"use client"; // เพิ่มบรรทัดนี้เพื่อระบุว่าเป็น Client Component ให้ Next.js

import React from 'react';

/**
 * หน้าเลือกประเภทผู้ใช้งาน (Who Are You?)
 * แก้ไขปัญหา:
 * 1. Runtime Error: Event handlers cannot be passed to Client Component props
 * 2. TypeScript Error: Property 'src' does not exist on type 'EventTarget'
 */
const App = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#E5E7EB] p-4 font-sans text-[#2D3748]">
      {/* ส่วนหัวข้อหลัก */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black tracking-tighter text-[#1A202C] md:text-6xl">
          WHO ARE YOU?
        </h1>
        <p className="mt-2 text-lg font-medium text-gray-600">
          เลือกประเภทผู้ใช้งานเพื่อเข้าสู่ระบบ
        </p>
      </div>

      {/* ส่วนการ์ดตัวเลือก */}
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        {/* Card: STUDENT */}
        <button className="group flex w-72 flex-col items-center rounded-[2rem] bg-white p-8 shadow-sm transition-all hover:scale-105 hover:shadow-xl md:w-80">
          <h2 className="mb-8 text-4xl font-bold tracking-tight text-[#E5A546]">
            STUDENT
          </h2>
          <div className="relative h-48 w-full overflow-hidden rounded-xl">
            <img
              src="/img/student.png"
              alt="Student"
              className="h-full w-full object-contain"
              onError={(e) => {
                // ทำการ cast type เพื่อไม่ให้ TypeScript แจ้ง error
                const target = e.target as HTMLImageElement;
                target.src = "https://placeholder.com/300x200?text=Student+Image";
              }}
            />
          </div>
        </button>

        {/* Card: TEACHER */}
        <button className="group flex w-72 flex-col items-center rounded-[2rem] bg-white p-8 shadow-sm transition-all hover:scale-105 hover:shadow-xl md:w-80">
          <h2 className="mb-8 text-4xl font-bold tracking-tight text-[#9F7AEA]">
            TEACHER
          </h2>
          <div className="relative h-48 w-full overflow-hidden rounded-xl">
            <img
              src="/img/teacher.png"
              alt="Teacher"
              className="h-full w-full object-contain"
              onError={(e) => {
                // ทำการ cast type เพื่อไม่ให้ TypeScript แจ้ง error
                const target = e.target as HTMLImageElement;
                target.src = "https://placeholder.com/300x200?text=Teacher+Image";
              }}
            />
          </div>
        </button>
      </div>

      {/* ส่วนท้าย (Footer) */}
      <footer className="mt-12">
        <p className="text-md font-medium text-gray-600">
          จับคู่เพื่อนร่วมทีมด้วยระบบ MBTI
        </p>
      </footer>
    </div>
  );
};

export default App;