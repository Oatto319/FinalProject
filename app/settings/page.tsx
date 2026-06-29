'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import Navbar from '../navbar/page';
import { NOTIFICATIONS_ENABLED_KEY } from '../components/notifications';

export default function SettingsPage() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    setNotificationsEnabled(localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== 'false');
  }, []);

  const toggleNotifications = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(next));
  };

  return (
    <div className="min-h-screen bg-gray-200 font-sans flex flex-col items-center">
      <Navbar />
      <main className="w-full max-w-2xl mt-6 px-4 pb-12">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-sm hover:bg-gray-50 transition-all active:scale-95"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <h1 className="text-2xl font-black text-gray-800">Settings</h1>
        </div>

        <div className="bg-white rounded-[20px] p-6 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EDE9FF] flex items-center justify-center text-[#4B3E7A] flex-shrink-0">
              <Bell size={18} />
            </div>
            <div>
              <p className="font-bold text-gray-800">การแจ้งเตือน</p>
              <p className="text-xs text-gray-400">แจ้งเตือนที่ไอคอนแชทเมื่อห้องของคุณถูกจับกลุ่มแล้ว</p>
            </div>
          </div>
          <button
            onClick={toggleNotifications}
            aria-label="toggle notifications"
            className={`w-14 h-8 rounded-full transition-all relative flex-shrink-0 ${notificationsEnabled ? 'bg-[#608BC1]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${notificationsEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </main>
    </div>
  );
}
