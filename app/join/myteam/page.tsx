'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, Home, Info, Send, User, X } from 'lucide-react';
import Navbar from '../../navbar/page';

interface ChatMessage { id: string; sender: string; text: string; time: string; avatarSeed?: number; }
interface RoomMember { name: string; avatarSeed: number; gmail: string; role?: string; }
interface MatchedGroup { id: number; name: string; members: RoomMember[]; leaderId?: string; }
interface CurrentRoom {
  id: string; roomId?: string; title: string; totalMembers: number;
  groupSize: number; template: string; hostName: string; hostAvatarSeed: number; members: RoomMember[];
}
interface MBTIResult { title: string; icon: string; description: string; jobs: string[]; }

export default function MyTeamPage() {
  const router = useRouter();
  const [user, setUser]               = useState<{ name: string; avatarSeed: number; gmail?: string } | null>(null);
  const [teamMembers, setTeamMembers] = useState<RoomMember[]>([]);
  const [myGroup, setMyGroup]         = useState<MatchedGroup | null>(null);
  const [message, setMessage]         = useState('');
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [isMatched, setIsMatched]     = useState(false);
  const [memberTypes, setMemberTypes] = useState<Record<string, MBTIResult>>({});
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});
const [popup, setPopup]             = useState<{ member: RoomMember; type: MBTIResult } | null>(null);
  const [roomDeleted, setRoomDeleted] = useState(false);
  const [isManualRoom, setIsManualRoom]   = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName]     = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [roomTitle, setRoomTitle] = useState('');
  const [leaderTip, setLeaderTip] = useState(false);
  const roomIdRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
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
    const isManual = room.matchMode === 'selection';
    setIsManualRoom(isManual);
    if (room.matchedGroups?.length) {
      const mine = room.matchedGroups.find((g: MatchedGroup) => g.members.some((m) => (userGmail && m.gmail === userGmail) || m.name === userName));
      if (mine) {
        setMyGroup(mine);
        groupIdRef.current = mine.id;

        const currentUserRaw = localStorage.getItem('currentUser');
        const currentUserLocal = currentUserRaw ? JSON.parse(currentUserRaw) : null;

        // manual mode ใช้ member.role โดยตรง ไม่ต้อง fetch memberTypes จาก API
        if (!isManual && !memberTypesFetchedRef.current) {
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
              const t = localType as { title: string; icon: string; description?: string; jobs?: string[] };
              types[currentUserLocal.name] = { title: t.title, icon: t.icon, description: t.description ?? '', jobs: t.jobs ?? [] };
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
    setMessages((data.messages ?? []).map((m: any) => ({ ...m, id: m._id ?? m.id })));
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

    fetchRoomData(roomId, currentUser.name, currentUser.gmail);
    fetchMessages(roomId);

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

  const handleSend = async () => {
    if (!message.trim() || !user || !roomIdRef.current) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    const optimistic: ChatMessage = { id: Date.now().toString(), sender: user.name, text: message.trim(), time, avatarSeed: user.avatarSeed };
    setMessages((prev) => [...prev, optimistic]);
    setMessage('');
    setTimeout(() => {
      if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }, 50);

    await fetch(`/api/rooms/${roomIdRef.current}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: user.name, text: optimistic.text, time, avatarSeed: user.avatarSeed, groupId: groupIdRef.current ?? 0 }),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleSend(); };

  const handleSaveName = async () => {
    if (!editingName.trim() || !myGroup || !roomIdRef.current) return;
    const res = await fetch(`/api/rooms/${roomIdRef.current}`);
    if (!res.ok) return;
    const data = await res.json();
    const groups: MatchedGroup[] = data.room?.matchedGroups ?? [];
    const updated = groups.map((g) => g.id === myGroup.id ? { ...g, name: editingName.trim() } : g);
    await fetch(`/api/rooms/${roomIdRef.current}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchedGroups: updated }),
    });
    setMyGroup((prev) => prev ? { ...prev, name: editingName.trim() } : prev);
    setIsEditingName(false);
  };


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
      <div className="w-full max-w-7xl px-6 mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="bg-[#FF9142] text-white px-16 py-3 rounded-t-2xl font-bold text-xl shadow-lg">{myGroup?.name ?? 'My team'}</button>
          <button onClick={() => { setEditingName(myGroup?.name ?? ''); setIsEditingName(true); }} className="bg-[#2D3E50] p-3 rounded-full text-white hover:bg-slate-700 transition-colors"><Edit2 size={20} /></button>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-[#7096D1] text-white px-10 py-3 rounded-tl-2xl rounded-tr-2xl font-bold text-xl flex items-center gap-3 shadow-inner">
            <span>{roomTitle}</span>
            <span className="opacity-40">|</span>
            <span>{myGroup ? myGroup.members.length : teamMembers.length} :Members</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/')} className="bg-[#2D3E50] p-3 rounded-lg text-white hover:bg-slate-700 transition-colors"><Home size={20} /></button>
            <button onClick={() => router.push('/join/myroom')} className="bg-[#2D3E50] p-3 rounded-full text-white hover:bg-slate-700 transition-colors"><Info size={20} /></button>
          </div>
        </div>
      </div>

      <main className="w-full max-w-7xl px-6 pb-12">
        <div className="bg-[#E5E7EB] rounded-b-[40px] rounded-tr-[40px] p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[590px] shadow-2xl">
          <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto">
            {!isMatched ? (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 flex flex-col items-center gap-3">
                <div className="text-5xl">⏳</div>
                <p className="font-bold text-gray-500">รอ Host จับกลุ่ม...</p>
                <p className="text-sm">ทีมจะปรากฏเมื่อ Host กด Match</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {(myGroup?.members ?? teamMembers).map((member, idx) => {
                    const isCurrentUser = (user?.gmail && member.gmail === user.gmail) || member.name === user?.name;
                    const displayName = isCurrentUser ? (user?.name ?? member.name) : member.name;
                    const avatarUrl = `/img/p${member.avatarSeed || 1}.PNG`;
                    const showRole = member.role && member.role !== 'ไม่ระบุ';
                    const roleIcon = showRole ? roleIcons[member.role!] : null;
                    const mbtiType = memberTypes[member.name];
                    return (
                      <div key={idx} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                              <img src={avatarUrl} alt={member.name} className="w-full h-full object-contain" />
                            </div>
                            {isCurrentUser && (
                              <div className="absolute -bottom-1 -right-1 bg-[#2D3E50] text-white rounded-full p-1 border-2 border-white">
                                <User size={12} fill="currentColor" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-gray-800 text-lg">{displayName}</p>
                              {isCurrentUser && <span className="bg-[#7096D1] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">คุณ</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {showRole && (
                                <div className="flex items-center gap-1">
                                  {roleIcon && <img src={roleIcon} alt={member.role} className="w-4 h-4 object-contain" />}
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
                                className="w-16 h-16 flex items-center justify-center cursor-pointer"
                                onClick={() => { setLeaderTip(true); setTimeout(() => setLeaderTip(false), 3000); }}
                              >
                                <img src="/img/crown.PNG" alt="crown" className="w-full h-full object-contain" />
                              </div>
                            </div>
                          )}
                          {isManualRoom ? (
                            member.role && member.role !== 'ไม่ระบุ' ? (
                              <button
                                onClick={() => setPopup({ member, type: { title: member.role!, icon: roleIcons[member.role!] ?? '/img/brain.png', description: 'บทบาทที่ได้รับมอบหมายในทีมนี้', jobs: [] } })}
                                className="w-16 h-16 rounded-full overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
                              >
                                <img src={roleIcons[member.role!] ?? '/img/brain.png'} alt={member.role} className="w-full h-full object-contain" />
                              </button>
                            ) : <div className="w-16 h-16 rounded-full bg-gray-100" />
                          ) : mbtiType ? (
                            <button onClick={() => setPopup({ member, type: mbtiType })} className="w-16 h-16 rounded-full overflow-hidden hover:opacity-80 transition-opacity cursor-pointer">
                              <img src={mbtiType.icon} alt={mbtiType.title} className="w-full h-full object-contain" />
                            </button>
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-100" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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

          <div className="lg:col-span-7 bg-white rounded-[20px] flex flex-col overflow-hidden shadow-inner">
            <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-[#BACEE0]">
              {isLoadingMessages ? (
                <>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                      {i % 2 !== 0 && <div className="w-11 h-11 rounded-full bg-white/50 animate-pulse flex-shrink-0" />}
                      <div className={`flex flex-col gap-1 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                        {i % 2 !== 0 && <div className="h-3 w-16 bg-white/50 rounded-full animate-pulse mb-1" />}
                        <div className={`h-9 rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-[#00B900]/40 w-36' : 'bg-white/60 w-44'} ${[28, 44, 32, 52][i] ? '' : ''}`}
                          style={{ width: `${[144, 176, 120, 200][i]}px` }} />
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
                        <img
                          src={(() => {
                            const seed = (myGroup?.members ?? teamMembers).find((m) => m.name === msg.sender)?.avatarSeed ?? msg.avatarSeed;
                            return `/img/p${seed || 1}.PNG`;
                          })()}
                          alt={msg.sender}
                          className="w-full h-full object-contain"
                        />
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
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
              <input
                type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="เริ่มแชท......" className="flex-1 bg-gray-50 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-700"
              />
              <button onClick={handleSend} className="w-14 h-14 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-100 transition-all">
                <Send size={28} />
              </button>
            </div>
          </div>
        </div>
      </main>

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
                <img src={popup.type.icon} alt={popup.type.title} className="w-24 h-24 object-contain" />
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
