"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const App = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromEdit = searchParams.get('from') === 'edit';

  const handleSelect = (role: 'user' | 'host') => {
    const raw = localStorage.getItem('currentUser');
    if (raw) {
      const currentUser = JSON.parse(raw);
      const updated = { ...currentUser, role };
      localStorage.setItem('currentUser', JSON.stringify(updated));

      // อัปเดตใน users array ด้วย
      const usersRaw = localStorage.getItem('users');
      if (usersRaw) {
        const users = JSON.parse(usersRaw);
        const idx = users.findIndex(
          (u: { name: string }) => u.name.toLowerCase() === currentUser.name.toLowerCase()
        );
        if (idx >= 0) {
          users[idx] = { ...users[idx], role };
          localStorage.setItem('users', JSON.stringify(users));
        }
      }
    }
    fromEdit ? router.back() : router.push('/');
  };

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
        {/* Card: USER */}
        <button
          onClick={() => handleSelect('user')}
          className="group flex w-72 flex-col items-center rounded-[2rem] bg-white p-8 shadow-sm transition-all hover:scale-105 hover:shadow-xl md:w-80"
        >
          <h2 className="mb-8 text-4xl font-bold tracking-tight text-[#E5A546]">
            USER
          </h2>
          <div className="relative h-48 w-full overflow-hidden rounded-xl">
            <img
              src="/img/student.png"
              alt="User"
              className="h-full w-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://placeholder.com/300x200?text=User+Image";
              }}
            />
          </div>
        </button>

        {/* Card: HOST */}
        <button
          onClick={() => handleSelect('host')}
          className="group flex w-72 flex-col items-center rounded-[2rem] bg-white p-8 shadow-sm transition-all hover:scale-105 hover:shadow-xl md:w-80"
        >
          <h2 className="mb-8 text-4xl font-bold tracking-tight text-[#9F7AEA]">
            HOST
          </h2>
          <div className="relative h-48 w-full overflow-hidden rounded-xl">
            <img
              src="/img/teacher.png"
              alt="Host"
              className="h-full w-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://placeholder.com/300x200?text=Host+Image";
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
