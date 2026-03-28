'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LucideMessageCircle } from 'lucide-react';

interface User {
  name: string;
  gender: string;
  avatarSeed: number;
  role?: string;
}

interface NavbarProps {
  subtitle?: string;
}

export default function Navbar({ subtitle }: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      router.replace('/login');
    } else {
      setUser(JSON.parse(raw));
    }
  }, [router]);

  useEffect(() => {
    if (!showMenu) return;
    const handleClick = () => setShowMenu(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showMenu]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  if (!user) return null;

  const avatarUrl = user.avatarSeed === 0
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatarSeed + 100}`;

  const displaySubtitle = subtitle ?? user.role ?? user.gender;

  return (
    <header className="w-full flex items-center justify-between bg-white p-6 shadow-sm">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        <div className="relative flex items-center gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden bg-orange-100 border-2 border-orange-200">
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <h2 className="font-bold text-2xl text-gray-800 leading-tight">{user.name}</h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                displaySubtitle === 'host'
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-orange-100 text-orange-500'
              }`}>
                {displaySubtitle}
              </span>
            </div>
          </button>

          {showMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-20 left-0 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[200px]"
            >
              <button
                onClick={() => { setShowMenu(false); router.push('/navbar/edit'); }}
                className="w-full flex items-center gap-3 px-6 py-4 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                แก้ไขโปรไฟล์
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-6 py-4 text-red-500 font-bold hover:bg-red-50 transition-colors text-left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>

        <button className="bg-green-500 p-4 rounded-full text-white shadow-lg hover:scale-105 transition-transform active:scale-95">
          <LucideMessageCircle fill="currentColor" size={32} />
        </button>
      </div>
    </header>
  );
}
