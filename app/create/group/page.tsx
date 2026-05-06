'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Navbar from '../../navbar/page';

interface RoomMember { name: string; avatarSeed: number; gmail: string; role?: string; }
interface MatchedGroup { id: number; name: string; members: RoomMember[]; leaderId?: string; }
interface TransferRequest { id: number; name: string; swapWith: string; fromGroup: string; toGroup: string; reason?: string; }

const GROUP_COLORS = ['bg-orange-400','bg-blue-600','bg-emerald-500','bg-purple-500','bg-rose-500','bg-amber-500','bg-cyan-500','bg-indigo-500'];
const ROLE_ICONS: Record<string, string> = { 'นักวิเคราะห์': '/img/brain.png', 'นักสร้างสรรค์': '/img/idea.png', 'ผู้ปฏิบัติ': '/img/pencil.png', 'ผู้ประสานงาน': '/img/make.png' };

const GroupResultPage = () => {
  const [showModal, setShowModal]             = useState(false);
  const [selectedReq, setSelectedReq]         = useState<TransferRequest | null>(null);
  const [room, setRoom]                       = useState<{ roomId?: string; id?: string; title: string; totalMembers: number; groupSize: number; template?: string } | null>(null);
  const [groups, setGroups]                   = useState<MatchedGroup[]>([]);
  const [transferRequests]                    = useState<TransferRequest[]>([]);
  const [memberTypeOverrides, setMemberTypeOverrides] = useState<Record<string, { title: string; icon: string; description?: string; jobs?: string[] }>>({});
  const [mbtiPopup, setMbtiPopup] = useState<{ name: string; type: { title: string; icon: string; description?: string; jobs?: string[] } } | null>(null);

  const getRoomId = (r: typeof room) => r?.roomId ?? r?.id ?? '';

  useEffect(() => {
    const load = async () => {
      const roomRaw = localStorage.getItem('currentRoom');
      if (!roomRaw) return;
      const r = JSON.parse(roomRaw);
      setRoom(r);

      const roomId = r.roomId ?? r.id;
      const res = await fetch(`/api/rooms/${roomId}`);
      const data = await res.json();
      if (!data.room?.matchedGroups) return;
      setGroups(data.room.matchedGroups);

      const template = (r.template ?? 'programming').toLowerCase();

      // สร้าง map name→gmail จาก room.members (มี gmail ครบกว่า matchedGroups)
      const gmailByName: Record<string, string> = {};
      (data.room.members ?? []).forEach((m: { name: string; gmail?: string }) => {
        if (m.gmail) gmailByName[m.name] = m.gmail;
      });

      const seen = new Set<string>();
      const allMembers: { name: string; gmail: string }[] = [];
      data.room.matchedGroups.forEach((g: MatchedGroup) => {
        g.members.forEach((m: RoomMember) => {
          const gmail = m.gmail || gmailByName[m.name] || '';
          if (gmail && !seen.has(m.name)) {
            seen.add(m.name);
            allMembers.push({ name: m.name, gmail });
          }
        });
      });

      const overrides: Record<string, { title: string; icon: string; description?: string; jobs?: string[] }> = {};
      await Promise.all(
        allMembers.map(async ({ name, gmail }) => {
          try {
            const ur = await fetch(`/api/users?gmail=${encodeURIComponent(gmail)}`);
            const ud = await ur.json();
            const types: Record<string, { title?: string; icon?: string; typeScores?: { title: string; score: number }[] }> = ud.user?.types ?? {};
            let found: { title?: string; icon?: string; typeScores?: { title: string; score: number }[] } | undefined = types[template];
            if (!found?.title) found = Object.values(types).find((t) => t?.title);
            if (found?.title) {
              const icon = found.icon || ROLE_ICONS[found.title] || '';
              overrides[name] = { title: found.title, icon, description: (found as {description?: string}).description, jobs: (found as {jobs?: string[]}).jobs };
            }
          } catch {}
        })
      );
      setMemberTypeOverrides(overrides);
    };
    load();
  }, []);

  const handleRequest = () => { setShowModal(false); setSelectedReq(null); };

  return (
    <div className="min-h-screen bg-[#E5E7EB] font-sans flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-6xl px-4 mt-4 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#F8A4A4] rounded-[20px] p-8 flex items-center justify-center shadow-sm">
            <h1 className="text-[#4B3E7A] text-4xl font-black italic tracking-tighter uppercase">{room?.template ?? 'PROGRAMMING'}</h1>
          </div>
          <div className="bg-white rounded-[20px] p-8 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="font-bold text-gray-700">{room?.title ?? '...'}</p>
                <p className="text-sm text-gray-500 italic">{room ? `จำนวน ${room.totalMembers} คน กลุ่มละ ${room.groupSize} คน` : ''}</p>
                <p className="text-sm text-gray-500">จับกลุ่มแล้ว {groups.length} กลุ่ม</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#4B3E7A]">ID: {room ? getRoomId(room) : '...'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[20px] p-6 shadow-sm flex flex-col gap-3 flex-1 min-h-[200px]">
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-700 text-sm">การแจ้งเตือน</p>
              {transferRequests.length > 0 && (
                <span className="w-5 h-5 bg-rose-500 text-white text-xs font-black rounded-full flex items-center justify-center">{transferRequests.length}</span>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400 font-medium">ไม่มีการแจ้งเตือนใหม่</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-[24px] p-6 shadow-sm overflow-hidden flex flex-col gap-8">
          {groups.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">ไม่พบข้อมูลกลุ่ม</div>
          ) : (
            groups.map((group, idx) => (
              <div key={group.id} className="flex flex-col">
                <div className={`inline-block self-start ${GROUP_COLORS[idx % GROUP_COLORS.length]} text-white px-8 py-2 rounded-t-2xl rounded-br-2xl font-black text-xl italic tracking-wider mb-2 ml-2 shadow-sm`}>
                  {group.name}
                </div>
                <div className="bg-gray-100/50 border-2 border-gray-100 rounded-[20px] p-4 flex flex-col gap-3">
                  {group.members.map((member, mIdx) => {
                    const avatarUrl = member.avatarSeed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed + 100}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`;
                    const typeOverride = memberTypeOverrides[member.name];
                    const roleTitle = typeOverride?.title ?? (member.role !== 'ไม่ระบุ' ? member.role : undefined);
                    const roleIcon  = typeOverride?.icon ?? (roleTitle ? ROLE_ICONS[roleTitle] ?? null : null);
                    const isLeader  = group.leaderId === member.name;
                    return (
                      <div key={mIdx} className="bg-white rounded-2xl p-3 flex items-center justify-between shadow-sm border-2 border-transparent hover:border-yellow-400 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-100">
                            <img src={avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              {isLeader && <span className="text-lg">👑</span>}
                              <p className="font-bold text-gray-700 text-sm leading-tight">{member.name}</p>
                            </div>
                            {roleTitle && (
                              <div className="flex items-center gap-1 mt-0.5">
                                {roleIcon && <img src={roleIcon} alt={roleTitle} className="w-3 h-3 object-contain" />}
                                <p className="text-[10px] text-gray-400">{roleTitle}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {typeOverride ? (
                          <button onClick={() => setMbtiPopup({ name: member.name, type: typeOverride })}
                            className="w-12 h-12 rounded-full overflow-hidden hover:opacity-80 transition-opacity flex-shrink-0">
                            <img src={typeOverride.icon} alt={typeOverride.title} className="w-full h-full object-contain" />
                          </button>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0" />
                        )}
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
              <img src={mbtiPopup.type.icon} alt={mbtiPopup.type.title} className="w-24 h-24 object-contain" />
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
