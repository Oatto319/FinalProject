'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Edit2, Home, Send, User, UserMinus, X } from 'lucide-react';
import Navbar from '../../navbar/page';
import { resolveAvatar } from '@/lib/avatar';
import { typeColor, roleColor } from '@/lib/mbti';
import { TYPE_IMAGES } from '@/lib/type-images';
import MbtiTagLegend from '../../components/MbtiTagLegend';
import { markMatchSeen } from '../../components/notifications';

interface ChatMessage { id: string; sender: string; text: string; time: string; avatarSeed?: number; avatarImage?: string | null; }
interface RoomMember { name: string; avatarSeed: number; avatarImage?: string | null; gmail: string; role?: string; }
interface MatchedGroup { id: number; name: string; members: RoomMember[]; leaderId?: string; leaderConfirmedBy?: string[]; }
interface LeaveRequest { _id: string; groupId: number; targetGmail: string; targetName: string; reporterGmail: string; reporterName: string; }
interface CurrentRoom {
  id: string; roomId?: string; title: string; totalMembers: number;
  groupSize: number; template: string; hostName: string; hostAvatarSeed: number; hostAvatarImage?: string | null; members: RoomMember[];
}
interface MBTIResult { code?: string; title: string; icon: string; description: string; jobs: string[]; }

