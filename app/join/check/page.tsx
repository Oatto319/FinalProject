'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightCircle, ChevronLeft } from 'lucide-react';
import Navbar from '../../navbar/page';
import { resolveAvatar } from '@/lib/avatar';

interface RoomMember { name: string; avatarSeed: number; avatarImage?: string | null; gmail: string; role?: string; }
interface RoomData {
  roomId: string; title: string; description: string; totalMembers: number;
  groupSize: number; deadline?: string | null; template: string; hostName: string; hostAvatarSeed: number; hostAvatarImage?: string | null;
  hostRole?: string; members: RoomMember[];
}

const formatDeadline = (deadline?: string | null) => {
  if (!deadline) return null;
  const d = new Date(deadline);
  const dateLabel = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeLabel = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  return `${dateLabel} เวลา ${timeLabel}`;
};

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

export default function JoinCheckPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatarSeed: number; gmail: string } | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(false);

  const theme = TEMPLATE_THEMES[room?.template ?? ''] ?? DEFAULT_THEME;

  useEffect(() => {
    const userRaw = localStorage.getItem('currentUser');
    if (userRaw) setUser(JSON.parse(userRaw));

    const roomId = localStorage.getItem('enteredRoomId');
    if (roomId) {
      fetch(`/api/rooms/${roomId}`)
        .then((r) => r.json())
        .then((data) => { if (data.room) setRoom(data.room); });
    }
  }, []);

  const handleJoin = async () => {
    if (!user || !room || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${room.roomId}/join`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? 'เข้าร่วมห้องไม่สำเร็จ');
        if (res.status === 403 && data.pending) router.push('/evaluation');
        return;
      }
      const updatedRoom = data.room ?? room;
      // เก็บ currentRoom ไว้ navigate (ใช้ id เพื่อความเข้ากันได้)
      localStorage.setItem('currentRoom', JSON.stringify({ ...updatedRoom, id: updatedRoom.roomId }));
      router.push('/join/myroom');
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
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

      <div className="min-h-screen font-sans flex flex-col items-center relative overflow-hidden" style={{ background: theme.bg }}>
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
                  color: `color-mix(in srgb, ${theme.dark} ${Math.round(s.opacity * 100)}%, ${theme.bg})`,
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
      <main className="relative z-10 w-full max-w-6xl mt-4 px-4 grid grid-cols-1 md:grid-cols-12 gap-6 pb-12">
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-[20px] p-5 sm:p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6 sm:mb-8">
              <div className="w-16 h-16 flex-shrink-0 rounded-full overflow-hidden border-2 border-blue-100">
                <img src={room ? resolveAvatar({ avatarSeed: room.hostAvatarSeed, avatarImage: room.hostAvatarImage }) : '/img/p1.PNG'} alt="Host" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-gray-700">{room?.hostName ?? '...'}</span>
                  <span className="bg-[#8E97B0] text-white text-xs px-2 py-0.5 rounded uppercase font-bold">Host</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${room?.hostRole === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>
                  {room?.hostRole ?? 'host'}
                </span>
              </div>
            </div>
            {room ? (
              <div className="grid grid-cols-2 gap-y-4 text-gray-700">
                <div className="font-bold text-lg col-span-2">{room.title}</div>
                <div className="font-bold text-lg text-gray-500">{room.description}</div>
                <div className="text-right font-bold text-lg text-[#2D3E50]">ID: {room.roomId}</div>
                <div className="font-bold text-lg text-gray-600">จำนวน {room.totalMembers} คน กลุ่มละ {room.groupSize} คน</div>
                <div className="text-right font-bold text-xl text-[#2D3E50]">{room.members.length}/{room.totalMembers}</div>
                {formatDeadline(room.deadline) && (
                  <div className="col-span-2 text-sm font-bold text-red-500">กำหนดส่ง: {formatDeadline(room.deadline)}</div>
                )}
              </div>
            ) : (
              <p className="text-gray-400">ไม่พบข้อมูลห้อง</p>
            )}
          </div>
          <div className="flex gap-4 mt-auto items-center">
            <button onClick={() => router.back()}
              className="w-14 h-14 flex-shrink-0 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all">
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <button onClick={handleJoin} disabled={!room || loading}
              className="flex-1 bg-[#2D3E50] text-white py-4 px-12 rounded-2xl font-bold text-xl shadow-md flex items-center justify-center gap-3 hover:bg-[#1E293B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'กำลังเข้าร่วม...' : 'Join'} <ArrowRightCircle size={24} />
            </button>
          </div>
        </div>

        <div className="md:col-span-7 flex flex-col gap-4">
          <div className="rounded-[20px] p-4 sm:p-6 text-center shadow-[0_18px_40px_rgba(0,0,0,0.45)]" style={{ background: theme.bg, border: `4px solid ${theme.dark}` }}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-widest uppercase" style={{ color: theme.accent }}>{room?.template ?? 'PROGRAMMING'}</h1>
          </div>
          <div className="flex flex-col gap-3">
            {(room?.members ?? []).filter((m) => m.name !== room?.hostName).length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400">ยังไม่มีสมาชิกในห้อง</div>
            ) : (
              (room?.members ?? []).filter((m) => m.name !== room?.hostName).map((member, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-2 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <div className="w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                      <img src={resolveAvatar(member)} alt={member.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 truncate">{member.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${(member.role ?? 'user') === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>{member.role ?? 'user'}</span>
                    </div>
                  </div>
                  <span className="px-3 sm:px-6 py-1.5 rounded-xl font-bold text-white text-xs sm:text-sm bg-[#7096D1] flex-shrink-0">Joined</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      </div>
    </>
  );
}
