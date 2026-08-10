'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Home, Copy, Users, UserMinus, ArrowRightLeft, MessageSquareText } from 'lucide-react';
import Navbar from '../../navbar/page';
import { resolveAvatar } from '@/lib/avatar';
import { typeColor, roleColor } from '@/lib/mbti';
import { TYPE_IMAGES } from '@/lib/type-images';
import MbtiTagLegend from '../../components/MbtiTagLegend';
import { markMatchSeen } from '../../components/notifications';

interface RoomMember { name: string; avatarSeed: number; avatarImage?: string | null; gmail: string; role?: string; }
interface MatchedGroup { id: number; name: string; members: RoomMember[]; leaderId?: string; leaderConfirmedBy?: string[]; }
interface MBTIResult { code?: string; title: string; icon: string; description: string; jobs: string[]; }
interface LeaveRequest { _id: string; groupId: number; targetGmail: string; targetName: string; reporterGmail: string; reporterName: string; }
interface CommentEntry { overall: number; comment: string; createdAt: string }
interface MemberComments { name: string; entries: CommentEntry[]; }


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
  const [room, setRoom]                       = useState<{ roomId?: string; id?: string; title: string; description?: string; totalMembers: number; groupSize: number; template?: string; hostName?: string; hostGmail?: string; hostAvatarSeed?: number; hostAvatarImage?: string | null; hostRole?: string; members?: {name:string}[]; endedManually?: boolean } | null>(null);
  const [groups, setGroups]                   = useState<MatchedGroup[]>([]);
  const [isManualRoom, setIsManualRoom]        = useState(false);
  const [memberTypeOverrides, setMemberTypeOverrides] = useState<Record<string, MBTIResult>>({});
  const [mbtiPopup, setMbtiPopup] = useState<{ name: string; type: MBTIResult } | null>(null);
  const [copied, setCopied] = useState(false);
  const [endingActivity, setEndingActivity] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [comments, setComments] = useState<Record<string, MemberComments>>({});
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ groupId: number; gmail: string; name: string } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ groupId: number; gmail: string; name: string } | null>(null);
  const [managing, setManaging] = useState(false);


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
      setLeaveRequests(data.room.leaveRequests ?? []);
      if (data.room.matchDone) markMatchSeen(roomId);

      // manual mode ใช้ member.role โดยตรง ไม่ต้อง fetch MBTI types
      if (!manual) {
        const typesRes = await fetch(`/api/rooms/${roomId}/member-types`);
        if (typesRes.ok) {
          const typesData = await typesRes.json();
          setMemberTypeOverrides(typesData.types ?? {});
        }
      }

      // ความคิดเห็นจากแบบประเมิน — แบบไม่ระบุตัวตนผู้ประเมิน (host เท่านั้นที่เห็นได้ ฝั่ง server เช็คให้แล้ว)
      if (data.room.matchDone) {
        const evalRes = await fetch(`/api/rooms/${roomId}/evaluations`);
        if (evalRes.ok) {
          const evalData = await evalRes.json();
          setComments(evalData.members ?? {});
        }
      }
    };
    load();
  }, []);

  const refreshFromRoom = (updatedRoom: { matchedGroups?: MatchedGroup[]; leaveRequests?: LeaveRequest[] }) => {
    if (updatedRoom.matchedGroups) setGroups(updatedRoom.matchedGroups);
    if (updatedRoom.leaveRequests) setLeaveRequests(updatedRoom.leaveRequests);
  };

  // Poll ผลจับกลุ่มทุก 2 วิ เพื่อให้ host เห็นหัวหน้าทีมทันทีหลังนักเรียนเลือก/ยืนยันกัน (Vote หรือ Analyze mode)
  // โดยไม่ต้อง refresh หน้าเอง — เบาๆ แค่ดึง room เฉยๆ ไม่ต้อง fetch member-types/evaluations ซ้ำทุกรอบ
  useEffect(() => {
    const roomId = room?.roomId ?? room?.id;
    if (!roomId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.room) refreshFromRoom(data.room);
    }, 2000);
    return () => clearInterval(interval);
  }, [room?.roomId, room?.id]);

  const handleDismissRequest = async (requestId: string) => {
    const roomId = room?.roomId ?? room?.id;
    if (!roomId) return;
    const res = await fetch(`/api/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dismissLeaveRequest', requestId }),
    });
    const data = await res.json();
    if (res.ok) refreshFromRoom(data.room);
  };

  const handleConfirmRemove = async () => {
    const roomId = room?.roomId ?? room?.id;
    if (!removeTarget || !roomId || managing) return;
    setManaging(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removeMemberFromGroup', groupId: removeTarget.groupId, memberGmail: removeTarget.gmail }),
      });
      const data = await res.json();
      if (res.ok) refreshFromRoom(data.room);
      else alert(data.error ?? 'เอาสมาชิกออกไม่สำเร็จ');
    } finally {
      setManaging(false);
      setRemoveTarget(null);
    }
  };

  const handleMove = async (toGroupId: number) => {
    const roomId = room?.roomId ?? room?.id;
    if (!moveTarget || !roomId || managing) return;
    setManaging(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'moveMember', gmail: moveTarget.gmail, fromGroupId: moveTarget.groupId, toGroupId }),
      });
      const data = await res.json();
      if (res.ok) refreshFromRoom(data.room);
      else alert(data.error ?? 'ย้ายสมาชิกไม่สำเร็จ');
    } finally {
      setManaging(false);
      setMoveTarget(null);
    }
  };

  // Host เป็นผู้สร้างห้อง ไม่ใช่สมาชิกในกลุ่มโดยอัตโนมัติ — ต้องเช็คว่า host เข้าร่วมเป็นสมาชิกและถูกจับกลุ่มไปด้วยจริงๆ
  // ก่อนโชว์ปุ่ม "เข้าห้องทีมของฉัน" ไม่งั้น host ที่ไม่ได้อยู่ในกลุ่มไหนเลยจะกดแล้วไปหน้าที่ไม่มีทีมให้ดู
  // กรณี hostRole === 'user' (นักเรียนที่สร้างห้องเอง) ระบบเพิ่มเป็นสมาชิกให้อัตโนมัติตอนสร้างห้องอยู่แล้ว (ดู app/api/rooms/route.ts)
  // จึงคงพฤติกรรมเดิมไว้ — เช็คเฉพาะกรณี hostRole === 'host' (อาจารย์) ที่ไม่ได้ join ห้องตัวเองเป็นค่าเริ่มต้น
  const isHostInGroup = room?.hostRole === 'user'
    ? groups.length > 0
    : groups.some((g) =>
        g.members.some((m) => (room?.hostGmail ? m.gmail === room.hostGmail : m.name === room?.hostName))
      );

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

  const handleEndActivity = async () => {
    const roomId = room?.roomId ?? room?.id;
    if (!roomId || endingActivity) return;
    if (!confirm('จบกิจกรรมนี้เลยหรือไม่? สมาชิกทุกคนในห้องจะต้องทำแบบประเมินเพื่อนร่วมทีมก่อนสร้าง/เข้าร่วมห้องใหม่')) return;
    setEndingActivity(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'endActivity' }),
      });
      const data = await res.json();
      if (res.ok) {
        setRoom((prev) => (prev ? { ...prev, endedManually: data.room?.endedManually } : prev));
      } else {
        alert(data.error ?? 'จบกิจกรรมไม่สำเร็จ');
      }
    } finally {
      setEndingActivity(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1D324B] font-sans flex flex-col items-center">
      <Navbar bgColor="#122031" nameColor="white" />
      <div className="w-full max-w-6xl px-4 mt-4 pb-6">
      <div className="bg-[#E5E7EB] rounded-[40px] p-4 lg:p-6 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-6">
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
              {isHostInGroup && (
                <button
                  onClick={() => router.push('/join/myteam')}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#4B3E7A] hover:bg-[#3d3268] text-white font-bold text-sm transition-all active:scale-95"
                >
                  <Users size={16} />
                  เข้าห้องทีมของฉัน
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm transition-all active:scale-95"
              >
                <Home size={16} />
                กลับหน้าหลัก
              </button>
              {groups.length > 0 && (
                room?.endedManually ? (
                  <p className="mt-2 w-full text-center text-xs font-bold text-orange-500">กิจกรรมนี้จบแล้ว</p>
                ) : (
                  <button
                    onClick={handleEndActivity}
                    disabled={endingActivity}
                    className="mt-2 w-full py-2.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-600 font-bold text-sm transition-all active:scale-95 disabled:opacity-60"
                  >
                    {endingActivity ? 'กำลังบันทึก...' : 'จบกิจกรรมนี้'}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-[24px] p-4 sm:p-6 shadow-sm overflow-hidden flex flex-col gap-6 sm:gap-8">
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
          {leaveRequests.length > 0 && !room?.endedManually && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex flex-col gap-2.5">
              <p className="text-xs font-black text-amber-600 uppercase tracking-widest">
                คำร้องแจ้งสมาชิกออกจากกลุ่ม ({leaveRequests.length})
              </p>
              {leaveRequests.map((r) => {
                const g = groups.find((grp) => grp.id === r.groupId);
                return (
                  <div key={r._id} className="bg-white rounded-xl p-3 flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm text-gray-700 min-w-0">
                      <span className="font-bold">{r.reporterName}</span> แจ้งว่า{' '}
                      <span className="font-bold text-red-500">{r.targetName}</span> ออกจาก {g?.name ?? `ทีม ${r.groupId}`}
                    </p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDismissRequest(r._id)}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold hover:bg-gray-200 transition-all"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={() => setRemoveTarget({ groupId: r.groupId, gmail: r.targetGmail, name: r.targetName })}
                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all"
                      >
                        เอาออก
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {groups.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">ไม่พบข้อมูลกลุ่ม</div>
          ) : (
            groups.map((group, idx) => (
              <div key={group.id} className="flex flex-col">
                {idx > 0 && <div className="border-t-2 border-dashed border-gray-200 my-2" />}
                <div className={`inline-block self-start ${GROUP_COLORS[idx % GROUP_COLORS.length]} text-white px-5 sm:px-8 py-2 rounded-full font-black text-lg sm:text-xl italic tracking-wider mb-2 ml-2 shadow-sm`}>
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
                    const typeOverride = memberTypeOverrides[member.gmail ?? member.name];
                    const assignedRole = member.role && member.role !== 'ไม่ระบุ' ? member.role : undefined;
                    const isLeader  = group.leaderId === member.name;
                    const memberComments = member.gmail ? comments[member.gmail] : undefined;
                    const commentCount = memberComments?.entries.filter((e) => e.comment).length ?? 0;
                    return (
                      <div key={mIdx} className="bg-white rounded-2xl p-3 flex flex-col gap-2 shadow-sm border-2 border-transparent hover:border-yellow-400 transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                            <div className="w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 border border-gray-100">
                              <img src={avatarUrl} alt={member.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-700 text-sm leading-tight truncate">{member.name}</p>
                              {commentCount > 0 && (
                                <button
                                  onClick={() => setOpenComments(openComments === member.gmail ? null : member.gmail)}
                                  className="text-[10px] text-gray-400 hover:text-[#4B3E7A] font-bold flex items-center gap-1 mt-0.5"
                                >
                                  <MessageSquareText size={10} /> {commentCount} ความเห็น
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isLeader && <div className="w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center"><img src="/img/crown.PNG" alt="crown" className="w-full h-full object-contain" /></div>}
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
                            {!room?.endedManually && (
                              <div className="flex items-center gap-1">
                                <button
                                  title="ย้ายไปทีมอื่น"
                                  onClick={() => setMoveTarget({ groupId: group.id, gmail: member.gmail, name: member.name })}
                                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-blue-50 text-gray-400 hover:text-blue-500 flex items-center justify-center transition-colors"
                                >
                                  <ArrowRightLeft size={13} />
                                </button>
                                <button
                                  title="เอาออกจากกลุ่ม"
                                  onClick={() => setRemoveTarget({ groupId: group.id, gmail: member.gmail, name: member.name })}
                                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors"
                                >
                                  <UserMinus size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {openComments === member.gmail && memberComments && (
                          <div className="flex flex-col gap-1.5 bg-gray-50 rounded-xl p-2.5">
                            {memberComments.entries.filter((e) => e.comment).map((e, i) => (
                              <p key={i} className="text-xs text-gray-600">
                                <span className="font-bold text-gray-800">{e.overall}/5</span>
                                <span className="text-gray-500"> — {e.comment}</span>
                              </p>
                            ))}
                          </div>
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
                className="w-20 h-20 rounded-2xl overflow-hidden"
                style={{ backgroundColor: `${mbtiPopup.type.code ? typeColor(mbtiPopup.type.code) : roleColor(mbtiPopup.type.icon)}1A` }}
              >
                {mbtiPopup.type.code && TYPE_IMAGES[mbtiPopup.type.code] ? (
                  <img src={TYPE_IMAGES[mbtiPopup.type.code]} alt={mbtiPopup.type.code} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-lg font-black" style={{ color: mbtiPopup.type.code ? typeColor(mbtiPopup.type.code) : roleColor(mbtiPopup.type.icon) }}>
                      {mbtiPopup.type.code ?? mbtiPopup.type.title.slice(0, 2)}
                    </span>
                  </div>
                )}
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

      {removeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setRemoveTarget(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-black text-gray-800 mb-2">เอาออกจากกลุ่ม</p>
            <p className="text-gray-500 text-sm mb-6">
              เอา <span className="font-bold text-gray-700">{removeTarget.name}</span> ออกจากกลุ่มถาวร? การกระทำนี้ย้อนกลับไม่ได้
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRemoveTarget(null)} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-all">ยกเลิก</button>
              <button
                disabled={managing}
                onClick={handleConfirmRemove}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all active:scale-95 disabled:opacity-60"
              >
                {managing ? 'กำลังบันทึก...' : 'ยืนยันเอาออก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {moveTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setMoveTarget(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-black text-gray-800 mb-4">ย้าย {moveTarget.name} ไปทีมไหน?</p>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {groups.filter((g) => g.id !== moveTarget.groupId).map((g) => (
                <button
                  key={g.id}
                  disabled={managing || g.members.length >= (room?.groupSize ?? Infinity)}
                  onClick={() => handleMove(g.id)}
                  className="text-left px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-[#7096D1] font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {g.name} <span className="text-xs text-gray-400 font-medium">({g.members.length}/{room?.groupSize ?? '?'} คน)</span>
                </button>
              ))}
            </div>
            <button onClick={() => setMoveTarget(null)} className="mt-4 w-full py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-all">ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupResultPage;