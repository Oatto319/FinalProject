'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Copy, Settings, SlidersHorizontal, Sparkles, Plus, X, Home } from 'lucide-react';
import Navbar from '../../navbar/page';
import { TYPES_BY_TEMPLATE } from '@/lib/type-composition';
import { resolveAvatar } from '@/lib/avatar';
import { typeColor, roleColor } from '@/lib/mbti';
import DeadlinePicker from '../../components/DeadlinePicker';

interface RoomMember { name: string; avatarSeed: number; avatarImage?: string | null; gmail: string; role?: string; }
interface CurrentRoom {
  id: string; roomId?: string; title: string; description: string;
  totalMembers: number; groupSize: number; template: string; deadline?: string | null; matchMode?: string;
  hostName: string; hostAvatarSeed: number; hostAvatarImage?: string | null; members: RoomMember[];
}

/** แปลง ISO date string (UTC จาก DB) ให้เป็น 'YYYY-MM-DDTHH:mm' ตามเขตเวลาไทย สำหรับใส่ค่าเริ่มต้นให้ DeadlinePicker */
const isoToLocalInput = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
};

interface SettingsForm {
  title: string;
  description: string;
  totalMembers: string;
  groupSize: string;
  deadline: string;
  matchMode: string;
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

const ManualPage = () => {
  const router = useRouter();
  const [user, setUser]             = useState<{ name: string; avatarSeed: number; avatarImage?: string | null; role?: string } | null>(null);
  const [room, setRoom]             = useState<CurrentRoom | null>(null);
  const [members, setMembers]       = useState<RoomMember[]>([]);
  const [readyUsers, setReadyUsers] = useState<string[]>([]);
  const [matchMode, setMatchMode]   = useState('');
  const [copied, setCopied]           = useState(false);
  const [showTypeSetting, setShowTypeSetting] = useState(false);
  const [kickTarget, setKickTarget] = useState<RoomMember | null>(null);

  const [showSettings, setShowSettings]       = useState(false);
  const [settingsForm, setSettingsForm]       = useState<SettingsForm | null>(null);
  const [settingsError, setSettingsError]     = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Type Setting popup state
  const [tsTypes, setTsTypes]     = useState(TYPES_BY_TEMPLATE.programming);
  const [tsCounts, setTsCounts]   = useState<Record<string, number>>({});
  const [tsWarning, setTsWarning] = useState('');
  const [memberTypes, setMemberTypes] = useState<Record<string, { code: string; title: string; icon: string }>>({});
  const lastMemberCountRef = useRef(-1);
  const tsLoadedRef = useRef(false);

  const getRoomId = (r: CurrentRoom) => r.roomId ?? r.id;

  const theme = TEMPLATE_THEMES[room?.template ?? ''] ?? DEFAULT_THEME;

  const openSettings = () => {
    if (!room) return;
    setSettingsForm({
      title: room.title ?? '',
      description: room.description ?? '',
      totalMembers: String(room.totalMembers ?? ''),
      groupSize: String(room.groupSize ?? ''),
      deadline: isoToLocalInput(room.deadline),
      matchMode: matchMode || 'selection',
    });
    setSettingsError('');
    setShowSettings(true);
  };

  const handleSaveSettings = async () => {
    if (!room || !settingsForm || settingsLoading) return;
    const { title, description, totalMembers, groupSize, deadline, matchMode: newMode } = settingsForm;

    if (!title.trim() || !description.trim() || !totalMembers || !groupSize) {
      setSettingsError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    const total = parseInt(totalMembers);
    const size = parseInt(groupSize);
    if (!(total >= 1) || !(size >= 1)) {
      setSettingsError('จำนวนคนไม่ถูกต้อง');
      return;
    }
    if (size > total) {
      setSettingsError('จำนวนคนต่อกลุ่ม ต้องไม่มากกว่าจำนวนคนทั้งหมด');
      return;
    }
    if (total < members.length) {
      setSettingsError(`จำนวนคนทั้งหมดต้องไม่น้อยกว่าจำนวนคนที่เข้าร่วมแล้ว (${members.length} คน)`);
      return;
    }

    setSettingsError('');
    setSettingsLoading(true);
    try {
      const res = await fetch(`/api/rooms/${getRoomId(room)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settings',
          title: title.trim(),
          description: description.trim(),
          totalMembers: total,
          groupSize: size,
          deadline: deadline || null,
          matchMode: newMode,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSettingsError(data.error ?? 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
        return;
      }

      const updatedRoom = { ...room, ...data.room, id: getRoomId(room) };
      setRoom(updatedRoom);
      setMatchMode(newMode);
      localStorage.setItem('currentRoom', JSON.stringify(updatedRoom));
      setShowSettings(false);

      // เปลี่ยนกลับเป็นโหมดจับคู่อัตโนมัติ (auto) → ไม่ต้องกำหนดองค์ประกอบ MBTI เองแล้ว กลับไปหน้า match ปกติ
      if (newMode === 'auto') {
        router.push('/create/match');
      }
    } catch {
      setSettingsError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchRoom = async (roomId: string, isHost: boolean) => {
    const res = await fetch(`/api/rooms/${roomId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.room) {
      const newMembers: RoomMember[] = data.room.members ?? [];
      setMembers(newMembers);
      setReadyUsers(data.room.readyUsers ?? []);
      const pendingRaw2 = localStorage.getItem('pendingRoom');
      const localMode2 = pendingRaw2 ? (JSON.parse(pendingRaw2).matchMode ?? '') : '';
      if (data.room.matchMode && data.room.matchMode !== 'auto') {
        setMatchMode(data.room.matchMode);
      } else if (!localMode2 && data.room.matchMode) {
        setMatchMode(data.room.matchMode);
      }
      // Fetch member-types only when member count changes
      if (isHost && newMembers.length !== lastMemberCountRef.current) {
        lastMemberCountRef.current = newMembers.length;
        const typesRes = await fetch(`/api/rooms/${roomId}/member-types?source=members`);
        if (typesRes.ok) {
          const typesData = await typesRes.json();
          setMemberTypes(typesData.types ?? {});
        }
      }

      // โหลด typeComposition จาก DB ครั้งแรกที่ fetch สำเร็จ (ไม่ทับค่าที่ host กำลังแก้อยู่ในรอบ poll ถัดไป)
      if (!tsLoadedRef.current) {
        tsLoadedRef.current = true;
        const savedComposition = data.room.typeComposition as Record<string, number> | undefined;
        if (savedComposition && Object.keys(savedComposition).length > 0) {
          setTsCounts((prev) => ({ ...prev, ...savedComposition }));
        }
      }
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));
    const pendingRaw = localStorage.getItem('pendingRoom');
    const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
    if (pending) setMatchMode(pending.matchMode ?? '');

    const roomRaw = localStorage.getItem('currentRoom');
    if (roomRaw) {
      const r: CurrentRoom = JSON.parse(roomRaw);
      setRoom(r);
      const parsedUser = raw ? JSON.parse(raw) : null;
      const isHost = parsedUser?.name === r.hostName;
      fetchRoom(getRoomId(r), isHost);

      // Init type setting from template (ค่าจริงจะถูกโหลดทับจาก DB ใน fetchRoom เมื่อ fetch สำเร็จ)
      const template = (pending?.template ?? r.template ?? 'programming').toLowerCase();
      const resolvedTypes = TYPES_BY_TEMPLATE[template] ?? TYPES_BY_TEMPLATE.programming;
      setTsTypes(resolvedTypes);
      setTsCounts(Object.fromEntries(resolvedTypes.map((t) => [t.key, 0])));
    }
  }, []);

  useEffect(() => {
    if (!room || !user) return;
    const isHost = user.name === room.hostName;
    const interval = setInterval(() => fetchRoom(getRoomId(room), isHost), 2000);
    return () => clearInterval(interval);
  }, [room, user]);

  const readyCount   = readyUsers.length;
  const totalMembers = room?.totalMembers ?? members.length;
  const isFull       = members.length >= totalMembers && totalMembers > 0;
  const isAllReady   = isFull && readyCount >= members.length && members.length > 0;

  const tsTotal     = Object.values(tsCounts).reduce((a, b) => a + b, 0);
  const tsGroupSize = room?.groupSize ?? 4;

  const tsIncrement = (key: string) => {
    if (tsTotal >= tsGroupSize) return;
    setTsCounts((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    setTsWarning('');
  };

  const tsDecrement = (key: string) => {
    if ((tsCounts[key] ?? 0) <= 0) return;
    setTsCounts((prev) => ({ ...prev, [key]: prev[key] - 1 }));
    setTsWarning('');
  };

  const tsSave = async () => {
    if (tsTotal < tsGroupSize) {
      setTsWarning(`ยังเลือกไม่ครบ (${tsTotal}/${tsGroupSize})`);
      return;
    }
    if (!room) return;
    const res = await fetch(`/api/rooms/${getRoomId(room)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'settings', typeComposition: tsCounts }),
    });
    if (!res.ok) { setTsWarning('บันทึกไม่สำเร็จ กรุณาลองใหม่'); return; }
    setTsWarning('');
    setShowTypeSetting(false);
    if (isAllReady) router.push('/create/matching');
  };

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

  const handleCopy = () => {
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

      <div className="h-dvh font-sans flex flex-col items-center overflow-hidden relative" style={{ background: theme.bg }}>
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
      <div className="relative z-10 flex-1 w-full lg:max-w-6xl lg:px-4 lg:mt-4 flex flex-col min-h-0">
        <div className="lg:rounded-t-[40px] p-4 md:p-8 flex flex-wrap justify-between items-center shadow-[0_18px_40px_rgba(0,0,0,0.45)] gap-4 flex-shrink-0" style={{ background: theme.bg }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="hidden lg:flex w-10 h-10 bg-white/80 hover:bg-white rounded-full items-center justify-center shadow transition-all active:scale-95"
              style={{ color: theme.accent }}
              title="กลับหน้าหลัก"
            >
              <Home size={18} />
            </button>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase" style={{ color: theme.accent }}>{room?.template ?? 'PROGRAMMING'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="lg:hidden w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-all active:scale-95"
              style={{ color: theme.accent }}
              title="กลับหน้าหลัก"
            >
              <Home size={18} />
            </button>
            <button
              onClick={handleCopy}
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
            <button
              onClick={openSettings}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-white/90 active:scale-95 transition-all"
              style={{ color: theme.accent }}
              title="ตั้งค่าห้อง"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={() => setShowTypeSetting(true)}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-white/90 active:scale-95 transition-all"
              style={{ color: theme.accent }}
              title="ตั้งค่าประเภทกลุ่ม (Type Settings)"
            >
              <SlidersHorizontal size={20} />
            </button>

            {/* Mobile-only: compact match button */}
            {isAllReady && (
              <button
                onClick={() => { if (tsTotal <= 0) { setShowTypeSetting(true); return; } router.push('/create/matching'); }}
                className="lg:hidden bg-[#FF8A00] text-white px-4 py-2 rounded-full font-black text-sm uppercase shadow-[0_4px_0_0_#D97706] hover:shadow-[0_2px_0_0_#D97706] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all"
              >
                MATCH!
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-[#E5E7EB] p-4 lg:p-10 flex flex-col lg:flex-row gap-3 lg:gap-8 lg:border-b-8 lg:border-gray-300 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
          <div className="order-2 lg:order-1 overflow-y-auto flex flex-col gap-3 min-h-0 flex-1">
            {members.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400 font-medium">รอนักเรียนเข้าร่วม...</div>
            ) : (
              members.map((member, idx) => {
                const isSelf = member.name === user?.name;
                return (
                <div key={idx} className="bg-white rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-2 shadow-sm cursor-pointer hover:scale-[1.01] transition-all border-2 border-transparent hover:border-blue-200">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full overflow-hidden bg-yellow-100 border border-gray-100">
                      <img src={resolveAvatar(member)} alt={member.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-700 leading-tight truncate">{member.name}</p>
                        {isSelf && <span className="bg-[#7096D1] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">คุณ</span>}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${(member.role ?? 'user') === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>{member.role ?? 'user'}</span>
                      {user?.name === room?.hostName && memberTypes[member.gmail ?? member.name] && (
                        <div className="flex items-center gap-1 mt-1">
                          <span
                            className="text-[10px] font-black px-1.5 py-0.5 rounded"
                            style={{ color: typeColor(memberTypes[member.gmail ?? member.name].code), backgroundColor: `${typeColor(memberTypes[member.gmail ?? member.name].code)}1A` }}
                          >
                            {memberTypes[member.gmail ?? member.name].code}
                          </span>
                          <span className="text-[10px] font-bold" style={{ color: theme.accent }}>{memberTypes[member.gmail ?? member.name].title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`px-3 sm:px-6 py-1.5 rounded-xl font-bold text-xs sm:text-sm min-w-[64px] sm:min-w-[100px] text-center shadow-sm transition-colors ${readyUsers.includes(member.name) ? 'bg-[#608BC1] text-white' : 'bg-[#C86D6D] text-white'}`}>
                      {readyUsers.includes(member.name) ? 'ready' : 'wait'}
                    </div>
                    {user?.name === room?.hostName && !isSelf && (
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

          <div className="order-1 lg:order-2 flex flex-col gap-6 lg:flex-1">
            <div className="bg-white rounded-[20px] p-5 sm:p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6 sm:mb-8">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-sky-200 flex-shrink-0">
                  <img src={user ? resolveAvatar(user) : '/img/p1.PNG'} alt="Host" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800">{user?.name ?? '...'}</p>
                    <span className="bg-[#94A3B8] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-tighter">HOST</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user?.role === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>
                      {user?.role ?? 'host'}
                    </span>
                    {matchMode && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${matchMode === 'auto' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {matchMode === 'auto' ? 'จับคู่อัตโนมัติ' : 'กำหนดเอง'}
                      </span>
                    )}
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
                    <p className="text-3xl font-black leading-none" style={{ color: theme.accent }}>{members.length}/{totalMembers}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex flex-1 flex-col justify-end">
              {!isFull ? (
                <div className="bg-white rounded-[20px] overflow-hidden flex shadow-sm min-h-[120px] sm:min-h-[160px] border border-white/50">
                  <div className="flex-[3] flex flex-col items-center justify-center gap-1 px-2 sm:px-4">
                    <span className="text-xl sm:text-2xl md:text-4xl font-black italic tracking-tighter uppercase opacity-30 select-none" style={{ color: theme.accent }}>WAITING</span>
                    <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center">รอคนเข้าห้องให้ครบ</span>
                  </div>
                  <div className="flex-[2] bg-gray-400 flex flex-col items-center justify-center text-white">
                    <span className="text-2xl sm:text-3xl md:text-6xl font-black leading-none">{members.length}/{totalMembers}</span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase mt-2 tracking-widest opacity-80">คน</span>
                  </div>
                </div>
              ) : !isAllReady ? (
                <div className="bg-white rounded-[20px] overflow-hidden flex shadow-sm min-h-[120px] sm:min-h-[160px] border border-white/50">
                  <div className="flex-[3] flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl md:text-6xl font-black italic tracking-tighter uppercase opacity-30 select-none" style={{ color: theme.accent }}>READY</span>
                  </div>
                  <div className="flex-[2] bg-[#7C3AED] flex flex-col items-center justify-center text-white">
                    <span className="text-2xl sm:text-3xl md:text-6xl font-black leading-none">{readyCount}/{totalMembers}</span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase mt-2 tracking-widest opacity-80">Waiting...</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (tsTotal <= 0) { setShowTypeSetting(true); return; }
                    router.push('/create/matching');
                  }}
                  className="w-full relative group transition-transform active:scale-95">
                  <div className="absolute inset-0 bg-[#D97706] rounded-[20px] translate-y-2 group-active:translate-y-1"></div>
                  <div className="relative bg-[#FF8A00] hover:bg-[#FF9D2E] text-white py-6 sm:py-8 md:py-10 rounded-[20px] flex items-center justify-center transition-all border-b-4 border-white/20">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black italic tracking-tighter uppercase drop-shadow-md">MATCH!</h1>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Type Setting Popup */}
      {showTypeSetting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] w-full max-w-md mx-4 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-[#2D3E50] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white text-2xl font-black uppercase tracking-tight">Type Settings</h2>
              <button
                onClick={() => { setShowTypeSetting(false); setTsWarning(''); }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 bg-[#C4C9E2]">
              <p className="text-center text-xl font-black text-[#5B5EA6] mb-5">
                {tsGroupSize} <span className="font-bold">:Members</span>
              </p>

              <div className="bg-[#E8EAF3] rounded-2xl p-3 sm:p-5">
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {/* Icons row */}
                  {tsTypes.map((t) => (
                    <div key={t.key} className="flex flex-col items-center gap-1">
                      <div className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-full" style={{ backgroundColor: `${roleColor(t.icon)}22` }}>
                        <img src={t.icon} alt={t.label} className="w-5 h-5 sm:w-7 sm:h-7 object-contain" />
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-black text-[#3D3D6B] text-center leading-tight">{t.label}</span>
                      {t.subtitle && (
                        <span className="text-[7px] sm:text-[8px] font-bold px-1 rounded" style={{ backgroundColor: `${roleColor(t.icon)}22`, color: roleColor(t.icon) }}>{t.subtitle}</span>
                      )}
                    </div>
                  ))}

                  {/* Plus buttons row */}
                  {tsTypes.map((t) => (
                    <div key={t.key + '-plus'} className="flex justify-center">
                      <button
                        onClick={() => tsIncrement(t.key)}
                        disabled={tsTotal >= tsGroupSize}
                        className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#7C6FCD] text-white flex items-center justify-center shadow hover:bg-[#6B5FB8] active:scale-95 transition-all disabled:opacity-40"
                      >
                        <Plus size={14} strokeWidth={3} className="sm:hidden" />
                        <Plus size={18} strokeWidth={3} className="hidden sm:block" />
                      </button>
                    </div>
                  ))}

                  {/* Count boxes row */}
                  {tsTypes.map((t) => (
                    <div key={t.key + '-count'} className="flex justify-center">
                      <button
                        onClick={() => tsDecrement(t.key)}
                        className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-[#8B8FAD] text-white text-sm sm:text-lg font-black flex items-center justify-center shadow active:scale-95 transition-all select-none"
                      >
                        {tsCounts[t.key] ?? 0}
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-center text-xs font-semibold text-[#5B5EA6] mt-3">
                  รวม {tsTotal} / {tsGroupSize}
                </p>
              </div>

              {tsWarning && (
                <p className="text-center text-xs text-orange-600 font-semibold mt-3">{tsWarning}</p>
              )}

              <button
                onClick={tsSave}
                className="w-full mt-5 bg-[#2D3E50] text-white py-3 rounded-2xl font-bold text-lg shadow hover:bg-[#1E293B] active:scale-95 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && settingsForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto" onClick={() => !settingsLoading && setShowSettings(false)}>
          <div className="bg-white rounded-[24px] p-6 w-full max-w-lg shadow-2xl my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-xl font-black text-gray-800">ตั้งค่าห้อง</p>
              <button
                onClick={() => !settingsLoading && setShowSettings(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* ชื่อกิจกรรม */}
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1.5 block">ชื่อกิจกรรม</label>
                <input
                  type="text" maxLength={100}
                  value={settingsForm.title}
                  onChange={(e) => setSettingsForm((p) => p && { ...p, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                />
              </div>

              {/* คำอธิบาย */}
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1.5 block">คำอธิบาย</label>
                <textarea
                  rows={2} maxLength={500}
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm((p) => p && { ...p, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 font-semibold resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                />
              </div>

              {/* จำนวนคน */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block">จำนวนคนทั้งหมด</label>
                  <input
                    type="number" min={1} max={300}
                    value={settingsForm.totalMembers}
                    onChange={(e) => setSettingsForm((p) => p && { ...p, totalMembers: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 font-semibold text-center focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block">จำนวนคนต่อกลุ่ม</label>
                  <input
                    type="number" min={1} max={50}
                    value={settingsForm.groupSize}
                    onChange={(e) => setSettingsForm((p) => p && { ...p, groupSize: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 font-semibold text-center focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  />
                </div>
              </div>

              {/* วันเวลาสิ้นสุด */}
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1.5 block">วันและเวลาสิ้นสุด (ไม่บังคับ)</label>
                <DeadlinePicker
                  value={settingsForm.deadline}
                  onChange={(deadline) => setSettingsForm((p) => p && { ...p, deadline })}
                />
                {settingsForm.deadline && (
                  <button
                    type="button"
                    onClick={() => setSettingsForm((p) => p && { ...p, deadline: '' })}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600 mt-2 transition-colors"
                  >
                    ล้างวันที่
                  </button>
                )}
              </div>

              {/* โหมดการจับคู่ */}
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1.5 block">โหมดการจับกลุ่ม</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSettingsForm((p) => p && { ...p, matchMode: 'auto' })}
                    className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 font-bold text-sm transition-all border-2 ${
                      settingsForm.matchMode === 'auto'
                        ? 'bg-[#E39B56] text-white border-[#E39B56]'
                        : 'bg-gray-50 text-gray-500 border-transparent hover:border-gray-200'
                    }`}
                  >
                    <Sparkles size={18} />
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsForm((p) => p && { ...p, matchMode: 'selection' })}
                    className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 font-bold text-sm transition-all border-2 ${
                      settingsForm.matchMode === 'selection'
                        ? 'bg-[#9C7BC9] text-white border-[#9C7BC9]'
                        : 'bg-gray-50 text-gray-500 border-transparent hover:border-gray-200'
                    }`}
                  >
                    <SlidersHorizontal size={18} />
                    Manual
                  </button>
                </div>
                {settingsForm.matchMode === 'auto' && (
                  <p className="text-[11px] text-gray-400 mt-2">เปลี่ยนเป็นโหมดนี้แล้วจะพากลับไปหน้าจับคู่อัตโนมัติ</p>
                )}
              </div>
            </div>

            {settingsError && (
              <p className="text-red-500 font-bold text-sm mt-4">⚠️ {settingsError}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                disabled={settingsLoading}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={settingsLoading}
                className="flex-1 py-3 rounded-2xl bg-[#4B3E7A] text-white font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-60"
              >
                {settingsLoading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
};

export default ManualPage;