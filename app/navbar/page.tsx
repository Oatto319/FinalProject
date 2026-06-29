'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LucideMessageCircle } from 'lucide-react';
import { resolveAvatar } from '@/lib/avatar';
import { notificationsEnabled, isMatchSeen } from '../components/notifications';

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
  const [hasNotification, setHasNotification] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      router.replace('/login');
    } else {
      setUser(JSON.parse(raw));
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const checkMatchNotification = async () => {
      if (!notificationsEnabled()) { setHasNotification(false); return; }
      const roomRaw = localStorage.getItem('currentRoom');
      if (!roomRaw) { setHasNotification(false); return; }
      const room = JSON.parse(roomRaw);
      const roomId = room.roomId ?? room.id;
      if (!roomId) return;
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (!res.ok) return;
        const data = await res.json();
        setHasNotification(!!data.room?.matchDone && !isMatchSeen(roomId));
      } catch { /* เครือข่ายขัดข้อง — ไม่ต้องโชว์ badge */ }
    };

    checkMatchNotification();
    const interval = setInterval(checkMatchNotification, 10000);
    return () => clearInterval(interval);
  }, [user]);

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

        <button
          onClick={() => router.push('/join/myprojects')}
          title="ทีมของฉัน"
          className="relative bg-green-500 p-3 rounded-full text-white shadow-lg hover:scale-105 transition-transform active:scale-95"
        >
          <LucideMessageCircle fill="currentColor" size={26} />
          {hasNotification && (
            <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>
      </div>
    </header>
  );
}
