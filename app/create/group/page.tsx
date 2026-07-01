'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Home, Copy } from 'lucide-react';
import Navbar from '../../navbar/page';
import { resolveAvatar } from '@/lib/avatar';
import { typeColor, roleColor } from '@/lib/mbti';
import MbtiTagLegend from '../../components/MbtiTagLegend';
import { markMatchSeen } from '../../components/notifications';

interface RoomMember { name: string; avatarSeed: number; avatarImage?: string | null; gmail: string; role?: string; }
interface MatchedGroup { id: number; name: string; members: RoomMember[]; leaderId?: string; leaderConfirmedBy?: string[]; }
interface MBTIResult { code?: string; title: string; icon: string; description: string; jobs: string[]; }


const GROUP_COLORS = ['bg-orange-400','bg-blue-600','bg-emerald-500','bg-purple-500','bg-rose-500','bg-amber-500','bg-cyan-500','bg-indigo-500'];
const ROLE_ICONS: Record<string, string> = {
  'นักวิเคราะห์': '/img/brain.png',    'นักคิดสร้างสรรค์': '/img/idea.png',
  'ผู้ปฏิบัติการ': '/img/pencil.png',  'นักประสานงาน': '/img/make.png',
  'นักสื่อสาร': '/img/make.png',       'นักแก้ปัญหา': '/img/brain.png',
  'ผู้ฟัง': '/img/idea.png',           'นักพูด': '/img/idea.png',
  'นักวิจัย': '/img/brain.png',        'นักออกแบบ': '/img/pencil.png',
  'ผู้ประสานงาน': '/img/make.png',     'นักสร้างสรรค์': '/img/idea.png',
  'ผู้ปฏิบัติ': '/img/pencil.png',
};
const TEMPLATE_COLORS: Record<string, string> = { programming: '#FFAAAA', service: '#71EFB8', presentation: '#EAFF48', design: '#8C71EF' };

