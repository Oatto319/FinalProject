'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Copy, Settings, Plus, X, Home } from 'lucide-react';
import Navbar from '../../navbar/page';

interface RoomMember { name: string; avatarSeed: number; gmail: string; }
interface CurrentRoom {
  id: string; roomId?: string; title: string; description: string;
  totalMembers: number; groupSize: number; template: string;
  hostName: string; hostAvatarSeed: number; members: RoomMember[];
}

const ManualPage = () => {
  const router = useRouter();
  const [user, setUser]             = useState<{ name: string; avatarSeed: number; role?: string } | null>(null);
  const [room, setRoom]             = useState<CurrentRoom | null>(null);
  const [members, setMembers]       = useState<RoomMember[]>([]);
  const [readyUsers, setReadyUsers] = useState<string[]>([]);
  const [matchMode, setMatchMode]   = useState('');
  const [copied, setCopied]           = useState(false);
  const [showTypeSetting, setShowTypeSetting] = useState(false);

  // Type Setting popup state
  const TYPES_BY_TEMPLATE: Record<string, { key: string; label: string; icon: string }[]> = {
    programming: [
      { key: 'นักวิเคราะห์',    label: 'นักวิเคราะห์',    icon: '/img/brain.png' },
      { key: 'นักคิดสร้างสรรค์', label: 'นักคิดสร้างสรรค์', icon: '/img/idea.png' },
      { key: 'ผู้ปฏิบัติการ',    label: 'ผู้ปฏิบัติการ',    icon: '/img/pencil.png' },
      { key: 'นักประสานงาน',     label: 'นักประสานงาน',     icon: '/img/make.png' },
    ],
    service: [
      { key: 'นักสื่อสาร',    label: 'นักสื่อสาร',    icon: '/img/make.png' },
      { key: 'นักแก้ปัญหา',  label: 'นักแก้ปัญหา',  icon: '/img/brain.png' },
      { key: 'ผู้ฟัง',        label: 'ผู้ฟัง',        icon: '/img/idea.png' },
      { key: 'ผู้ปฏิบัติการ', label: 'ผู้ปฏิบัติการ', icon: '/img/pencil.png' },
    ],
    presentation: [
      { key: 'นักพูด',       label: 'นักพูด',       icon: '/img/idea.png' },
      { key: 'นักวิจัย',     label: 'นักวิจัย',     icon: '/img/brain.png' },
      { key: 'นักออกแบบ',    label: 'นักออกแบบ',    icon: '/img/pencil.png' },
      { key: 'ผู้ประสานงาน', label: 'ผู้ประสานงาน', icon: '/img/make.png' },
    ],
    design: [
      { key: 'นักสร้างสรรค์', label: 'นักสร้างสรรค์', icon: '/img/idea.png' },
      { key: 'นักวิเคราะห์',  label: 'นักวิเคราะห์',  icon: '/img/brain.png' },
      { key: 'ผู้ปฏิบัติ',    label: 'ผู้ปฏิบัติ',    icon: '/img/pencil.png' },
      { key: 'ผู้ประสานงาน',  label: 'ผู้ประสานงาน',  icon: '/img/make.png' },
    ],
  };
  const [tsTypes, setTsTypes]     = useState(TYPES_BY_TEMPLATE.programming);
  const [tsCounts, setTsCounts]   = useState<Record<string, number>>({});
  const [tsWarning, setTsWarning] = useState('');
  const [memberTypes, setMemberTypes] = useState<Record<string, { title: string; icon: string }>>({});

  const getRoomId = (r: CurrentRoom) => r.roomId ?? r.id;

  const fetchRoom = async (roomId: string, isHost: boolean) => {
    const res = await fetch(`/api/rooms/${roomId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.room) {
      setMembers(data.room.members ?? []);
      setReadyUsers(data.room.readyUsers ?? []);
      const pendingRaw2 = localStorage.getItem('pendingRoom');
      const localMode2 = pendingRaw2 ? (JSON.parse(pendingRaw2).matchMode ?? '') : '';
      if (data.room.matchMode && data.room.matchMode !== 'auto') {
        setMatchMode(data.room.matchMode);
      } else if (!localMode2 && data.room.matchMode) {
        setMatchMode(data.room.matchMode);
      }
    }
    if (isHost) {
      const typesRes = await fetch(`/api/rooms/${roomId}/member-types?source=members`);
      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setMemberTypes(typesData.types ?? {});
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

      // Init type setting from template
      const template = (pending?.template ?? r.template ?? 'programming').toLowerCase();
      const resolvedTypes = TYPES_BY_TEMPLATE[template] ?? TYPES_BY_TEMPLATE.programming;
      setTsTypes(resolvedTypes);
      const savedCounts = pending?.typeComposition ?? {};
      const initCounts = Object.fromEntries(resolvedTypes.map((t) => [t.key, savedCounts[t.key] ?? 0]));
      setTsCounts(initCounts);
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

  const tsSave = () => {
    if (tsTotal < tsGroupSize) {
      setTsWarning(`ยังเลือกไม่ครบ (${tsTotal}/${tsGroupSize})`);
      return;
    }
    const raw = localStorage.getItem('pendingRoom');
    const pendingData = raw ? JSON.parse(raw) : {};
    localStorage.setItem('pendingRoom', JSON.stringify({ ...pendingData, typeComposition: tsCounts }));
    setTsWarning('');
    setShowTypeSetting(false);
    if (isAllReady) router.push('/create/matching');
  };

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
          <div className="flex items-center gap-3">
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
            <button
              onClick={() => setShowTypeSetting(true)}
              className="w-10 h-10 rounded-full bg-white text-[#4B3E7A] flex items-center justify-center shadow-md hover:bg-white/90 active:scale-95 transition-all"
              title="Type Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="bg-[#D1D5DB]/40 p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 rounded-b-[40px] border-b-8 border-gray-300 shadow-inner">
          <div className="flex flex-col gap-3">
            {members.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400 font-medium">รอนักเรียนเข้าร่วม...</div>
            ) : (
              members.map((member, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:scale-[1.01] transition-all border-2 border-transparent hover:border-blue-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-yellow-100 border border-gray-100">
                      <img src={`/img/p${member.avatarSeed || 1}.PNG`} alt={member.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-700 leading-tight">{member.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-medium">นักเรียน</p>
                      {user?.name === room?.hostName && memberTypes[member.name] && (
                        <div className="flex items-center gap-1 mt-1">
                          <img src={memberTypes[member.name].icon} alt="" className="w-4 h-4 object-contain" />
                          <span className="text-[10px] font-bold text-[#4B3E7A]">{memberTypes[member.name].title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`px-6 py-1.5 rounded-xl font-bold text-sm min-w-[100px] text-center shadow-sm transition-colors ${readyUsers.includes(member.name) ? 'bg-[#608BC1] text-white' : 'bg-[#C86D6D] text-white'}`}>
                    {readyUsers.includes(member.name) ? 'ready' : 'wait'}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-[20px] p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-sky-200">
                  <img src={`/img/p${user?.avatarSeed || 1}.PNG`} alt="Host" className="w-full h-full object-contain" />
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
                <button
                  onClick={() => {
                    const raw = localStorage.getItem('pendingRoom');
                    const pending = raw ? JSON.parse(raw) : {};
                    const hasComp = Object.values(pending.typeComposition ?? {}).some((v) => (v as number) > 0);
                    if (!hasComp) { setShowTypeSetting(true); return; }
                    router.push('/create/matching');
                  }}
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
            <div className="p-6 bg-[#C4C9E2]">
              <p className="text-center text-xl font-black text-[#5B5EA6] mb-5">
                {tsGroupSize} <span className="font-bold">:Members</span>
              </p>

              <div className="bg-[#E8EAF3] rounded-2xl p-5">
                <div className="grid grid-cols-4 gap-3">
                  {/* Icons row */}
                  {tsTypes.map((t) => (
                    <div key={t.key} className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 flex items-center justify-center">
                        <img src={t.icon} alt={t.label} className="w-10 h-10 object-contain" />
                      </div>
                      <span className="text-[9px] font-bold text-[#3D3D6B] text-center leading-tight">{t.label}</span>
                    </div>
                  ))}

                  {/* Plus buttons row */}
                  {tsTypes.map((t) => (
                    <div key={t.key + '-plus'} className="flex justify-center">
                      <button
                        onClick={() => tsIncrement(t.key)}
                        disabled={tsTotal >= tsGroupSize}
                        className="w-9 h-9 rounded-full bg-[#7C6FCD] text-white flex items-center justify-center shadow hover:bg-[#6B5FB8] active:scale-95 transition-all disabled:opacity-40"
                      >
                        <Plus size={18} strokeWidth={3} />
                      </button>
                    </div>
                  ))}

                  {/* Count boxes row */}
                  {tsTypes.map((t) => (
                    <div key={t.key + '-count'} className="flex justify-center">
                      <button
                        onClick={() => tsDecrement(t.key)}
                        className="w-11 h-11 rounded-xl bg-[#8B8FAD] text-white text-lg font-black flex items-center justify-center shadow active:scale-95 transition-all select-none"
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
    </div>
  );
};

export default ManualPage;
