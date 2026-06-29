'use client';

import { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import Navbar from '../../navbar/page';
import { resolveAvatar } from '@/lib/avatar';

interface RoomMember { name: string; avatarSeed: number; avatarImage?: string | null; gmail: string; }
interface CurrentRoom {
  id: string; roomId?: string; title: string; description: string;
  totalMembers: number; groupSize: number; template: string;
  hostName: string; hostAvatarSeed: number; hostAvatarImage?: string | null; members: RoomMember[];
  readyUsers?: string[];
}

const WaitingRoom = () => {
  const [user, setUser]           = useState<{ name: string; avatarSeed: number; avatarImage?: string | null } | null>(null);
  const [room, setRoom]           = useState<CurrentRoom | null>(null);
  const [members, setMembers]     = useState<RoomMember[]>([]);
  const [readyUsers, setReadyUsers] = useState<string[]>([]);

  const getRoomId = (r: CurrentRoom) => r.roomId ?? r.id;

  const fetchRoom = async (roomId: string) => {
    const res = await fetch(`/api/rooms/${roomId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.room) {
      setMembers(data.room.members ?? []);
      setReadyUsers(data.room.readyUsers ?? []);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));

    const roomRaw = localStorage.getItem('currentRoom');
    if (roomRaw) {
      const r: CurrentRoom = JSON.parse(roomRaw);
      setRoom(r);
      fetchRoom(getRoomId(r));
    }
  }, []);

  useEffect(() => {
    if (!room) return;
    const interval = setInterval(() => fetchRoom(getRoomId(room)), 2000);
    return () => clearInterval(interval);
  }, [room]);

  const handleCopy = () => {
    if (!room) return;
    try { navigator.clipboard.writeText(getRoomId(room)); } catch { const el = document.createElement("textarea"); el.value = getRoomId(room); document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
  };

  const readyCount = readyUsers.length;

  return (
    <div className="min-h-screen bg-[#E5E7EB] font-sans flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-5xl mt-4 px-4 pb-12 bg-white rounded-[24px] shadow-xl overflow-hidden flex flex-col">
        <div className="bg-[#F8A4A4] p-6 md:px-10 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[#4B3E7A] text-4xl md:text-5xl font-black italic tracking-tighter">{room?.template ?? 'PROGRAMMING'}</h1>
          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl">
            <span className="text-[#4B3E7A] text-2xl md:text-3xl font-black">#{room ? getRoomId(room) : '...'}</span>
            <button onClick={handleCopy} className="p-2 bg-white rounded-xl shadow-sm text-sky-400 hover:bg-gray-50 transition-colors">
              <Copy size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 md:p-10 bg-[#E5E7EB] grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            {members.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400 font-medium">รอนักเรียนเข้าร่วม...</div>
            ) : (
              members.map((member, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-3 flex items-center justify-between shadow-sm border border-transparent hover:border-white transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-yellow-100 border-2 border-white">
                      <img src={resolveAvatar(member)} alt={member.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-700 leading-tight">{member.name}</h4>
                      <p className="text-xs text-gray-400">นักเรียน</p>
                    </div>
                  </div>
                  <div className={`px-6 py-1.5 rounded-xl font-bold text-sm text-white shadow-sm ${readyUsers.includes(member.name) ? 'bg-[#6B8DCC]' : 'bg-[#C96C6C]'}`}>
                    {readyUsers.includes(member.name) ? 'Ready' : 'wait'}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-[20px] p-8 shadow-sm flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-sky-200">
                  <img src={user ? resolveAvatar(user) : '/img/p1.PNG'} alt="Host" className="w-full h-full object-contain" />
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
                    <p className="text-xl font-black text-[#4B3E7A]">{members.length}/{room?.totalMembers ?? '?'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] overflow-hidden shadow-sm flex h-32 md:h-40">
              <div className="flex-[3] flex items-center justify-center p-4">
                <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter text-[#6C63FF]/80 uppercase">READY</h1>
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
