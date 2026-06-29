'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LucideMessageCircle } from 'lucide-react';
import { resolveAvatar } from '@/lib/avatar';

interface User {
  name: string;
  gender: string;
  avatarSeed: number;
  avatarImage?: string | null;
  role?: string;
}

interface NavbarProps {
  subtitle?: string;
  bgColor?: string;
  nameColor?: string;
}

export default function Navbar({ subtitle, bgColor, nameColor }: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      router.replace('/login');
    } else {
      setUser(JSON.parse(raw));
    }
  }, [router]);

  if (!user) return null;

  const avatarUrl = resolveAvatar(user);

  const displaySubtitle = subtitle ?? user.role ?? user.gender;

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 shadow-sm" style={{ backgroundColor: bgColor ?? 'white' }}>
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => router.push('/navbar/edit')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden bg-orange-100 border-2 border-orange-200">
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-contain" />
          </div>
          <div className="text-left">
            <p className="text-lg leading-tight" style={{ color: nameColor ?? '#1f2937' }}>{user.name}</p>
            <span className={`text-sm px-2 py-0.5 rounded-full ${
              displaySubtitle === 'host'
                ? 'bg-purple-100 text-purple-600'
                : 'bg-orange-100 text-orange-500'
            }`}>
              {displaySubtitle}
            </span>
          </div>
        </button>

        <button className="bg-green-500 p-3 rounded-full text-white shadow-lg hover:scale-105 transition-transform active:scale-95">
          <LucideMessageCircle fill="currentColor" size={26} />
        </button>
      </div>
    </header>
  );
}
