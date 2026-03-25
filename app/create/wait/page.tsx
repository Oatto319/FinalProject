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

const WaitingRoom = () => {
  const [user, setUser] = useState<{ name: string; avatarSeed: number } | null>(null);
  const [room, setRoom] = useState<CurrentRoom | null>(null);
  const [readyUsers, setReadyUsers] = useState<string[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);

  const loadRoomData = () => {
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
    if (raw) setUser(JSON.parse(raw));
    loadRoomData();
  }, []);

  useEffect(() => {
    const interval = setInterval(loadRoomData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    if (!room) return;
    const el = document.createElement('textarea');
    el.value = room.id;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  const readyCount = readyUsers.length;

  return (
    <div className="min-h-screen bg-[#E5E7EB] font-sans flex flex-col items-center">
      <Navbar />

      <div className="w-full max-w-5xl mt-8 px-4 pb-12 bg-white rounded-[40px] shadow-xl overflow-hidden flex flex-col">
        {/* Header Pink Section */}
        <div className="bg-[#F8A4A4] p-6 md:px-10 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[#4B3E7A] text-4xl md:text-5xl font-black italic tracking-tighter">
            {room?.template ?? 'PROGRAMMING'}
          </h1>
          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl">
            <span className="text-[#4B3E7A] text-2xl md:text-3xl font-black">#{room?.id ?? '...'}</span>
            <button
              onClick={handleCopy}
              className="p-2 bg-white rounded-xl shadow-sm text-sky-400 hover:bg-gray-50 transition-colors"
            >
              <Copy size={20} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 md:p-10 bg-[#E5E7EB] grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left: Members List */}
          <div className="flex flex-col gap-3">
            {members.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400 font-medium">
                รอนักเรียนเข้าร่วม...
              </div>
            ) : (
              members.map((member, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-3 flex items-center justify-between shadow-sm border border-transparent hover:border-white transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-yellow-100 border-2 border-white">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed}`}
                        alt={member.name}
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-700 leading-tight">{member.name}</h4>
                      <p className="text-xs text-gray-400">นักเรียน</p>
                    </div>
                  </div>
                  <div className={`px-6 py-1.5 rounded-xl font-bold text-sm text-white shadow-sm
                    ${readyUsers.includes(member.name) ? 'bg-[#6B8DCC]' : 'bg-[#C96C6C]'}
                  `}>
                    {readyUsers.includes(member.name) ? 'Ready' : 'wait'}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Info & Status */}
          <div className="flex flex-col gap-6">
            {/* Room Info Card */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm flex flex-col gap-6 relative">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-sky-200">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.avatarSeed ?? 0}`}
                    alt="Host"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-700">{user?.name ?? '...'}</h3>
                    <span className="bg-[#7B85A4] text-[10px] text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Host</span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium">อาจารย์</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-[#4B3E7A]">{room?.title ?? '...'}</h2>
                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium italic">{room?.description ?? ''}</p>
                    <p className="text-sm text-gray-500 font-medium italic mt-1">
                      {room ? `จำนวน ${room.totalMembers} คน กลุ่มละ ${room.groupSize} คน` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 font-medium">เข้าร่วมแล้ว:</p>
                    <p className="text-xl font-black text-[#4B3E7A]">
                      {members.length}/{room?.totalMembers ?? '?'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ready Status Big Card */}
            <div className="bg-white rounded-[32px] overflow-hidden shadow-sm flex h-32 md:h-40">
              <div className="flex-[3] flex items-center justify-center p-4">
                <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter text-[#6C63FF]/80 uppercase">
                  READY
                </h1>
              </div>
              <div className="flex-[2] bg-[#7559B8] flex flex-col items-center justify-center text-white p-4">
                <span className="text-4xl md:text-5xl font-black">{readyCount}/{members.length || '?'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
