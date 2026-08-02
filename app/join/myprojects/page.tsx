'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, CheckCircle2, Clock, Trash2, AlertCircle } from 'lucide-react';
import Navbar from '../../navbar/page';
import { resolveAvatar } from '@/lib/avatar';

interface RoomData {
  roomId: string; title: string; description: string; totalMembers: number;
  groupSize: number; template: string; hostName: string; hostAvatarSeed: number; hostAvatarImage?: string | null;
  hostRole?: string; members: { name: string; avatarSeed: number; avatarImage?: string | null; gmail: string }[];
  matchDone?: boolean; matchMode?: string; createdAt?: string;
  evalStatus?: 'pending' | 'done';
}

const TEMPLATE_COLORS: Record<string, string> = {
  programming: '#FFAAAA',
  service: '#71EFB8',
  presentation: '#EAFF48',
  design: '#8C71EF',
};

// ✅ ธีมสีตามโหมดของหน้า — Team ใช้สีปุ่ม Team, Evaluate ใช้สีปุ่ม Evaluate (อ้างอิงจาก app/page.tsx)
const PAGE_THEMES = {
  team:     { bg: '#7F5CFF', navbar: '#5B3FD4', floatColor: '#F5F5F5', label: 'TEAM' },
  evaluate: { bg: '#FFAD60', navbar: '#E8854A', floatColor: '#A05A20', label: 'EVALUATE' },
};

// ✅ ข้อความลอยผ่านจอเป็นพื้นหลัง
const BACKGROUND_FLOAT_TEXT = [
  { top: '6%',  left: '-10%', fontSize: 'clamp(1.2rem, 14vw, 5rem)',   rotate: '-24deg', opacity: 0.12, drift: 'waveDrift1', duration: '26s', delay: '0s' },
  { top: '20%', left: '-15%', fontSize: 'clamp(1.5rem, 20vw, 8rem)',  rotate: '16deg',  opacity: 0.10, drift: 'waveDrift2', duration: '32s', delay: '-4s' },
  { top: '38%', left: '-10%', fontSize: 'clamp(1rem,   12vw, 4rem)',  rotate: '-8deg',  opacity: 0.14, drift: 'waveDrift3', duration: '22s', delay: '-8s' },
  { top: '56%', left: '-15%', fontSize: 'clamp(1.5rem, 22vw, 9rem)',  rotate: '-18deg', opacity: 0.10, drift: 'waveDrift1', duration: '34s', delay: '-10s' },
  { top: '74%', left: '-10%', fontSize: 'clamp(1.2rem, 16vw, 6rem)',  rotate: '20deg',  opacity: 0.14, drift: 'waveDrift3', duration: '25s', delay: '-6s' },
  { top: '90%', left: '-15%', fontSize: 'clamp(1rem,   12vw, 4.5rem)',rotate: '-30deg', opacity: 0.12, drift: 'waveDrift2', duration: '30s', delay: '-14s' },
];

// ✅ รูป crown.PNG ลอยแทรกในเลเยอร์เดียวกัน (แสดงเฉพาะโหมด Team)
const BACKGROUND_FLOAT_CROWN = [
  { top: '14%', left: '-10%', size: '5rem',   rotate: '-15deg', opacity: 0.16, drift: 'waveDrift2', duration: '28s', delay: '-2s' },
  { top: '46%', left: '-15%', size: '3.5rem', rotate: '20deg',  opacity: 0.13, drift: 'waveDrift1', duration: '31s', delay: '-9s' },
  { top: '65%', left: '-10%', size: '5.5rem', rotate: '-10deg', opacity: 0.15, drift: 'waveDrift3', duration: '24s', delay: '-5s' },
  { top: '84%', left: '-15%', size: '4.2rem', rotate: '12deg',  opacity: 0.12, drift: 'waveDrift2', duration: '27s', delay: '-12s' },
];

function MyProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEvaluateMode = searchParams.get('mode') === 'evaluate';
  const theme = isEvaluateMode ? PAGE_THEMES.evaluate : PAGE_THEMES.team;

  const [user, setUser]             = useState<{ name: string; avatarSeed: number; role?: string; gmail?: string } | null>(null);
  const [joinedRooms, setJoinedRooms] = useState<RoomData[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<RoomData | null>(null);
  const [deleteInput, setDeleteInput]   = useState('');
  const [deleteError, setDeleteError]   = useState('');
  const [isExiting, setIsExiting]       = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return;
    const u = JSON.parse(raw);
    setUser(u);

    const url = isEvaluateMode ? '/api/evaluations/rooms' : '/api/myrooms';
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      })
      .then((data) => setJoinedRooms(data.rooms ?? []))
      .catch(() => setJoinedRooms([]));
  }, [isEvaluateMode]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteInput !== deleteTarget.title) { setDeleteError('ชื่อห้องไม่ตรง กรุณาพิมพ์ใหม่'); return; }

    const res = await fetch(`/api/rooms/${deleteTarget.roomId}`, { method: 'DELETE' });
    if (!res.ok) { setDeleteError('เกิดข้อผิดพลาด ไม่สามารถลบห้องได้ กรุณาลองใหม่'); return; }
    setJoinedRooms((prev) => prev.filter((r) => r.roomId !== deleteTarget.roomId));
    setDeleteTarget(null); setDeleteInput(''); setDeleteError('');
  };

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => router.push('/'), 300);
  };

  const handleSelectRoom = (room: RoomData) => {
    localStorage.setItem('currentRoom', JSON.stringify({ ...room, id: room.roomId }));
    const isHost = room.hostName === user?.name;
    if (isHost) {
      if (room.matchDone) {
        router.push('/create/group');
      } else if (room.matchMode === 'selection') {
        router.push('/create/manual');
      } else {
        router.push('/create/match');
      }
    } else {
      router.push(room.matchDone ? '/join/myteam' : '/join/myroom');
    }
  };

  return (
    <div
      className="h-dvh font-sans flex flex-col items-center overflow-hidden relative"
      style={{ background: theme.bg }}
    >
      <style>{`
        @keyframes slideUpIn { from { opacity: 0; transform: translateY(48px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDownOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(48px); } }

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

      {/* ✅ เลเยอร์พื้นหลังลอยผ่านจอ — ข้อความตามธีม + crown เฉพาะโหมด Team */}
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
                color: `color-mix(in srgb, ${theme.floatColor} ${Math.round(s.opacity * 100)}%, ${theme.bg})`,
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

        {!isEvaluateMode && BACKGROUND_FLOAT_CROWN.map((c, i) => (
          <div
            key={`crown-${i}`}
            style={{
              position: 'absolute',
              top: c.top,
              left: c.left,
              transform: `rotate(${c.rotate})`,
            }}
          >
            <img
              src="/img/crown.PNG"
              alt=""
              style={{
                display: 'inline-block',
                height: c.size,
                width: 'auto',
                opacity: c.opacity,
                animation: `${c.drift} ${c.duration} linear infinite`,
                animationDelay: c.delay,
              }}
            />
          </div>
        ))}
      </div>

      <div className="relative z-20 w-full">
        <Navbar bgColor={theme.navbar} nameColor="white" />
      </div>

      <main className="relative z-10 flex-1 overflow-hidden w-full max-w-5xl px-4 flex flex-col sm:flex-row sm:items-start gap-3 pt-0 sm:pt-4 pb-4">

        {/* Back Button — desktop only */}
        <button onClick={handleBack}
          className="hidden sm:flex flex-shrink-0 mt-2 w-12 h-12 bg-white rounded-full items-center justify-center text-gray-600 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all">
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>

        <div className="flex-1 overflow-y-auto h-full pb-2">
            {joinedRooms.length === 0 ? (
              <div className={`bg-white rounded-[24px] p-6 sm:p-8 md:p-12 shadow-sm flex flex-col items-center gap-4 text-gray-400 ${isExiting ? 'animate-[slideDownOut_0.3s_ease-in_forwards]' : 'animate-[slideUpIn_0.4s_ease-out]'}`}>
                <div className="text-6xl">{isEvaluateMode ? '📋' : '📭'}</div>
                <p className="font-bold text-lg">{isEvaluateMode ? 'ยังไม่มีกลุ่มที่สิ้นสุดแล้ว' : 'ยังไม่มีห้องที่เข้าร่วม'}</p>
                <p className="text-sm">{isEvaluateMode ? 'กลุ่มที่จับแล้วและหมดเวลาจะแสดงที่นี่' : 'กด Join เพื่อเข้าร่วมห้องแรกของคุณ'}</p>
                {!isEvaluateMode && (
                  <button onClick={() => router.push('/join/roomid')}
                    className="mt-2 bg-[#2D3E50] text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-700 transition-all active:scale-95">
                    Join ห้องใหม่
                  </button>
                )}
              </div>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 ${isExiting ? 'animate-[slideDownOut_0.3s_ease-in_forwards]' : 'animate-[slideUpIn_0.4s_ease-out]'}`}>
                {joinedRooms.map((room) => {
                  const isHost = room.hostName === user?.name;
                  const templateColor = TEMPLATE_COLORS[room.template] ?? '#D1D5DB';
                  return (
                    <div key={room.roomId} onClick={() => handleSelectRoom(room)}
                      className="bg-white rounded-[20px] shadow-sm overflow-hidden cursor-pointer hover:brightness-95 transition-all active:scale-[0.98]">

                      {/* Template header */}
                      <div className="px-5 py-3" style={{ backgroundColor: templateColor }}>
                        <span className="text-xs font-black uppercase tracking-widest text-white/80">{room.template}</span>
                      </div>

                      {/* Card body */}
                      <div className="p-5">
                        {/* Host profile */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-20 h-20 rounded-full overflow-hidden bg-sky-200 flex-shrink-0">
                            <img src={resolveAvatar({ avatarSeed: room.hostAvatarSeed, avatarImage: room.hostAvatarImage })} alt={room.hostName} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-800 leading-tight">{room.hostName}</p>
                              {isHost && <span className="bg-[#94A3B8] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">HOST</span>}
                            </div>
                            {(() => {
                              const role = isHost ? (user?.role ?? room.hostRole ?? 'host') : (room.hostRole ?? 'host');
                              return (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${role === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>
                                  {role}
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Room info */}
                        <p className="font-bold text-gray-800 text-base mb-1">{room.title}</p>
                        <p className="text-gray-500 text-sm mb-3 leading-relaxed">{room.description}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">{room.totalMembers} คน · กลุ่มละ {room.groupSize} คน</p>
                          <p className="text-xl font-black text-[#4B3E7A]">{room.members.length}/{room.totalMembers}</p>
                        </div>

                        {/* Status + Delete */}
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                          {isEvaluateMode ? (
                            room.evalStatus === 'done' ? (
                              <span className="flex items-center gap-1 text-green-500 text-xs font-bold"><CheckCircle2 size={12} />ประเมินแล้ว</span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-500 text-xs font-bold"><AlertCircle size={12} />ยังไม่ได้ประเมิน</span>
                            )
                          ) : room.matchDone ? (
                            <span className="flex items-center gap-1 text-green-500 text-xs font-bold"><CheckCircle2 size={12} />จับกลุ่มแล้ว</span>
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-500 text-xs font-bold"><Clock size={12} />รอ Match</span>
                          )}
                          {!isEvaluateMode && isHost ? (
                            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(room); setDeleteInput(''); setDeleteError(''); }}
                              className="flex items-center gap-1.5 text-red-400 text-xs font-bold hover:text-red-600 transition-colors">
                              <Trash2 size={13} /> ลบห้อง
                            </button>
                          ) : <span />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Back Button — mobile only, moved to bottom, scrolls with content */}
            <button onClick={handleBack}
              className="sm:hidden mt-4 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all">
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
        </div>
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] w-full max-w-md shadow-2xl p-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><Trash2 size={20} className="text-red-500" /></div>
              <p className="text-xl font-black text-gray-800">ลบห้อง</p>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              การลบห้องนี้จะไม่สามารถย้อนกลับได้ กรุณาพิมพ์ชื่อห้อง{' '}
              <span className="font-black text-gray-800">&ldquo;{deleteTarget.title}&rdquo;</span> เพื่อยืนยัน
            </p>
            <input type="text" value={deleteInput} onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleDeleteConfirm()}
              placeholder={deleteTarget.title} autoFocus
              className="w-full border-2 border-gray-200 rounded-2xl py-3 px-5 text-gray-800 font-medium focus:outline-none focus:border-red-400 transition-colors" />
            {deleteError && <p className="text-red-500 text-sm font-medium -mt-2">{deleteError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setDeleteTarget(null); setDeleteInput(''); setDeleteError(''); }}
                className="flex-1 py-3 rounded-2xl text-gray-500 font-bold hover:bg-gray-100 transition-colors">ยกเลิก</button>
              <button onClick={handleDeleteConfirm} disabled={deleteInput !== deleteTarget.title}
                className="flex-1 py-3 rounded-2xl font-bold text-white transition-colors bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">ลบห้อง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyProjectsPage() {
  return (
    <Suspense>
      <MyProjectsContent />
    </Suspense>
  );
}