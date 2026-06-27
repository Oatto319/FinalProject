'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import Navbar from '../../navbar/page';

interface RoomMember { name: string; avatarSeed: number; gmail: string; }
interface CurrentRoom {
  id: string; roomId?: string; title: string; description: string;
  totalMembers: number; groupSize: number; template: string;
  hostName: string; hostAvatarSeed: number; hostRole?: string; members: RoomMember[];
}

export default function MyRoomPage() {
  const router = useRouter();
  const [user, setUser]             = useState<{ name: string; avatarSeed: number } | null>(null);
  const [room, setRoom]             = useState<CurrentRoom | null>(null);
  const [members, setMembers]       = useState<RoomMember[]>([]);
  const [isReady, setIsReady]       = useState(false);
  const [readyUsers, setReadyUsers] = useState<string[]>([]);
  const [matchMode, setMatchMode]   = useState('');
  const [roomDeleted, setRoomDeleted] = useState(false);
  const [copied, setCopied]           = useState(false);

  const getRoomId = (r: CurrentRoom) => r.roomId ?? r.id;

  const fetchRoom = async (roomId: string, checkReadyFor?: string) => {
    const res = await fetch(`/api/rooms/${roomId}`);
    if (!res.ok) {
      setRoomDeleted(true);
      localStorage.removeItem('currentRoom');
      return;
    }
    const data = await res.json();
    if (data.room) {
      if (data.room.matchDone) {
        router.push('/join/myteam');
        return;
      }
      setMembers(data.room.members ?? []);
      setReadyUsers(data.room.readyUsers ?? []);
      if (data.room.matchMode) setMatchMode(data.room.matchMode);
      if (checkReadyFor) {
        setIsReady((data.room.readyUsers ?? []).includes(checkReadyFor));
      }
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));

    const pendingRaw = localStorage.getItem('pendingRoom');
    if (pendingRaw) setMatchMode(JSON.parse(pendingRaw).matchMode ?? '');

    const roomRaw = localStorage.getItem('currentRoom');
    if (roomRaw) {
      const r: CurrentRoom = JSON.parse(roomRaw);
      setRoom(r);
      const u = JSON.parse(localStorage.getItem('currentUser') ?? '{}');
      fetchRoom(getRoomId(r), u.name);
    }
  }, []);

  useEffect(() => {
    if (!room) return;
    const interval = setInterval(() => {
      const u = JSON.parse(localStorage.getItem('currentUser') ?? '{}');
      fetchRoom(getRoomId(room), u.name);
    }, 2000);
    return () => clearInterval(interval);
  }, [room]);

  const handleReady = async () => {
    if (!user || !room) return;
    const newStatus = !isReady;
    setIsReady(newStatus);
    try {
      const res = await fetch(`/api/rooms/${getRoomId(room)}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isReady: newStatus }),
      });
      const data = await res.json();
      setReadyUsers(data.readyUsers ?? []);
    } catch {
      setIsReady(!newStatus); // rollback
    }
  };

  const copyToClipboard = () => {
    if (!room) return;
    try { navigator.clipboard.writeText(getRoomId(room)); } catch { const el = document.createElement("textarea"); el.value = getRoomId(room); document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#E5E7EB] font-sans flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-6xl px-4 mt-4 pb-12">

        {/* Header */}
        <div className="bg-[#F8A4A4] rounded-t-[40px] p-6 md:p-8 flex flex-wrap justify-between items-center shadow-sm gap-4">
          <h1 className="text-[#4B3E7A] text-4xl md:text-5xl font-black italic tracking-tighter uppercase">{room?.template ?? 'PROGRAMMING'}</h1>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-3 px-5 py-2.5 rounded-full font-bold text-sm shadow-md transition-all active:scale-95 bg-white text-[#4B3E7A] hover:bg-white/90"
          >
            <span className="text-xl font-black tracking-wider">#{room ? getRoomId(room) : '...'}</span>
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-all ${copied ? 'bg-green-400 text-white' : 'bg-[#4B3E7A]/10 text-[#4B3E7A]'}`}>
              <Copy size={13} />
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#D1D5DB]/40 p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 rounded-b-[40px] border-b-8 border-gray-300 shadow-inner">

          {/* Left: Members */}
          <div className="flex flex-col gap-3">
            {members.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400 font-medium">รอสมาชิกเข้าร่วม...</div>
            ) : (
              members.map((member, idx) => {
                const isMe = member.name === user?.name;
                const avatarUrl = `/img/p${member.avatarSeed || 1}.PNG`;
                return (
                  <div key={idx} className={`bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border-2 ${isMe ? 'border-[#7096D1]' : 'border-transparent'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-yellow-100 border border-gray-100">
                        <img src={avatarUrl} alt={member.name} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-700 leading-tight">{member.name}</p>
                          {isMe && <span className="bg-[#7096D1] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">คุณ</span>}
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium">นักเรียน</p>
                      </div>
                    </div>
                    <div className={`px-6 py-1.5 rounded-xl font-bold text-sm min-w-[100px] text-center shadow-sm ${readyUsers.includes(member.name) ? 'bg-[#608BC1] text-white' : 'bg-[#C86D6D] text-white'}`}>
                      {readyUsers.includes(member.name) ? 'ready' : 'wait'}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Host info + Ready button */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-[20px] p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-sky-200">
                  <img src={`/img/p${room?.hostAvatarSeed || 1}.PNG`} alt="Host" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800">{room?.hostName ?? '...'}</p>
                    <span className="bg-[#94A3B8] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-tighter">HOST</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${room?.hostRole === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>
                    {room?.hostRole ?? 'host'}
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
                    <p className="text-3xl font-black text-[#4B3E7A] leading-none">{members.length}/{room?.totalMembers ?? '?'}</p>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleReady}
              className={`mt-auto w-full py-8 rounded-[20px] font-black text-5xl uppercase tracking-[0.2em] text-white transition-all
                ${isReady
                  ? 'bg-green-500 shadow-[0_10px_0_0_#15803d] hover:shadow-[0_5px_0_0_#15803d] hover:translate-y-[5px] active:shadow-none active:translate-y-[10px]'
                  : 'bg-[#7096D1] shadow-[0_10px_0_0_#4A6FA5] hover:shadow-[0_5px_0_0_#4A6FA5] hover:translate-y-[5px] active:shadow-none active:translate-y-[10px]'
                }`}>
              {isReady ? 'READY ✓' : 'READY'}
            </button>
          </div>

        </div>
      </div>

      {roomDeleted && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] w-full max-w-sm p-8 flex flex-col items-center gap-5 shadow-2xl">
            <div className="text-5xl">🗑️</div>
            <h2 className="text-xl font-black text-gray-800 text-center">ห้องนี้ถูกลบแล้ว</h2>
            <p className="text-gray-500 text-sm text-center">ผู้สร้างห้องได้ลบห้องนี้ออกไปแล้ว</p>
            <button onClick={() => router.push('/')}
              className="w-full bg-[#2D3E50] text-white py-3 rounded-2xl font-bold hover:bg-slate-700 transition-all active:scale-95">
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
