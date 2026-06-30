'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LucideMessageCircle } from 'lucide-react';
import { resolveAvatar } from '@/lib/avatar';
import {
  notificationsEnabled, isMatchSeen, isMsgNew, markMatchSeen, markMsgSeen,
} from '../components/notifications';

interface ApiNotification {
  type: 'match' | 'message';
  roomId: string;
  roomTitle: string;
  isHost: boolean;
  groupId?: number;
  sender?: string;
  text?: string;
  msgTime?: string;
}

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
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

    const fetchNotifications = async () => {
      if (!notificationsEnabled()) { setNotifications([]); return; }
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      } catch { /* network error — keep previous state */ }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown when clicking outside the wrapper div
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    if (showPanel) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showPanel]);

  const isUnseen = (n: ApiNotification): boolean => {
    if (n.type === 'match') return !isMatchSeen(n.roomId);
    if (n.type === 'message' && n.groupId !== undefined && n.msgTime) {
      return isMsgNew(n.roomId, n.groupId, n.msgTime);
    }
    return false;
  };

  const hasUnread = notifications.some(isUnseen);
  const unreadCount = notifications.filter(isUnseen).length;

  const handleNotifClick = (n: ApiNotification) => {
    if (n.type === 'match') markMatchSeen(n.roomId);
    if (n.type === 'message' && n.groupId !== undefined && n.msgTime) {
      markMsgSeen(n.roomId, n.groupId, n.msgTime);
    }
    localStorage.setItem('currentRoom', JSON.stringify({ roomId: n.roomId, id: n.roomId, title: n.roomTitle }));
    setShowPanel(false);
    if (n.type === 'match') {
      router.push(n.isHost ? '/create/group' : '/join/myteam');
    } else {
      router.push('/join/myteam');
    }
  };

  if (!user) return null;

  const avatarUrl = resolveAvatar(user);
  const displaySubtitle = subtitle ?? user.role ?? user.gender;

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 shadow-sm" style={{ backgroundColor: bgColor ?? 'white' }}>
      <div className="w-full flex items-center justify-between">
        {/* Profile button */}
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
              displaySubtitle === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'
            }`}>
              {displaySubtitle}
            </span>
          </div>
        </button>

        {/* Notification button + dropdown */}
        <div className="relative" ref={wrapperRef}>
          <button
            onClick={() => setShowPanel((v) => !v)}
            title="การแจ้งเตือน"
            className="relative bg-green-500 p-3 rounded-full text-white shadow-lg hover:scale-105 transition-transform active:scale-95"
          >
            <LucideMessageCircle fill="currentColor" size={26} />
            {hasUnread && (
              <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>

          {showPanel && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="font-bold text-gray-800 text-sm">การแจ้งเตือน</p>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} ใหม่
                  </span>
                )}
              </div>

              {/* Notification list */}
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">ไม่มีการแจ้งเตือน</div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifications.map((n, i) => {
                    const unseen = isUnseen(n);
                    return (
                      <button
                        key={i}
                        onClick={() => handleNotifClick(n)}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${unseen ? 'bg-green-50' : ''}`}
                      >
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-lg ${
                          n.type === 'match' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {n.type === 'match' ? '🎉' : '💬'}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {n.type === 'match' ? (
                            <>
                              <p className={`text-sm font-semibold leading-tight truncate ${unseen ? 'text-gray-800' : 'text-gray-400'}`}>
                                จับกลุ่มเสร็จแล้ว!
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{n.roomTitle}</p>
                            </>
                          ) : (
                            <>
                              <p className={`text-sm font-semibold leading-tight ${unseen ? 'text-gray-800' : 'text-gray-400'}`}>
                                {n.sender} ส่งข้อความ
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{n.text}</p>
                              <p className="text-xs text-gray-300 mt-0.5 truncate">ใน {n.roomTitle}</p>
                            </>
                          )}
                        </div>

                        {/* Unread dot */}
                        {unseen && (
                          <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-1.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="px-4 py-2 border-t border-gray-100">
                <button
                  onClick={() => { setShowPanel(false); router.push('/join/myprojects'); }}
                  className="w-full text-xs text-center text-green-600 font-semibold hover:underline py-1"
                >
                  ดูทีมทั้งหมด →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
