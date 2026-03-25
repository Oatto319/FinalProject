'use client';

import { useRouter } from 'next/navigation';
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

const MatchPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatarSeed: number } | null>(null);
  const [room, setRoom] = useState<CurrentRoom | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [readyUsers, setReadyUsers] = useState<string[]>([]);
  const [matchMode, setMatchMode] = useState<string>('');

  const loadData = () => {
    const roomRaw = localStorage.getItem('currentRoom');
    if (roomRaw) {
      const r: CurrentRoom = JSON.parse(roomRaw);
      setRoom(r);
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
    const pendingRaw = localStorage.getItem('pendingRoom');
    if (pendingRaw) {
      const pending = JSON.parse(pendingRaw);
      setMatchMode(pending.matchMode ?? '');
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

  const readyCount = readyUsers.length;
  const totalMembers = room?.totalMembers ?? members.length;
  const isAllReady = members.length > 0 && readyCount >= members.length;

  const handleCopy = () => {
    if (!room) return;
    const el = document.createElement('textarea');
    el.value = room.id;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  return (
    <div className="min-h-screen bg-[#E5E7EB] font-sans flex flex-col items-center">
      <Navbar />

      <div className="w-full max-w-6xl px-4 mt-8 pb-12">
        {/* ส่วนหัววิชาสีชมพู */}
        <div className="bg-[#F8A4A4] rounded-t-[40px] p-6 md:p-8 flex flex-wrap justify-between items-center shadow-sm gap-4">
          <h1 className="text-[#4B3E7A] text-4xl md:text-5xl font-black italic tracking-tighter uppercase">
            {room?.template ?? 'PROGRAMMING'}
          </h1>
          <div className="flex items-center gap-4 bg-white/20 px-6 py-2 rounded-2xl backdrop-blur-sm">
            <span className="text-[#4B3E7A] text-2xl md:text-3xl font-black">#{room?.id ?? '...'}</span>
            <button
              onClick={handleCopy}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
            >
              <Copy className="text-sky-500" size={20} />
            </button>
          </div>
        </div>

        {/* ส่วนเนื้อหารายชื่อและสถานะ */}
        <div className="bg-[#D1D5DB]/40 p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 rounded-b-[40px] border-b-8 border-gray-300 shadow-inner">

          {/* รายชื่อนักเรียนทางด้านซ้าย */}
          <div className="flex flex-col gap-3">
            {members.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400 font-medium">
                รอนักเรียนเข้าร่วม...
              </div>
            ) : (
              members.map((member, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:scale-[1.01] transition-all border-2 border-transparent hover:border-blue-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-yellow-100 border border-gray-100">
                      <img src={member.avatarSeed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed + 100}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`} alt={member.name} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-700 leading-tight">{member.name}</h4>
                      <p className="text-[10px] text-gray-400 uppercase font-medium">นักเรียน</p>
                    </div>
                  </div>
                  <div className={`
                    px-6 py-1.5 rounded-xl font-bold text-sm min-w-[100px] text-center shadow-sm transition-colors
                    ${readyUsers.includes(member.name) ? 'bg-[#608BC1] text-white' : 'bg-[#C86D6D] text-white'}
                  `}>
                    {readyUsers.includes(member.name) ? 'ready' : 'wait'}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* รายละเอียดห้องและปุ่ม Match ทางด้านขวา */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-[32px] p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-sky-200">
                  <img src={user?.avatarSeed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatarSeed + 100}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`} alt="Host" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800">{user?.name ?? '...'}</h3>
                    <span className="bg-[#94A3B8] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-tighter">HOST</span>
                  </div>
                  <p className="text-xs text-gray-400">อาจารย์</p>
                  {matchMode && (
                    <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${matchMode === 'auto' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      {matchMode === 'auto' ? '⚡ จับคู่อัตโนมัติ' : '🎛 กำหนดเอง'}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">{room?.title ?? '...'}</h2>
                <div className="grid grid-cols-2 gap-y-4 text-sm font-medium">
                  <div className="text-gray-500">
                    <p>{room?.description ?? ''}</p>
                    <p className="italic">{room ? `จำนวน ${room.totalMembers} คน กลุ่มละ ${room.groupSize} คน` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">เข้าร่วมแล้ว:</p>
                    <p className="text-3xl font-black text-[#4B3E7A] leading-none">{members.length}/{totalMembers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ส่วนแสดงผลเงื่อนไข */}
            <div className="flex-1 flex flex-col justify-end">
              {!isAllReady ? (
                /* กรณีที่มีคนยังไม่พร้อม */
                <div className="bg-white rounded-[32px] overflow-hidden flex shadow-sm min-h-[160px] border border-white/50">
                  <div className="flex-[3] flex items-center justify-center">
                    <span className="text-[#4B3E7A] text-6xl font-black italic tracking-tighter uppercase opacity-30 select-none">
                      READY
                    </span>
                  </div>
                  {/* --- แก้: แสดง readyCount จริงจาก localStorage --- */}
                  <div className="flex-[2] bg-[#7C3AED] flex flex-col items-center justify-center text-white">
                    <span className="text-6xl font-black leading-none">{readyCount}/{members.length || '?'}</span>
                    <span className="text-xs font-bold uppercase mt-2 tracking-widest opacity-80">Waiting...</span>
                  </div>
                </div>
              ) : (
                /* กรณีที่ทุกคนพร้อมแล้ว (MATCH) */
                <button
                  onClick={() => router.push('/create/matching')}
                  className="w-full relative group transition-transform active:scale-95">
                  <div className="absolute inset-0 bg-[#D97706] rounded-[32px] translate-y-2 group-active:translate-y-1"></div>
                  <div className="relative bg-[#FF8A00] hover:bg-[#FF9D2E] text-white py-10 rounded-[32px] flex items-center justify-center transition-all border-b-4 border-white/20">
                    <h1 className="text-7xl font-black italic tracking-tighter uppercase drop-shadow-md">
                      MATCH
                    </h1>
                  </div>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default MatchPage;