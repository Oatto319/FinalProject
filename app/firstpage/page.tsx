"use client";

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const AppContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromEdit = searchParams.get('from') === 'edit';

  const handleSelect = async (role: 'user' | 'host') => {
    const raw = localStorage.getItem('currentUser');
    if (raw) {
      const currentUser = JSON.parse(raw);
      const updated = { ...currentUser, role };
      localStorage.setItem('currentUser', JSON.stringify(updated));

      if (currentUser.gmail) {
        await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gmail: currentUser.gmail, role }),
        });
      }
    }
    fromEdit ? router.back() : router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#E5E7EB] p-4 font-sans text-[#2D3748]">
      {/* ส่วนหัวข้อหลัก */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A202C]" style={{ textShadow: '0 4px 0 rgba(0,0,0,0.3)' }}>
          WHO ARE YOU?
        </h1>
        <p className="mt-2 text-sm font-medium text-gray-600">
          เลือกประเภทผู้ใช้งานเพื่อเข้าสู่ระบบ
        </p>
      </div>

      {/* ส่วนการ์ดตัวเลือก */}
      <div className="flex flex-row gap-4 sm:gap-8 w-full max-w-xl px-2">
        {/* Card: USER */}
        <button
          onClick={() => handleSelect('user')}
          className="group flex flex-1 flex-col items-center rounded-[1.5rem] sm:rounded-[2rem] bg-white p-4 sm:p-8 shadow-sm transition-all hover:scale-105 hover:shadow-xl min-h-[200px] sm:min-h-[380px]"
        >
          <h2 className="mb-3 sm:mb-8 text-2xl sm:text-4xl font-bold tracking-tight text-[#E5A546]">
            USER
          </h2>
          <div className="relative h-28 sm:h-56 w-full overflow-hidden rounded-xl mt-2 sm:mt-4">
            <img
              src="/img/student.png"
              alt="User"
              className="h-full w-full object-contain"
            />
          </div>
        </button>

        {/* Card: HOST */}
        <button
          onClick={() => handleSelect('host')}
          className="group flex flex-1 flex-col items-center rounded-[1.5rem] sm:rounded-[2rem] bg-white p-4 sm:p-8 shadow-sm transition-all hover:scale-105 hover:shadow-xl min-h-[200px] sm:min-h-[380px]"
        >
          <h2 className="mb-3 sm:mb-8 text-2xl sm:text-4xl font-bold tracking-tight text-[#9F7AEA]">
            HOST
          </h2>
          <div className="relative h-28 sm:h-56 w-full overflow-hidden rounded-xl mt-2 sm:mt-4">
            <img
              src="/img/teacher.png"
              alt="Host"
              className="h-full w-full object-contain"
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

export default function App() {
  return (
    <Suspense fallback={null}>
      <AppContent />
    </Suspense>
  );
}