export default function MyTeamPage() {
  const router = useRouter();
  const [user, setUser]               = useState<{ name: string; avatarSeed: number; avatarImage?: string | null; gmail?: string } | null>(null);
  const [teamMembers, setTeamMembers] = useState<RoomMember[]>([]);
  const [myGroup, setMyGroup]         = useState<MatchedGroup | null>(null);
  const [message, setMessage]         = useState('');
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [isMatched, setIsMatched]     = useState(false);
  const [memberTypes, setMemberTypes] = useState<Record<string, MBTIResult>>({});
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});
const [popup, setPopup]             = useState<{ member: RoomMember; type: MBTIResult } | null>(null);
  const [roomDeleted, setRoomDeleted] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reportTarget, setReportTarget] = useState<RoomMember | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [isManualRoom, setIsManualRoom]   = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName]     = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [roomTitle, setRoomTitle] = useState('');
  const [template, setTemplate] = useState('programming');
  const [leaderTip, setLeaderTip] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const roomIdRef = useRef<string>('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mobileChatRef = useRef<HTMLDivElement>(null);
  const groupIdRef = useRef<number | null>(null);
  const memberTypesFetchedRef = useRef(false);
  const initialScrollDoneRef = useRef(false);

  const getRoomId = (r: CurrentRoom) => r.roomId ?? r.id;

  const fetchRoomData = async (roomId: string, userName: string, userGmail?: string) => {
    const res = await fetch(`/api/rooms/${roomId}`);
    if (!res.ok) {
      setRoomDeleted(true);
      localStorage.removeItem('currentRoom');
      return;
    }
    const data = await res.json();
    if (!data.room) return;
    const room = data.room;
    setIsMatched(!!room.matchDone);
    setTeamMembers(room.members ?? []);
    setTemplate(room.template ?? 'programming');
    setLeaveRequests(room.leaveRequests ?? []);
    if (room.matchDone) markMatchSeen(roomId);
    const isManual = room.matchMode === 'selection';
    setIsManualRoom(isManual);
    if (room.matchedGroups?.length) {
      const mine = room.matchedGroups.find((g: MatchedGroup) => g.members.some((m) => (userGmail && m.gmail === userGmail) || m.name === userName));
      if (mine) {
        setMyGroup(mine);
        groupIdRef.current = mine.id;

        const currentUserRaw = localStorage.getItem('currentUser');
        const currentUserLocal = currentUserRaw ? JSON.parse(currentUserRaw) : null;

        if (!memberTypesFetchedRef.current) {
          memberTypesFetchedRef.current = true;

          const roles: Record<string, string> = {};
          if (currentUserLocal?.name && currentUserLocal?.role) {
            roles[currentUserLocal.name] = currentUserLocal.role;
          }
          setMemberRoles(roles);

          const typesRes = await fetch(`/api/rooms/${roomId}/member-types?groupId=${mine.id}`);
          const types: Record<string, MBTIResult> = typesRes.ok ? (await typesRes.json()).types ?? {} : {};

          // fallback: ถ้า currentUser ยังไม่มี type ให้ดู localStorage
          if (currentUserLocal?.name && !types[currentUserLocal.name]) {
            const rawTemplate = (room.template ?? '').toLowerCase();
            const LABEL_TO_ID_LOCAL: Record<string, string> = {
              'programming': 'programming', 'service': 'service',
              'customer / service': 'service', 'presentation': 'presentation',
              'design': 'design', 'design / creative': 'design',
            };
            const templateKey = LABEL_TO_ID_LOCAL[rawTemplate] ?? rawTemplate;
            const localTypes = currentUserLocal.types ?? {};
            const localType = localTypes[templateKey]
              ?? Object.values(localTypes).find((t: unknown) => (t as { icon?: string })?.icon);
            if (localType) {
              const t = localType as { code: string; title: string; icon: string; description?: string; jobs?: string[] };
              types[currentUserLocal.name] = { code: t.code, title: t.title, icon: t.icon, description: t.description ?? '', jobs: t.jobs ?? [] };
            }
          }

          setMemberTypes(types);
          if (Object.keys(types).length < mine.members.length) {
            memberTypesFetchedRef.current = false;
          }
        }
      }
    }
  };

  const fetchMessages = async (roomId: string) => {
    if (groupIdRef.current === null) return;
    const res = await fetch(`/api/rooms/${roomId}/messages?groupId=${groupIdRef.current}`);
    if (!res.ok) { setIsLoadingMessages(false); return; }
    const data = await res.json();
    interface RawMessage {
      _id?: string; id?: string; sender: string; text: string; time: string;
      avatarSeed?: number; avatarImage?: string | null;
    }
    setMessages((data.messages ?? []).map((m: RawMessage) => ({
      id: m._id ?? m.id ?? '',
      sender: m.sender,
      text: m.text,
      time: m.time,
      avatarSeed: m.avatarSeed,
      avatarImage: m.avatarImage,
    })));
    setIsLoadingMessages(false);
  };

  useEffect(() => {
    const syncUser = () => {
      const raw = localStorage.getItem('currentUser');
      if (raw) setUser(JSON.parse(raw));
    };
    window.addEventListener('focus', syncUser);

    const raw = localStorage.getItem('currentUser');
    if (!raw) return;
    const currentUser = JSON.parse(raw);
    setUser(currentUser);

    const roomRaw = localStorage.getItem('currentRoom');
    if (!roomRaw) return;
    const room: CurrentRoom = JSON.parse(roomRaw);
    const roomId = getRoomId(room);
    roomIdRef.current = roomId;
    setRoomTitle(room.title ?? '');

    fetchRoomData(roomId, currentUser.name, currentUser.gmail).then(() => fetchMessages(roomId));

    const interval = setInterval(() => {
      const latestUser = JSON.parse(localStorage.getItem('currentUser') ?? '{}');
      fetchRoomData(roomId, latestUser.name, latestUser.gmail);
      fetchMessages(roomId);
    }, 2000);
    return () => { clearInterval(interval); window.removeEventListener('focus', syncUser); };
  }, []);

  useEffect(() => {
    if (!isLoadingMessages && !initialScrollDoneRef.current) {
      initialScrollDoneRef.current = true;
      setTimeout(() => {
        if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }, 50);
    }
  }, [isLoadingMessages]);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => {
        if (mobileChatRef.current) mobileChatRef.current.scrollTop = mobileChatRef.current.scrollHeight;
      }, 50);
    }
  }, [isChatOpen]);

  const handleSend = async () => {
    if (!message.trim() || !user || !roomIdRef.current || groupIdRef.current === null) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    const optimistic: ChatMessage = { id: Date.now().toString(), sender: user.name, text: message.trim(), time, avatarSeed: user.avatarSeed, avatarImage: user.avatarImage };
    setMessages((prev) => [...prev, optimistic]);
    setMessage('');
    setTimeout(() => {
      if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }, 50);

    await fetch(`/api/rooms/${roomIdRef.current}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: optimistic.text, time, avatarSeed: user.avatarSeed, avatarImage: user.avatarImage, groupId: groupIdRef.current ?? 0 }),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleSend(); };

  const handleSaveName = async () => {
    if (!editingName.trim() || !myGroup || !roomIdRef.current) return;
    await fetch(`/api/rooms/${roomIdRef.current}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'renameTeam', groupId: myGroup.id, name: editingName.trim() }),
    });
    setMyGroup((prev) => prev ? { ...prev, name: editingName.trim() } : prev);
    setIsEditingName(false);
  };

  const handleConfirmLeader = async () => {
    if (!myGroup || !roomIdRef.current || !user) return;
    await fetch(`/api/rooms/${roomIdRef.current}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirmLeader', groupId: myGroup.id }),
    });
    setMyGroup((prev) => prev ? { ...prev, leaderConfirmedBy: [...(prev.leaderConfirmedBy ?? []), user.name] } : prev);
  };

  const handleReportLeave = async () => {
    if (!reportTarget || !myGroup || !roomIdRef.current || !user || reportSubmitting) return;
    setReportSubmitting(true);
    try {
      const res = await fetch(`/api/rooms/${roomIdRef.current}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reportLeave', groupId: myGroup.id, targetGmail: reportTarget.gmail }),
      });
      if (res.ok) {
        setLeaveRequests((prev) => [
          ...prev,
          {
            _id: `local-${reportTarget.gmail}`, groupId: myGroup.id,
            targetGmail: reportTarget.gmail, targetName: reportTarget.name,
            reporterGmail: user.gmail ?? '', reporterName: user.name,
          },
        ]);
      }
    } finally {
      setReportSubmitting(false);
      setReportTarget(null);
    }
  };


  const openChat = () => { setIsChatOpen(true); setTimeout(() => setIsChatVisible(true), 10); };
  const closeChat = () => { setIsChatVisible(false); setTimeout(() => setIsChatOpen(false), 300); };

  const roleIcons: Record<string, string> = {
    'นักวิเคราะห์': '/img/brain.png',
    'นักคิดสร้างสรรค์': '/img/idea.png',
    'ผู้ปฏิบัติการ': '/img/pencil.png',
    'นักประสานงาน': '/img/make.png',
    'นักสื่อสาร': '/img/make.png',
    'นักแก้ปัญหา': '/img/brain.png',
    'ผู้ฟัง': '/img/idea.png',
    'นักพูด': '/img/idea.png',
    'นักวิจัย': '/img/brain.png',
    'นักออกแบบ': '/img/pencil.png',
    'ผู้ประสานงาน': '/img/make.png',
    'นักสร้างสรรค์': '/img/idea.png',
    'ผู้ปฏิบัติ': '/img/pencil.png',
  };

  return (
    <div className="min-h-screen bg-[#1D324B] font-sans flex flex-col items-center">
      <Navbar bgColor="#122031" nameColor="white" />
      <div className="w-full lg:max-w-7xl lg:px-4 mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4">
        {/* Row 1: team name (left) + buttons (right, mobile only) */}
        <div className="flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-3">
            <button className="bg-[#FF9142] text-white px-6 sm:px-10 md:px-16 py-2.5 sm:py-3 rounded-tr-2xl rounded-br-2xl lg:rounded-tl-2xl lg:rounded-br-none font-bold text-base sm:text-lg md:text-xl shadow-lg truncate max-w-[45vw] sm:max-w-none">{myGroup?.name ?? 'My team'}</button>
            <button onClick={() => { setEditingName(myGroup?.name ?? ''); setIsEditingName(true); }} className="bg-[#2D3E50] p-2 rounded-full text-white hover:bg-slate-700 transition-colors flex-shrink-0"><Edit2 size={16} /></button>
          </div>
        </div>
        {/* Row 2 (mobile): blue bar flush left + buttons / Row right (desktop): blue bar + buttons */}
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="bg-[#7096D1] text-white px-4 sm:px-6 md:px-10 py-2.5 sm:py-3 rounded-tr-2xl lg:rounded-tl-2xl font-bold text-sm sm:text-lg md:text-xl flex items-center gap-2 sm:gap-3 shadow-inner min-w-0">
            <span className="truncate max-w-[30vw] lg:max-w-none">{roomTitle}</span>
            <span className="opacity-40">|</span>
            <span className="whitespace-nowrap">{myGroup ? myGroup.members.length : teamMembers.length} :Members</span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => router.push('/')} className="bg-[#2D3E50] p-2 rounded-lg text-white hover:bg-slate-700 transition-colors"><Home size={16} /></button>
            <MbtiTagLegend template={template} className="bg-[#2D3E50] p-2 rounded-full text-white hover:bg-slate-700 transition-colors flex items-center justify-center" />
          </div>
        </div>
      </div>

      <main className="w-full lg:max-w-7xl lg:px-4 flex-1 flex flex-col">
        <div className="bg-[#E5E7EB] lg:rounded-tr-[40px] p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 shadow-2xl">
          <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto">
            {!isMatched ? (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 flex flex-col items-center gap-3">
                <div className="text-5xl">⏳</div>
                <p className="font-bold text-gray-500">รอ Host จับกลุ่ม...</p>
                <p className="text-sm">ทีมจะปรากฏเมื่อ Host กด Match</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-1 -mb-2">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">สมาชิกในทีม</p>
                </div>
                <div className="flex flex-col gap-3">
                  {(myGroup?.members ?? teamMembers).map((member, idx) => {
                    const isCurrentUser = (user?.gmail && member.gmail === user.gmail) || member.name === user?.name;
                    const displayName = isCurrentUser ? (user?.name ?? member.name) : member.name;
                    const avatarUrl = resolveAvatar(member);
                    const showRole = member.role && member.role !== 'ไม่ระบุ';
                    const roleIcon = showRole ? roleIcons[member.role!] : null;
                    const mbtiType = memberTypes[member.name];
                    return (
                      <div key={idx} className="bg-white rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-2 shadow-sm">
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-gray-100">
                              <img src={avatarUrl} alt={member.name} className="w-full h-full object-contain" />
                            </div>
                            {isCurrentUser && (
                              <div className="absolute -bottom-1 -right-1 bg-[#2D3E50] text-white rounded-full p-1 border-2 border-white">
                                <User size={12} fill="currentColor" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-gray-800 text-sm sm:text-base md:text-lg truncate max-w-[30vw] sm:max-w-none">{displayName}</p>
                              {isCurrentUser && <span className="bg-[#7096D1] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">คุณ</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {!isManualRoom && showRole && (
                                <div className="flex items-center gap-1">
                                  {roleIcon && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: roleColor(roleIcon) }} />}
                                  <p className="text-xs text-gray-500 font-medium">{member.role}</p>
                                </div>
                              )}
                              {memberRoles[member.name] ? (
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${memberRoles[member.name] === 'host' ? 'bg-[#FF9142]/15 text-[#FF9142]' : 'bg-[#7096D1]/15 text-[#7096D1]'}`}>
                                  {memberRoles[member.name] === 'host' ? 'Host' : 'User'}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {myGroup?.leaderId === member.name && (
                            <div className="relative flex flex-col items-center">
                              {leaderTip && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#2D3E50] text-white text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-md">
                                  Team Leader
                                </div>
                              )}
                              <div
                                className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 flex items-center justify-center cursor-pointer"
                                onClick={() => { setLeaderTip(true); setTimeout(() => setLeaderTip(false), 3000); }}
                              >
                                <img src="/img/crown.PNG" alt="crown" className="w-full h-full object-contain" />
                              </div>
                            </div>
                          )}
                          {mbtiType ? (
                            <button
                              onClick={() => setPopup({ member, type: mbtiType })}
                              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center"
                              style={{ backgroundColor: `${mbtiType.code ? typeColor(mbtiType.code) : roleColor(mbtiType.icon)}26` }}
                            >
                              <span className="text-[9px] sm:text-[10px] md:text-[11px] font-black" style={{ color: mbtiType.code ? typeColor(mbtiType.code) : roleColor(mbtiType.icon) }}>
                                {mbtiType.code ?? mbtiType.title.slice(0, 2)}
                              </span>
                            </button>
                          ) : isManualRoom && member.role && member.role !== 'ไม่ระบุ' ? (
                            <button
                              onClick={() => setPopup({ member, type: { title: member.role!, icon: roleIcons[member.role!] ?? '/img/brain.png', description: 'บทบาทที่ได้รับมอบหมายในทีมนี้', jobs: [] } })}
                              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center"
                              style={{ backgroundColor: `${roleColor(roleIcons[member.role!] ?? '/img/brain.png')}26` }}
                            >
                              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-center px-1" style={{ color: roleColor(roleIcons[member.role!] ?? '/img/brain.png') }}>
                                {member.role!.slice(0, 2)}
                              </span>
                            </button>
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gray-100" />
                          )}
                          {!isCurrentUser && (() => {
                            const alreadyReported = leaveRequests.some(
                              (r) => r.groupId === myGroup?.id && r.targetGmail === member.gmail && r.reporterGmail === user?.gmail
                            );
                            return alreadyReported ? (
                              <span className="text-[8px] text-amber-500 font-bold text-center leading-tight w-8">แจ้งแล้ว รอ Host</span>
                            ) : (
                              <button
                                onClick={() => setReportTarget(member)}
                                title="แจ้งว่าออกจากกลุ่ม"
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors flex-shrink-0"
                              >
                                <UserMinus size={14} />
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {myGroup?.leaderId && (myGroup.leaderConfirmedBy?.length ?? 0) < myGroup.members.length && (
                  <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm gap-3">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">หัวหน้าทีม</p>
                      <p className="font-bold text-gray-800">{myGroup.leaderId}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        ยืนยันแล้ว {myGroup.leaderConfirmedBy?.length ?? 0}/{myGroup.members.length} คน
                      </p>
                    </div>
                    {user && myGroup.leaderConfirmedBy?.includes(user.name) ? (
                      <span className="text-[#608BC1] text-sm font-bold flex items-center gap-1 flex-shrink-0"><Check size={16} /> ยืนยันแล้ว</span>
                    ) : (
                      <button
                        onClick={handleConfirmLeader}
                        className="bg-[#608BC1] text-white px-4 py-2 rounded-xl font-bold text-sm hover:brightness-95 transition-all active:scale-95 flex-shrink-0"
                      >
                        ยืนยันหัวหน้าทีม
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="mt-auto flex flex-col gap-2">
              <p className="text-gray-500 text-xs font-medium text-center">&quot;Choose a team leader&quot;</p>
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => router.push('/join/vote')} className="bg-white rounded-[20px] p-4 flex flex-col items-center gap-2 shadow-sm border-b-4 border-gray-200 cursor-pointer hover:brightness-95 transition-all">
                  <span className="font-bold text-gray-700">Vote</span>
                  <div className="w-24 h-24 flex items-center justify-center"><img src="/img/vote.PNG" alt="Vote Icon" className="w-full h-full object-contain" /></div>
                </div>
                <div onClick={() => router.push('/join/analyze')} className="bg-white rounded-[20px] p-4 flex flex-col items-center gap-2 shadow-sm border-b-4 border-gray-200 cursor-pointer hover:brightness-95 transition-all">
                  <span className="font-bold text-gray-700">Analyze</span>
                  <div className="w-24 h-24 flex items-center justify-center"><img src="/img/analyze.PNG" alt="Analyze Icon" className="w-full h-full object-contain" /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Mobile mini chat — tap to open full screen */}
            <div className="lg:hidden bg-white rounded-[20px] overflow-hidden shadow-inner cursor-pointer" onClick={openChat}>
              <div className="p-3 bg-[#BACEE0] flex flex-col gap-2 min-h-[60px]">
                <p className="text-[10px] text-gray-500 text-center font-medium">แตะเพื่อดูแชทแบบเต็ม</p>
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-gray-500 py-3">ยังไม่มีข้อความ — แตะเพื่อเริ่มแชท</p>
                ) : (
                  messages.slice(-6).map((msg) => {
                    const isMe = msg.sender === user?.name;
                    return (
                      <div key={msg.id} className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                        {!isMe && (
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                            <img src={(() => { const found = (myGroup?.members ?? teamMembers).find((m) => m.name === msg.sender); return found ? resolveAvatar(found) : resolveAvatar({ avatarSeed: msg.avatarSeed, avatarImage: msg.avatarImage }); })()} alt={msg.sender} className="w-full h-full object-contain" />
                          </div>
                        )}
                        <div className={`px-3 py-1.5 text-xs font-medium shadow-sm max-w-[65%] ${isMe ? 'bg-[#00B900] text-white rounded-t-2xl rounded-bl-2xl rounded-br' : 'bg-white text-gray-800 rounded-t-2xl rounded-br-2xl rounded-bl'}`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="px-4 py-2.5 bg-white border-t border-gray-100 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="เริ่มแชท......"
                  className="flex-1 text-sm text-gray-700 bg-transparent focus:outline-none"
                />
                <button onClick={handleSend} className="text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0">
                  <Send size={15} />
                </button>
              </div>
            </div>

            {/* Desktop full chat */}
            <div className="hidden lg:flex bg-white rounded-[20px] flex-col overflow-hidden shadow-inner h-full">
              <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-[#BACEE0]">
                {isLoadingMessages ? (
                  <>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                        {i % 2 !== 0 && <div className="w-11 h-11 rounded-full bg-white/50 animate-pulse flex-shrink-0" />}
                        <div className={`flex flex-col gap-1 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                          {i % 2 !== 0 && <div className="h-3 w-16 bg-white/50 rounded-full animate-pulse mb-1" />}
                          <div className={`h-9 rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-[#00B900]/40 w-36' : 'bg-white/60 w-44'}`} style={{ width: `${[144, 176, 120, 200][i]}px` }} />
                        </div>
                      </div>
                    ))}
                  </>
                ) : null}
                {!isLoadingMessages && messages.map((msg) => {
                  const isMe = msg.sender === user?.name;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      {!isMe && (
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 self-end">
                          <img src={(() => { const found = (myGroup?.members ?? teamMembers).find((m) => m.name === msg.sender); return found ? resolveAvatar(found) : resolveAvatar({ avatarSeed: msg.avatarSeed, avatarImage: msg.avatarImage }); })()} alt={msg.sender} className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                        {!isMe && <span className="text-xs text-gray-600 mb-1 px-1 font-medium">{msg.sender}</span>}
                        <div className="flex items-end gap-1.5">
                          {isMe && <span className="text-[10px] text-gray-500 whitespace-nowrap flex-shrink-0 mb-0.5">{msg.time}</span>}
                          <div className={`px-4 py-2 text-sm font-medium shadow-sm ${isMe ? 'bg-[#00B900] text-white rounded-t-2xl rounded-bl-2xl rounded-br' : 'bg-white text-gray-800 rounded-t-2xl rounded-br-2xl rounded-bl'}`}>{msg.text}</div>
                          {!isMe && <span className="text-[10px] text-gray-500 whitespace-nowrap flex-shrink-0 mb-0.5">{msg.time}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="เริ่มแชท......" className="flex-1 bg-gray-50 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-700" />
                <button onClick={handleSend} className="w-14 h-14 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-100 transition-all">
                  <Send size={28} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile full-screen chat modal */}
      {isChatOpen && (
        <div className={`fixed inset-0 z-50 flex flex-col lg:hidden bg-[#BACEE0] transition-transform duration-300 ease-in-out ${isChatVisible ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center justify-between px-4 py-3 bg-[#122031] flex-shrink-0">
            <p className="text-white font-bold text-base truncate">{roomTitle}</p>
            <button onClick={closeChat} className="text-white p-1 hover:opacity-70 transition-opacity"><X size={22} /></button>
          </div>
          <div className="flex-1 relative overflow-hidden">
            {/* Member avatars row — absolute overlay so messages scroll behind it */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 py-3 bg-[#1D324B]/40 backdrop-blur-md overflow-x-auto">
              {(myGroup?.members ?? teamMembers).map((member, idx) => {
                const isMe = (user?.gmail && member.gmail === user.gmail) || member.name === user?.name;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-white/20">
                        <img src={resolveAvatar(member)} alt={member.name} className="w-full h-full object-contain" />
                      </div>
                      {isMe && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1D324B]" />}
                    </div>
                    <span className="text-[9px] text-white/70 font-medium truncate max-w-[44px] text-center">{isMe ? 'คุณ' : member.name.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
            <div ref={mobileChatRef} className="h-full p-4 pt-[84px] overflow-y-auto flex flex-col gap-3">
            {messages.length === 0 && <p className="text-center text-sm text-gray-500 mt-8">ยังไม่มีข้อความ</p>}
            {messages.map((msg) => {
              const isMe = msg.sender === user?.name;
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 self-end">
                      <img src={(() => { const found = (myGroup?.members ?? teamMembers).find((m) => m.name === msg.sender); return found ? resolveAvatar(found) : resolveAvatar({ avatarSeed: msg.avatarSeed, avatarImage: msg.avatarImage }); })()} alt={msg.sender} className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    {!isMe && <span className="text-xs text-gray-600 mb-1 px-1 font-medium">{msg.sender}</span>}
                    <div className="flex items-end gap-1.5">
                      {isMe && <span className="text-[10px] text-gray-500 whitespace-nowrap flex-shrink-0 mb-0.5">{msg.time}</span>}
                      <div className={`px-4 py-2 text-sm font-medium shadow-sm ${isMe ? 'bg-[#00B900] text-white rounded-t-2xl rounded-bl-2xl rounded-br' : 'bg-white text-gray-800 rounded-t-2xl rounded-br-2xl rounded-bl'}`}>{msg.text}</div>
                      {!isMe && <span className="text-[10px] text-gray-500 whitespace-nowrap flex-shrink-0 mb-0.5">{msg.time}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
          <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="เริ่มแชท......" className="flex-1 bg-gray-50 rounded-2xl py-3 px-5 focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-700" />
            <button onClick={handleSend} className="w-12 h-12 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-100 transition-all">
              <Send size={22} />
            </button>
          </div>
        </div>
      )}

      {/* Room Deleted Modal */}
      {roomDeleted && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] w-full max-w-sm p-8 flex flex-col items-center gap-5 shadow-2xl">
            <div className="text-5xl">🗑️</div>
            <p className="text-xl font-black text-gray-800 text-center">ห้องนี้ถูกลบแล้ว</p>
            <p className="text-gray-500 text-sm text-center">ผู้สร้างห้องได้ลบห้องนี้ออกไปแล้ว</p>
            <button onClick={() => router.push('/')}
              className="w-full bg-[#2D3E50] text-white py-3 rounded-2xl font-bold hover:bg-slate-700 transition-all active:scale-95">
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      )}

      {/* Report Member Left Modal */}
      {reportTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setReportTarget(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-black text-gray-800 mb-2">แจ้งว่าออกจากกลุ่ม</p>
            <p className="text-gray-500 text-sm mb-6">
              แจ้ง Host ว่า <span className="font-bold text-gray-700">{reportTarget.name}</span> ออกจากกลุ่มนี้แล้ว?
              Host จะเป็นคนตัดสินใจเอาออกจากกลุ่มจริงอีกที
            </p>
            <div className="flex gap-3">
              <button onClick={() => setReportTarget(null)} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-all">ยกเลิก</button>
              <button
                onClick={handleReportLeave}
                disabled={reportSubmitting}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all active:scale-95 disabled:opacity-60"
              >
                {reportSubmitting ? 'กำลังส่ง...' : 'ยืนยันแจ้ง'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Name Modal */}
      {isEditingName && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setIsEditingName(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-black text-gray-800 mb-4">แก้ไขชื่อทีม</p>
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-800 font-bold text-lg focus:outline-none focus:border-[#7096D1]"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setIsEditingName(false)} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-all">ยกเลิก</button>
              <button onClick={handleSaveName} className="flex-1 py-3 rounded-2xl bg-[#FF9142] text-white font-bold hover:brightness-95 transition-all active:scale-95">บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* MBTI Type Popup */}
      {popup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setPopup(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: `${popup.type.code ? typeColor(popup.type.code) : roleColor(popup.type.icon)}1A` }}
                >
                  {popup.type.code && TYPE_IMAGES[popup.type.code] ? (
                    <img src={TYPE_IMAGES[popup.type.code]} alt={popup.type.code} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-lg font-black" style={{ color: popup.type.code ? typeColor(popup.type.code) : roleColor(popup.type.icon) }}>
                        {popup.type.code ?? popup.type.title.slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{isManualRoom ? 'บทบาทในทีม' : 'ประเภทบุคลิกภาพ'}</p>
                  <p className="text-xl font-black text-[#4B3E7A]">{popup.type.title}</p>
                  <p className="text-sm text-gray-500 font-medium">{popup.member.name}</p>
                </div>
              </div>
              <button onClick={() => setPopup(null)} className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            {popup.type.description && (
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{popup.type.description}</p>
            )}
            {popup.type.jobs?.length > 0 && (
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">ตำแหน่งงานที่เหมาะสม</p>
                <div className="flex flex-wrap gap-2">
                  {popup.type.jobs.map((job) => (
                    <span key={job} className="bg-[#EDE9FF] text-[#4B3E7A] text-xs font-bold px-3 py-1.5 rounded-full">{job}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}