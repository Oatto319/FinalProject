'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Home } from 'lucide-react';
import Navbar from '../../navbar/page';
import { resolveAvatar } from '@/lib/avatar';

interface RoomMember { name: string; avatarSeed: number; avatarImage?: string | null; gmail: string; role?: string; }
interface CurrentRoom {
  id: string; roomId?: string; title: string; description: string;
  totalMembers: number; groupSize: number; template: string;
  hostName: string; hostAvatarSeed: number; hostAvatarImage?: string | null; hostRole?: string; members: RoomMember[];
}

// ✅ ธีมสีตาม template ของห้อง (สีอ้างอิงจากหน้า templates / app/create/match)
const TEMPLATE_THEMES: Record<string, { bg: string; dark: string; accent: string; label: string }> = {
  programming:  { bg: '#FFAAAA', dark: '#D87878', accent: '#4F437B', label: 'PROGRAMMING' },
  service:      { bg: '#71EFB8', dark: '#5CC095', accent: '#FF4573', label: 'CUSTOMER / SERVICE' },
  presentation: { bg: '#EAFF48', dark: '#B2C334', accent: '#21871C', label: 'PRESENTATION' },
  design:       { bg: '#8C71EF', dark: '#6D58B9', accent: '#4B3E7A', label: 'DESIGN / CREATIVE' },
};
const DEFAULT_THEME = { bg: '#F8A4A4', dark: '#D87878', accent: '#4B3E7A', label: 'PROGRAMMING' };

// ✅ ข้อความ template ลอยผ่านจอเป็นพื้นหลัง (รูปแบบเดียวกับ app/create/match/page.tsx)
const BACKGROUND_FLOAT_TEXT = [
  { top: '6%',  left: '-10%', fontSize: 'clamp(1.2rem, 14vw, 5rem)',   rotate: '-24deg', opacity: 0.14, drift: 'waveDrift1', duration: '26s', delay: '0s' },
  { top: '20%', left: '-15%', fontSize: 'clamp(1.5rem, 20vw, 8rem)',  rotate: '16deg',  opacity: 0.12, drift: 'waveDrift2', duration: '32s', delay: '-4s' },
  { top: '38%', left: '-10%', fontSize: 'clamp(1rem,   12vw, 4rem)',  rotate: '-8deg',  opacity: 0.16, drift: 'waveDrift3', duration: '22s', delay: '-8s' },
  { top: '56%', left: '-15%', fontSize: 'clamp(1.5rem, 22vw, 9rem)',  rotate: '-18deg', opacity: 0.12, drift: 'waveDrift1', duration: '34s', delay: '-10s' },
  { top: '74%', left: '-10%', fontSize: 'clamp(1.2rem, 16vw, 6rem)',  rotate: '20deg',  opacity: 0.16, drift: 'waveDrift3', duration: '25s', delay: '-6s' },
  { top: '90%', left: '-15%', fontSize: 'clamp(1rem,   12vw, 4.5rem)',rotate: '-30deg', opacity: 0.14, drift: 'waveDrift2', duration: '30s', delay: '-14s' },
];

export default function MyRoomPage() {
  const router = useRouter();
  const [user, setUser]             = useState<{ name: string; avatarSeed: number; avatarImage?: string | null } | null>(null);
  const [room, setRoom]             = useState<CurrentRoom | null>(null);
  const [members, setMembers]       = useState<RoomMember[]>([]);
  const [isReady, setIsReady]       = useState(false);
  const [readyUsers, setReadyUsers] = useState<string[]>([]);
  const [roomDeleted, setRoomDeleted] = useState(false);
  const [copied, setCopied]           = useState(false);

  const getRoomId = (r: CurrentRoom) => r.roomId ?? r.id;

  const theme = TEMPLATE_THEMES[room?.template ?? ''] ?? DEFAULT_THEME;
  const pageBg = `color-mix(in srgb, ${theme.bg} 55%, white)`;

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
      if (checkReadyFor) {
        setIsReady((data.room.readyUsers ?? []).includes(checkReadyFor));
      }
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));

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
    <>
      <style>{`
        @keyframes waveDrift1 {
          0%   { transform: translateX(-10vw) translateY(0vh); }
          50%  { transform: translateX(120vw) translateY(-6vh); }
          100% { transform: translateX(-10vw) translateY(0vh); }
        }

        @keyframes waveDrift2 {
          0%   { transform: translateX(-10vw) translateY(0vh); }
          50%  { transform: translateX(115vw) translateY(8vh); }
          100% { transform: translateX(-10vw) translateY(0vh); }
        }

        @keyframes waveDrift3 {
          0%   { transform: translateX(-10vw) translateY(0vh); }
          50%  { transform: translateX(125vw) translateY(-4vh); }
          100% { transform: translateX(-10vw) translateY(0vh); }
        }
      `}</style>

      <div className="h-dvh font-sans flex flex-col items-center overflow-hidden relative" style={{ background: pageBg }}>
        {/* ✅ เลเยอร์พื้นหลัง template ลอยผ่านจอ */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
        >
          {BACKGROUND_FLOAT_TEXT.map((s, i) => (
            <div
              key={`text-${i}`}
              style={{
                position: 'absolute',
                top: s.top,
                left: s.left,
                transform: `rotate(${s.rotate})`,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  fontSize: s.fontSize,
                  color: `color-mix(in srgb, ${theme.dark} ${Math.round(s.opacity * 100)}%, ${pageBg})`,
                  fontFamily: 'var(--font-luckiest-guy), Arial, sans-serif',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  letterSpacing: '-0.03em',
                  whiteSpace: 'nowrap',
                  animation: `${s.drift} ${s.duration} linear infinite`,
                  animationDelay: s.delay,
                }}
              >
                {theme.label}
              </span>
            </div>
          ))}
        </div>

        <div className="relative z-20 w-full flex justify-center">
          <Navbar bgColor={theme.dark} nameColor="white" />
        </div>
      <div className="relative z-10 flex-1 w-full lg:max-w-6xl lg:px-4 lg:mt-4 flex flex-col min-h-0">

        {/* Header */}
        <div className="lg:rounded-t-[40px] p-4 md:p-8 flex flex-wrap justify-between items-center shadow-[0_18px_40px_rgba(0,0,0,0.45)] gap-4 flex-shrink-0" style={{ background: theme.bg }}>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase" style={{ color: theme.accent }}>{room?.template ?? 'PROGRAMMING'}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              title="กลับหน้าหลัก"
              className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-white/90 transition-all active:scale-95"
              style={{ color: theme.accent }}
            >
              <Home size={20} />
            </button>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-3 px-5 py-2.5 rounded-full font-bold text-sm shadow-md transition-all active:scale-95 bg-white hover:bg-white/90"
              style={{ color: theme.accent }}
            >
              <span className="text-xl font-black tracking-wider">#{room ? getRoomId(room) : '...'}</span>
              <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-all ${
                copied ? 'bg-green-400 text-white' : ''
              }`} style={!copied ? { backgroundColor: `${theme.accent}1A`, color: theme.accent } : undefined}>
                <Copy size={13} />
                <span className="hidden lg:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </span>
            </button>

            {/* Mobile-only: compact ready button */}
            <button
              onClick={handleReady}
              className={`lg:hidden px-4 py-2 rounded-full font-black text-sm uppercase transition-all ${
                isReady
                  ? 'bg-green-500 text-white shadow-[0_4px_0_0_#15803d] hover:shadow-[0_2px_0_0_#15803d] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]'
                  : 'bg-[#7096D1] text-white shadow-[0_4px_0_0_#4A6FA5] hover:shadow-[0_2px_0_0_#4A6FA5] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]'
              }`}
            >
              READY
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-[#E5E7EB] p-4 lg:p-10 flex flex-col lg:flex-row gap-3 lg:gap-8 lg:border-b-8 lg:border-gray-300 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">

          {/* Left: Members */}
          <div className="order-2 lg:order-1 overflow-y-auto flex flex-col gap-3 min-h-0 flex-1">
            {members.filter((m) => m.name !== room?.hostName).length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400 font-medium">รอสมาชิกเข้าร่วม...</div>
            ) : (
              members.filter((m) => m.name !== room?.hostName).map((member, idx) => {
                const isMe = member.name === user?.name;
                const avatarUrl = resolveAvatar(member);
                return (
                  <div key={idx} className={`bg-white rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-2 shadow-sm border-2 ${isMe ? 'border-[#7096D1]' : 'border-transparent'}`}>
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full overflow-hidden bg-yellow-100 border border-gray-100">
                        <img src={avatarUrl} alt={member.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-700 leading-tight truncate">{member.name}</p>
                          {isMe && <span className="bg-[#7096D1] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">คุณ</span>}
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${(member.role ?? 'user') === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>{member.role ?? 'user'}</span>
                      </div>
                    </div>
                    <div className={`px-3 sm:px-6 py-1.5 rounded-xl font-bold text-xs sm:text-sm min-w-[64px] sm:min-w-[100px] text-center shadow-sm flex-shrink-0 ${readyUsers.includes(member.name) ? 'bg-[#608BC1] text-white' : 'bg-[#C86D6D] text-white'}`}>
                      {readyUsers.includes(member.name) ? 'ready' : 'wait'}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Host info + Ready button */}
          <div className="order-1 lg:order-2 flex flex-col gap-6 lg:flex-1">
            <div className="bg-white rounded-[20px] p-5 sm:p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6 sm:mb-8">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-sky-200 flex-shrink-0">
                  <img src={room ? resolveAvatar({ avatarSeed: room.hostAvatarSeed, avatarImage: room.hostAvatarImage }) : '/img/p1.PNG'} alt="Host" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800">{room?.hostName ?? '...'}</p>
                    <span className="bg-[#94A3B8] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-tighter">HOST</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${room?.hostRole === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>
                      {room?.hostRole ?? 'host'}
                    </span>
                  </div>
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
                    <p className="text-3xl font-black leading-none" style={{ color: theme.accent }}>{members.length}/{room?.totalMembers ?? '?'}</p>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleReady}
              className={`hidden lg:block w-full py-5 sm:py-6 md:py-8 rounded-[20px] font-black text-2xl sm:text-3xl md:text-5xl uppercase tracking-widest sm:tracking-[0.2em] text-white transition-all
                ${isReady
                  ? 'bg-green-500 shadow-[0_10px_0_0_#15803d] hover:shadow-[0_5px_0_0_#15803d] hover:translate-y-[5px] active:shadow-none active:translate-y-[10px]'
                  : 'bg-[#7096D1] shadow-[0_10px_0_0_#4A6FA5] hover:shadow-[0_5px_0_0_#4A6FA5] hover:translate-y-[5px] active:shadow-none active:translate-y-[10px]'
                }`}>
              READY
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
    </>
  );
}
