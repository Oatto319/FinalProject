'use client';

import { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import Navbar from '../../navbar/page';

interface RoomMember {
  name: string;
  avatarSeed: number;
  gmail: string;
}

interface CurrentRoom {
  id: string;
  title: string;
  description: string;
  totalMembers: number;
  groupSize: number;
  template: string;
  hostName: string;
  hostAvatarSeed: number;
  members: RoomMember[];
}

export default function MyRoomPage() {
  const [user, setUser] = useState<{ name: string; avatarSeed: number } | null>(null);
  const [room, setRoom] = useState<CurrentRoom | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [readyUsers, setReadyUsers] = useState<string[]>([]);

  const loadData = () => {
    const roomRaw = localStorage.getItem('currentRoom');
    if (roomRaw) {
      const r: CurrentRoom = JSON.parse(roomRaw);
      setRoom(r);
      // Load latest members from rooms registry
      const roomsRaw = localStorage.getItem('rooms');
      if (roomsRaw) {
        const rooms = JSON.parse(roomsRaw);
        const latest: CurrentRoom = rooms[r.id];
        if (latest) setMembers(latest.members ?? []);
      }
    }
    const stored = JSON.parse(localStorage.getItem('readyUsers') || '[]') as string[];
    setReadyUsers(stored);
  };

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) {
      const u = JSON.parse(raw);
      setUser(u);
      const stored = JSON.parse(localStorage.getItem('readyUsers') || '[]') as string[];
      setIsReady(stored.includes(u.name));
    }
    loadData();
  }, []);

  useEffect(() => {
    window.addEventListener('storage', loadData);
    const interval = setInterval(loadData, 2000);
    return () => {
      window.removeEventListener('storage', loadData);
      clearInterval(interval);
    };
  }, []);

  const handleReady = () => {
    if (!user) return;
    const newStatus = !isReady;
    setIsReady(newStatus);
    const stored = JSON.parse(localStorage.getItem('readyUsers') || '[]') as string[];
    const updated = newStatus
      ? stored.includes(user.name) ? stored : [...stored, user.name]
      : stored.filter((n) => n !== user.name);
    localStorage.setItem('readyUsers', JSON.stringify(updated));
    setReadyUsers(updated);
    window.dispatchEvent(new StorageEvent('storage', { key: 'readyUsers' }));
  };

  const copyToClipboard = () => {
    if (!room) return;
    const el = document.createElement('textarea');
    el.value = room.id;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      <Navbar />

      {/* Main Content Area */}
      <main className="w-full max-w-6xl mt-8 px-4 pb-12">
        <div className="bg-white rounded-[40px] overflow-hidden shadow-sm min-h-[700px]">

          {/* Top Banner Section */}
          <div className="bg-[#FFA4A4] p-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-[#4A4E69] text-5xl font-black tracking-widest uppercase">
              {room?.template ?? 'PROGRAMMING'}
            </h1>
            <div className="flex items-center gap-3 bg-[#4A4E69]/10 px-6 py-2 rounded-2xl">
              <span className="text-[#4A4E69] text-4xl font-black">#{room?.id ?? '...'}</span>
              <button
                onClick={copyToClipboard}
                className="bg-white/80 p-2 rounded-full hover:bg-white transition-colors text-[#4A4E69]"
              >
                <Copy size={24} />
              </button>
            </div>
          </div>

          {/* Content Columns */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-8 bg-gray-200/50 min-h-[600px]">

            {/* Left Column: Member List */}
            <div className="md:col-span-6 flex flex-col gap-3">
              {members.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-gray-400">
                  รอสมาชิกเข้าร่วม...
                </div>
              ) : (
                members.map((member, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed}`} alt={member.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{member.name}</h4>
                        <p className="text-xs text-gray-400">นักเรียน</p>
                      </div>
                    </div>
                    <button className={`px-6 py-1.5 rounded-xl font-bold text-white text-sm ${readyUsers.includes(member.name) ? 'bg-[#7096D1]' : 'bg-[#C76A6A]'}`}>
                      {readyUsers.includes(member.name) ? 'Ready' : 'Wait'}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Right Column: Room Details & Ready Button */}
            <div className="md:col-span-6 flex flex-col gap-6">
              {/* Room Info Card */}
              <div className="bg-white rounded-[30px] p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-100 bg-blue-50">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${room?.hostAvatarSeed ?? 0}`} alt="Host" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-gray-700">{room?.hostName ?? '...'}</span>
                      <span className="bg-[#8E97B0] text-white text-xs px-2 py-0.5 rounded uppercase font-bold">Host</span>
                    </div>
                    <p className="text-gray-400 text-sm">อาจารย์</p>
                  </div>
                </div>

                <div className="space-y-4 text-gray-700">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="font-bold text-lg">{room?.title ?? '...'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="font-bold text-lg text-gray-500">{room?.description ?? ''}</span>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">เข้าร่วมแล้ว:</p>
                      <p className="font-bold text-xl text-[#2D3E50]">{members.length}/{room?.totalMembers ?? '?'}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="font-bold text-lg text-gray-600">
                      {room ? `จำนวน ${room.totalMembers} คน กลุ่มละ ${room.groupSize} คน` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* READY Button */}
              <button
                onClick={handleReady}
                className={`mt-auto w-full py-8 rounded-[30px] font-black text-5xl uppercase tracking-[0.2em] text-white transition-all
                  ${isReady
                    ? 'bg-green-500 shadow-[0_10px_0_0_#15803d] hover:shadow-[0_5px_0_0_#15803d] hover:translate-y-[5px] active:shadow-none active:translate-y-[10px]'
                    : 'bg-[#7096D1] shadow-[0_10px_0_0_#4A6FA5] hover:shadow-[0_5px_0_0_#4A6FA5] hover:translate-y-[5px] active:shadow-none active:translate-y-[10px]'
                  }`}
              >
                {isReady ? 'READY ✓' : 'READY'}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
