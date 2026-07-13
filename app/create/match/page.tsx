'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Copy, Home, X } from 'lucide-react';
import Navbar from '../../navbar/page';
import { resolveAvatar } from '@/lib/avatar';

interface RoomMember { name: string; avatarSeed: number; avatarImage?: string | null; gmail: string; }
interface CurrentRoom {
  id: string; roomId?: string; title: string; description: string;
  totalMembers: number; groupSize: number; template: string;
  hostName: string; hostAvatarSeed: number; hostAvatarImage?: string | null; members: RoomMember[];
}

const MatchPage = () => {
  const router = useRouter();
  const [user, setUser]             = useState<{ name: string; avatarSeed: number; avatarImage?: string | null; role?: string } | null>(null);
  const [room, setRoom]             = useState<CurrentRoom | null>(null);
  const [members, setMembers]       = useState<RoomMember[]>([]);
  const [readyUsers, setReadyUsers] = useState<string[]>([]);
  const [matchMode, setMatchMode]   = useState('');
  const [copied, setCopied]         = useState(false);
  const [kickTarget, setKickTarget] = useState<RoomMember | null>(null);

  const getRoomId = (r: CurrentRoom) => r.roomId ?? r.id;

  const fetchRoom = async (roomId: string) => {
    const res = await fetch(`/api/rooms/${roomId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.room) {
      setMembers(data.room.members ?? []);
      setReadyUsers(data.room.readyUsers ?? []);
      // ใช้ DB matchMode เฉพาะเมื่อเป็นค่าที่ไม่ใช่ default ('auto')
      // หรือเมื่อ localStorage ไม่มีค่า — ป้องกัน default DB override ค่า localStorage
      const pendingRaw = localStorage.getItem('pendingRoom');
      const localMode = pendingRaw ? (JSON.parse(pendingRaw).matchMode ?? '') : '';
      if (data.room.matchMode && data.room.matchMode !== 'auto') {
        setMatchMode(data.room.matchMode);
      } else if (!localMode && data.room.matchMode) {
        setMatchMode(data.room.matchMode);
      }
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));
    const pendingRaw = localStorage.getItem('pendingRoom');
    const pendingMode = pendingRaw ? (JSON.parse(pendingRaw).matchMode ?? '') : '';

    const roomRaw = localStorage.getItem('currentRoom');
    if (roomRaw) {
      const r: CurrentRoom = JSON.parse(roomRaw);
      setRoom(r);
      const roomMode = (r as { matchMode?: string }).matchMode ?? '';
      setMatchMode(roomMode || pendingMode);
      fetchRoom(getRoomId(r));
    }
  }, []);

  useEffect(() => {
    if (!room) return;
    const interval = setInterval(() => fetchRoom(getRoomId(room)), 2000);
    return () => clearInterval(interval);
  }, [room]);

  const handleKick = async () => {
    if (!kickTarget || !room) return;
    const res = await fetch(`/api/rooms/${getRoomId(room)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'kickMember', memberGmail: kickTarget.gmail }),
    });
    if (res.ok) setMembers((prev) => prev.filter((m) => m.gmail !== kickTarget.gmail));
    setKickTarget(null);
  };

  const readyCount   = readyUsers.length;
  const totalMembers = room?.totalMembers ?? members.length;
  const isFull       = members.length >= totalMembers && totalMembers > 0;
  const isAllReady   = isFull && readyCount >= members.length && members.length > 0;

  const handleCopy = () => {
    if (!room) return;
    try { navigator.clipboard.writeText(getRoomId(room)); } catch { const el = document.createElement("textarea"); el.value = getRoomId(room); document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#E5E7EB] font-sans flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-6xl px-4 mt-4 pb-12">
        <div className="bg-[#F8A4A4] rounded-t-[40px] p-6 md:p-8 flex flex-wrap justify-between items-center shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow text-[#4B3E7A] transition-all active:scale-95"
              title="กลับหน้าหลัก"
            >
              <Home size={18} />
            </button>
            <h1 className="text-[#4B3E7A] text-4xl md:text-5xl font-black italic tracking-tighter uppercase">{room?.template ?? 'PROGRAMMING'}</h1>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-3 px-5 py-2.5 rounded-full font-bold text-sm shadow-md transition-all active:scale-95 bg-white text-[#4B3E7A] hover:bg-white/90"
          >
            <span className="text-xl font-black tracking-wider">#{room ? getRoomId(room) : '...'}</span>
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-all ${
              copied ? 'bg-green-400 text-white' : 'bg-[#4B3E7A]/10 text-[#4B3E7A]'
            }`}>
              <Copy size={13} />
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>
        </div>

        <div className="bg-[#D1D5DB]/40 p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 rounded-b-[40px] border-b-8 border-gray-300 shadow-inner">
          <div className="flex flex-col gap-3">
            {members.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400 font-medium">รอนักเรียนเข้าร่วม...</div>
            ) : (
              members.map((member, idx) => {
                const isSelf = member.name === user?.name;
                return (
                <div key={idx} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:scale-[1.01] transition-all border-2 border-transparent hover:border-blue-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-yellow-100 border border-gray-100">
                      <img src={resolveAvatar(member)} alt={member.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-700 leading-tight">{member.name}</p>
                        {isSelf && <span className="bg-[#7096D1] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">คุณ</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase font-medium">นักเรียน</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`px-6 py-1.5 rounded-xl font-bold text-sm min-w-[100px] text-center shadow-sm transition-colors ${readyUsers.includes(member.name) ? 'bg-[#608BC1] text-white' : 'bg-[#C86D6D] text-white'}`}>
                      {readyUsers.includes(member.name) ? 'ready' : 'wait'}
                    </div>
                    {!isSelf && (
                      <button
                        onClick={() => setKickTarget(member)}
                        title="เอาออกจากห้อง"
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all flex-shrink-0"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
                );
              })
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-[20px] p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-sky-200">
                  <img src={user ? resolveAvatar(user) : '/img/p1.PNG'} alt="Host" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800">{user?.name ?? '...'}</p>
                    <span className="bg-[#94A3B8] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-tighter">HOST</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user?.role === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>
                    {user?.role ?? 'host'}
                  </span>
                  {matchMode && (
                    <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${matchMode === 'auto' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      {matchMode === 'auto' ? '⚡ จับคู่อัตโนมัติ' : '🎛 กำหนดเอง'}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xl font-bold text-gray-800">{room?.title ?? '...'}</p>
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

            <div className="flex-1 flex flex-col justify-end">
              {!isFull ? (
                <div className="bg-white rounded-[20px] overflow-hidden flex shadow-sm min-h-[160px] border border-white/50">
                  <div className="flex-[3] flex flex-col items-center justify-center gap-1 px-4">
                    <span className="text-[#4B3E7A] text-4xl font-black italic tracking-tighter uppercase opacity-30 select-none">WAITING</span>
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">รอคนเข้าห้องให้ครบ</span>
                  </div>
                  <div className="flex-[2] bg-gray-400 flex flex-col items-center justify-center text-white">
                    <span className="text-6xl font-black leading-none">{members.length}/{totalMembers}</span>
                    <span className="text-xs font-bold uppercase mt-2 tracking-widest opacity-80">คน</span>
                  </div>
                </div>
              ) : !isAllReady ? (
                <div className="bg-white rounded-[20px] overflow-hidden flex shadow-sm min-h-[160px] border border-white/50">
                  <div className="flex-[3] flex items-center justify-center">
                    <span className="text-[#4B3E7A] text-6xl font-black italic tracking-tighter uppercase opacity-30 select-none">READY</span>
                  </div>
                  <div className="flex-[2] bg-[#7C3AED] flex flex-col items-center justify-center text-white">
                    <span className="text-6xl font-black leading-none">{readyCount}/{totalMembers}</span>
                    <span className="text-xs font-bold uppercase mt-2 tracking-widest opacity-80">Waiting...</span>
                  </div>
                </div>
              ) : (
                <button onClick={() => router.push('/create/matching')}
                  className="w-full relative group transition-transform active:scale-95">
                  <div className="absolute inset-0 bg-[#D97706] rounded-[20px] translate-y-2 group-active:translate-y-1"></div>
                  <div className="relative bg-[#FF8A00] hover:bg-[#FF9D2E] text-white py-10 rounded-[20px] flex items-center justify-center transition-all border-b-4 border-white/20">
                    <h1 className="text-7xl font-black italic tracking-tighter uppercase drop-shadow-md">MATCH!</h1>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {kickTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setKickTarget(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-black text-gray-800 mb-2">เอาสมาชิกออกจากห้อง</p>
            <p className="text-gray-500 text-sm mb-6">เอา <span className="font-bold text-gray-700">{kickTarget.name}</span> ออกจากห้องนี้?</p>
            <div className="flex gap-3">
              <button onClick={() => setKickTarget(null)} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-all">ยกเลิก</button>
              <button onClick={handleKick} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all active:scale-95">เอาออก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchPage;