const GroupResultPage = () => {
  const router = useRouter();
  const [showModal, setShowModal]             = useState(false);
  const [selectedReq, setSelectedReq]         = useState<{id:number;name:string} | null>(null);
  const [room, setRoom]                       = useState<{ roomId?: string; id?: string; title: string; description?: string; totalMembers: number; groupSize: number; template?: string; hostName?: string; hostAvatarSeed?: number; hostAvatarImage?: string | null; hostRole?: string; members?: {name:string}[] } | null>(null);
  const [groups, setGroups]                   = useState<MatchedGroup[]>([]);
  const [isManualRoom, setIsManualRoom]        = useState(false);
  const [memberTypeOverrides, setMemberTypeOverrides] = useState<Record<string, MBTIResult>>({});
  const [mbtiPopup, setMbtiPopup] = useState<{ name: string; type: MBTIResult } | null>(null);
  const [copied, setCopied] = useState(false);


  useEffect(() => {
    const load = async () => {
      const roomRaw = localStorage.getItem('currentRoom');
      if (!roomRaw) return;
      const r = JSON.parse(roomRaw);
      setRoom(r);

      const roomId = r.roomId ?? r.id;
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.room) return;
      const manual = data.room.matchMode === 'selection';
      setIsManualRoom(manual);
      setRoom({ ...r, ...data.room });
      if (data.room.matchedGroups?.length) setGroups(data.room.matchedGroups);
      if (data.room.matchDone) markMatchSeen(roomId);

      // manual mode ใช้ member.role โดยตรง ไม่ต้อง fetch MBTI types
      if (!manual) {
        const typesRes = await fetch(`/api/rooms/${roomId}/member-types`);
        if (typesRes.ok) {
          const typesData = await typesRes.json();
          setMemberTypeOverrides(typesData.types ?? {});
        }
      }
    };
    load();
  }, []);

  const handleRequest = () => { setShowModal(false); setSelectedReq(null); };

  const handleCopyResults = () => {
    const text = [
      `ผลการจับกลุ่ม: ${room?.title ?? ''}`,
      ...groups.map((g) =>
        [`\n${g.name} (${g.members.length} คน)`, ...g.members.map((m) => `- ${m.name}${g.leaderId === m.name ? ' (หัวหน้าทีม)' : ''}`)].join('\n')
      ),
    ].join('\n');
    try { navigator.clipboard.writeText(text); } catch { const el = document.createElement('textarea'); el.value = text; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#E8E8E8] font-sans flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-6xl px-4 mt-4 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Room card — myprojects style */}
          <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
            {/* Template header */}
            <div className="px-5 py-3" style={{ backgroundColor: TEMPLATE_COLORS[(room?.template ?? '').toLowerCase()] ?? '#D1D5DB' }}>
              <span className="text-xs font-black uppercase tracking-widest text-white/90">{room?.template ?? 'PROGRAMMING'}</span>
            </div>
            {/* Body */}
            <div className="p-5">
              {/* Host profile */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-sky-200 flex-shrink-0">
                  <img src={room ? resolveAvatar({ avatarSeed: room.hostAvatarSeed, avatarImage: room.hostAvatarImage }) : '/img/p1.PNG'} alt="Host" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800 leading-tight">{room?.hostName ?? '...'}</p>
                    <span className="bg-[#94A3B8] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">HOST</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${room?.hostRole === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>
                    {room?.hostRole ?? 'host'}
                  </span>
                </div>
              </div>
              {/* Room info */}
              <p className="font-bold text-gray-800 text-base mb-1">{room?.title ?? '...'}</p>
              {room?.description && <p className="text-gray-500 text-sm mb-3 leading-relaxed">{room.description}</p>}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{room?.totalMembers} คน · กลุ่มละ {room?.groupSize} คน</p>
                <p className="text-xs text-gray-400 font-medium">ID: {room?.roomId ?? room?.id ?? '...'}</p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm transition-all active:scale-95"
              >
                <Home size={16} />
                กลับหน้าหลัก
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-[24px] p-6 shadow-sm overflow-hidden flex flex-col gap-8">
          {groups.length > 0 && (
            <div className="flex items-center justify-between -mb-4">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">ผลการจับกลุ่ม</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyResults}
                  title="คัดลอกผลการจับกลุ่ม"
                  className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-bold transition-all ${copied ? 'bg-green-100 text-green-600' : 'bg-[#EDE9FF] hover:bg-[#E0D9FF] text-[#4B3E7A]'}`}
                >
                  <Copy size={14} />
                  {copied ? 'คัดลอกแล้ว!' : 'คัดลอกผลลัพธ์'}
                </button>
                <MbtiTagLegend
                  template={room?.template ?? 'programming'}
                  className="w-8 h-8 rounded-full bg-[#EDE9FF] hover:bg-[#E0D9FF] flex items-center justify-center text-[#4B3E7A] transition-all"
                />
              </div>
            </div>
          )}
          {groups.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">ไม่พบข้อมูลกลุ่ม</div>
          ) : (
            groups.map((group, idx) => (
              <div key={group.id} className="flex flex-col">
                {idx > 0 && <div className="border-t-2 border-dashed border-gray-200 my-2" />}
                <div className={`inline-block self-start ${GROUP_COLORS[idx % GROUP_COLORS.length]} text-white px-8 py-2 rounded-full font-black text-xl italic tracking-wider mb-2 ml-2 shadow-sm`}>
                  {group.name}
                </div>
                {group.leaderId && (
                  <p className="text-xs text-gray-400 font-medium ml-2 mb-2">
                    หัวหน้าทีม: <span className="font-bold text-gray-600">{group.leaderId}</span> — ยืนยันแล้ว {group.leaderConfirmedBy?.length ?? 0}/{group.members.length} คน
                  </p>
                )}
                <div className="bg-[#E8E8E8] border-2 border-[#E8E8E8] rounded-[20px] p-4 flex flex-col gap-3">
                  {group.members.map((member, mIdx) => {
                    const avatarUrl = resolveAvatar(member);
                    const typeOverride = memberTypeOverrides[member.name];
                    const assignedRole = member.role && member.role !== 'ไม่ระบุ' ? member.role : undefined;
                    const isLeader  = group.leaderId === member.name;
                    return (
                      <div key={mIdx} className="bg-white rounded-2xl p-3 flex items-center justify-between shadow-sm border-2 border-transparent hover:border-yellow-400 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-100">
                            <img src={avatarUrl} alt={member.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-700 text-sm leading-tight">{member.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isLeader && <div className="w-16 h-16 flex items-center justify-center"><img src="/img/crown.PNG" alt="crown" className="w-full h-full object-contain" /></div>}
                          {isManualRoom ? (
                            assignedRole && ROLE_ICONS[assignedRole] ? (
                              <button
                                onClick={() => setMbtiPopup({ name: member.name, type: { title: assignedRole, icon: ROLE_ICONS[assignedRole], description: 'บทบาทที่ได้รับมอบหมายในทีมนี้', jobs: [] } })}
                                className="w-12 h-12 rounded-full overflow-hidden hover:opacity-80 transition-opacity flex items-center justify-center"
                                style={{ backgroundColor: `${roleColor(ROLE_ICONS[assignedRole])}26` }}>
                                <span className="text-[10px] font-black text-center px-1" style={{ color: roleColor(ROLE_ICONS[assignedRole]) }}>{assignedRole.slice(0, 2)}</span>
                              </button>
                            ) : <div className="w-12 h-12 rounded-full bg-gray-100" />
                          ) : typeOverride ? (
                            <button onClick={() => setMbtiPopup({ name: member.name, type: typeOverride })}
                              className="w-12 h-12 rounded-full overflow-hidden hover:opacity-80 transition-opacity flex items-center justify-center"
                              style={{ backgroundColor: `${typeOverride.code ? typeColor(typeOverride.code) : roleColor(typeOverride.icon)}26` }}>
                              <span className="text-[10px] font-black" style={{ color: typeOverride.code ? typeColor(typeOverride.code) : roleColor(typeOverride.icon) }}>
                                {typeOverride.code ?? typeOverride.title.slice(0, 2)}
                              </span>
                            </button>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-100" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {mbtiPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setMbtiPopup(null)}>
          <div className="bg-white rounded-[20px] w-full max-w-sm shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#4B3E7A] px-6 py-4 flex items-center justify-between">
              <p className="font-black text-white text-lg">{mbtiPopup.name}</p>
              <button onClick={() => setMbtiPopup(null)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: `${mbtiPopup.type.code ? typeColor(mbtiPopup.type.code) : roleColor(mbtiPopup.type.icon)}1A` }}
              >
                <span className="text-lg font-black" style={{ color: mbtiPopup.type.code ? typeColor(mbtiPopup.type.code) : roleColor(mbtiPopup.type.icon) }}>
                  {mbtiPopup.type.code ?? mbtiPopup.type.title.slice(0, 2)}
                </span>
              </div>
              <p className="font-black text-[#4B3E7A] text-xl">{mbtiPopup.type.title}</p>
              {mbtiPopup.type.description && <p className="text-gray-500 text-sm text-center leading-relaxed">{mbtiPopup.type.description}</p>}
              {mbtiPopup.type.jobs && mbtiPopup.type.jobs.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {mbtiPopup.type.jobs.map((job) => (
                    <span key={job} className="bg-[#EDE9FF] text-[#4B3E7A] text-xs font-bold px-3 py-1 rounded-full">{job}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && selectedReq && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-rose-500 px-6 py-4 flex items-center justify-between">
              <h2 className="font-black text-xl text-white">คำร้องขอย้ายกลุ่ม</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex gap-3">
                <button onClick={handleRequest} className="flex-1 bg-rose-300 hover:bg-rose-400 text-white font-black py-3 rounded-2xl transition-all active:scale-95">ปฏิเสธ</button>
                <button onClick={handleRequest} className="flex-1 bg-green-400 hover:bg-green-500 text-white font-black py-3 rounded-2xl transition-all active:scale-95">อนุมัติ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupResultPage;
