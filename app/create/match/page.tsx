'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Copy, Home, X, Settings, Sparkles, SlidersHorizontal } from 'lucide-react';
import Navbar from '../../navbar/page';
import { resolveAvatar } from '@/lib/avatar';
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

const MatchPage = () => {
  const router = useRouter();
  const [user, setUser]             = useState<{ name: string; avatarSeed: number; avatarImage?: string | null; role?: string } | null>(null);
  const [room, setRoom]             = useState<CurrentRoom | null>(null);
  const [members, setMembers]       = useState<RoomMember[]>([]);
  const [readyUsers, setReadyUsers] = useState<string[]>([]);
  const [matchMode, setMatchMode]   = useState('');
  const [copied, setCopied]         = useState(false);
  const [kickTarget, setKickTarget] = useState<RoomMember | null>(null);

  const [showSettings, setShowSettings]     = useState(false);
  const [settingsForm, setSettingsForm]     = useState<SettingsForm | null>(null);
  const [settingsError, setSettingsError]   = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  const getRoomId = (r: CurrentRoom) => r.roomId ?? r.id;

  const openSettings = () => {
    if (!room) return;
    setSettingsForm({
      title: room.title ?? '',
      description: room.description ?? '',
      totalMembers: String(room.totalMembers ?? ''),
      groupSize: String(room.groupSize ?? ''),
      deadline: isoToLocalInput(room.deadline),
      matchMode: matchMode || 'auto',
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

      // เปลี่ยนเป็นโหมดกำหนดเอง (selection) → ต้องไปตั้งค่าองค์ประกอบ MBTI ของกลุ่มต่อ
      if (newMode === 'selection') {
        router.push('/create/manual');
      }
    } catch {
      setSettingsError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSettingsLoading(false);
    }
  };

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
    <div className="h-dvh bg-[#E5E7EB] font-sans flex flex-col items-center overflow-hidden">
      <Navbar />
      <div className="flex-1 w-full lg:max-w-6xl lg:px-4 lg:mt-4 flex flex-col min-h-0">
        <div className="bg-[#F8A4A4] lg:rounded-t-[40px] p-4 md:p-8 flex flex-wrap justify-between items-center shadow-sm gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="hidden lg:flex w-10 h-10 bg-white/80 hover:bg-white rounded-full items-center justify-center shadow text-[#4B3E7A] transition-all active:scale-95"
              title="กลับหน้าหลัก"
            >
              <Home size={18} />
            </button>
            <h1 className="text-[#4B3E7A] text-4xl md:text-5xl font-black italic tracking-tighter uppercase">{room?.template ?? 'PROGRAMMING'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="lg:hidden w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow text-[#4B3E7A] transition-all active:scale-95"
              title="กลับหน้าหลัก"
            >
              <Home size={18} />
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-3 px-5 py-2.5 rounded-full font-bold text-sm shadow-md transition-all active:scale-95 bg-white text-[#4B3E7A] hover:bg-white/90"
            >
              <span className="text-xl font-black tracking-wider">#{room ? getRoomId(room) : '...'}</span>
              <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-all ${
                copied ? 'bg-green-400 text-white' : 'bg-[#4B3E7A]/10 text-[#4B3E7A]'
              }`}>
                <Copy size={13} />
                <span className="hidden lg:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </span>
            </button>

            <button
              onClick={openSettings}
              disabled={!room}
              title="ตั้งค่าห้อง"
              className="w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow text-[#4B3E7A] transition-all active:scale-95 disabled:opacity-50"
            >
              <Settings size={18} />
            </button>

            {/* Mobile-only: compact match button */}
            {isAllReady && (
              <button
                onClick={() => router.push('/create/matching')}
                className="lg:hidden bg-[#FF8A00] text-white px-4 py-2 rounded-full font-black text-sm uppercase shadow-[0_4px_0_0_#D97706] hover:shadow-[0_2px_0_0_#D97706] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all"
              >
                MATCH!
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-[#D1D5DB]/40 p-4 lg:p-10 flex flex-col lg:flex-row gap-3 lg:gap-8 lg:border-b-8 lg:border-gray-300 shadow-inner">
          <div className="order-2 lg:order-1 overflow-y-auto flex flex-col gap-3 min-h-0 flex-1">
            {members.filter((m) => m.name !== room?.hostName).length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400 font-medium">รอนักเรียนเข้าร่วม...</div>
            ) : (
              members.filter((m) => m.name !== room?.hostName).map((member, idx) => {
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
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`px-3 sm:px-6 py-1.5 rounded-xl font-bold text-xs sm:text-sm min-w-[64px] sm:min-w-[100px] text-center shadow-sm transition-colors ${readyUsers.includes(member.name) ? 'bg-[#608BC1] text-white' : 'bg-[#C86D6D] text-white'}`}>
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
                    <p className="text-3xl font-black text-[#4B3E7A] leading-none">{members.length}/{totalMembers}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex flex-1 flex-col justify-end">
              {!isFull ? (
                <div className="bg-white rounded-[20px] overflow-hidden flex shadow-sm min-h-[120px] sm:min-h-[160px] border border-white/50">
                  <div className="flex-[3] flex flex-col items-center justify-center gap-1 px-2 sm:px-4">
                    <span className="text-[#4B3E7A] text-xl sm:text-2xl md:text-4xl font-black italic tracking-tighter uppercase opacity-30 select-none">WAITING</span>
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
                    <span className="text-[#4B3E7A] text-2xl sm:text-3xl md:text-6xl font-black italic tracking-tighter uppercase opacity-30 select-none">READY</span>
                  </div>
                  <div className="flex-[2] bg-[#7C3AED] flex flex-col items-center justify-center text-white">
                    <span className="text-2xl sm:text-3xl md:text-6xl font-black leading-none">{readyCount}/{totalMembers}</span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase mt-2 tracking-widest opacity-80">Waiting...</span>
                  </div>
                </div>
              ) : (
                <button onClick={() => router.push('/create/matching')}
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
  );
};

export default MatchPage;