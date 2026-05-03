'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, List, Info, Send, User, X } from 'lucide-react';
import Navbar from '../../navbar/page';

interface ChatMessage { id: string; sender: string; text: string; time: string; avatarSeed?: number; }
interface RoomMember { name: string; avatarSeed: number; gmail: string; role?: string; }
interface MatchedGroup { id: number; name: string; members: RoomMember[]; leaderId?: string; }
interface CurrentRoom {
  id: string; roomId?: string; title: string; totalMembers: number;
  groupSize: number; template: string; hostName: string; hostAvatarSeed: number; members: RoomMember[];
}
interface MBTIResult { title: string; icon: string; description: string; jobs: string[]; }
interface UserProfile { name: string; role?: string; types?: Record<string, MBTIResult>; }

export default function MyTeamPage() {
  const router = useRouter();
  const [user, setUser]               = useState<{ name: string; avatarSeed: number } | null>(null);
  const [teamMembers, setTeamMembers] = useState<RoomMember[]>([]);
  const [myGroup, setMyGroup]         = useState<MatchedGroup | null>(null);
  const [message, setMessage]         = useState('');
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [isMatched, setIsMatched]     = useState(false);
  const [memberTypes, setMemberTypes] = useState<Record<string, MBTIResult>>({});
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});
  const [roomTemplate, setRoomTemplate] = useState('');
  const [popup, setPopup]             = useState<{ member: RoomMember; type: MBTIResult } | null>(null);
  const [roomDeleted, setRoomDeleted] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName]     = useState('');
  const roomIdRef = useRef<string>('');
  const groupIdRef = useRef<number | null>(null);
  const memberTypesFetchedRef = useRef(false);

  // แปลง template label → ID (รองรับ rooms เก่าที่เก็บ label เช่น 'PROGRAMMING')
  const LABEL_TO_ID: Record<string, string> = {
    'programming': 'programming',
    'service': 'service',
    'customer / service': 'service',
    'presentation': 'presentation',
    'design': 'design',
    'design / creative': 'design',
  };

  const getRoomId = (r: CurrentRoom) => r.roomId ?? r.id;

  const fetchRoomData = async (roomId: string, userName: string) => {
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
    setRoomTemplate(room.template ?? '');
    if (room.matchedGroups?.length) {
      const mine = room.matchedGroups.find((g: MatchedGroup) => g.members.some((m) => m.name === userName));
      if (mine) {
        setMyGroup(mine);
        groupIdRef.current = mine.id;
        if (!memberTypesFetchedRef.current) {
          memberTypesFetchedRef.current = true;
          const rawTemplate = (room.template ?? '').toLowerCase();
          const templateKey = LABEL_TO_ID[rawTemplate] ?? rawTemplate;
          const allMembers: RoomMember[] = room.members ?? [];
          const types: Record<string, MBTIResult> = {};
          const roles: Record<string, string> = {};
          // ดึง currentUser จาก localStorage เพื่อใช้เป็น fallback ของ gmail และ type
          const currentUserRaw = localStorage.getItem('currentUser');
          const currentUserLocal = currentUserRaw ? JSON.parse(currentUserRaw) : null;
          await Promise.all(mine.members.map(async (member: RoomMember) => {
            // gmail fallback: matchedGroups → room.members → currentUser (กรณีเป็น user ปัจจุบัน)
            const gmail =
              member.gmail ||
              allMembers.find((m) => m.name === member.name)?.gmail ||
              (member.name === currentUserLocal?.name ? currentUserLocal?.gmail : '') ||
              '';
            try {
              // ถ้าหา gmail ไม่ได้ ให้ fallback ค้นหาด้วย name แทน
              const url = gmail
                ? `/api/users?gmail=${encodeURIComponent(gmail)}`
                : `/api/users?name=${encodeURIComponent(member.name)}`;
              const res = await fetch(url);
              if (!res.ok) return;
              const data = await res.json();
              const profile: UserProfile = data.user;
              if (profile?.role) roles[member.name] = profile.role;
              const typeResult = profile?.types?.[templateKey];
              if (typeResult) {
                types[member.name] = {
                  title: typeResult.title,
                  icon: typeResult.icon,
                  description: typeResult.description ?? '',
                  jobs: typeResult.jobs ?? [],
                };
              }
            } catch { /* ignore network errors */ }
          }));
          // fallback สุดท้าย: ใช้ type จาก localStorage ของ currentUser ถ้ายังไม่มี
          if (currentUserLocal?.name && currentUserLocal?.types?.[templateKey] && !types[currentUserLocal.name]) {
            const t = currentUserLocal.types[templateKey];
            types[currentUserLocal.name] = {
              title: t.title,
              icon: t.icon,
              description: t.description ?? '',
              jobs: t.jobs ?? [],
            };
          }
          if (currentUserLocal?.name && currentUserLocal?.role && !roles[currentUserLocal.name]) {
            roles[currentUserLocal.name] = currentUserLocal.role;
          }
          // fallback: ถ้ายังไม่มี type ให้ใช้ icon จาก member.role (MBTI title จาก matching)
          const roleToIcon: Record<string, string> = {
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
          mine.members.forEach((member: RoomMember) => {
            if (!types[member.name] && member.role && member.role !== 'ไม่ระบุ') {
              const icon = roleToIcon[member.role];
              if (icon) types[member.name] = { title: member.role, icon, description: '', jobs: [] };
            }
          });
          setMemberRoles(roles);
          setMemberTypes(types);
          // ถ้าได้ type ไม่ครบทุกคน ให้ลองใหม่รอบถัดไป
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
    if (!res.ok) return;
    const data = await res.json();
    setMessages((data.messages ?? []).map((m: any) => ({ ...m, id: m._id ?? m.id })));
  };

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return;
    const currentUser = JSON.parse(raw);
    setUser(currentUser);

    const roomRaw = localStorage.getItem('currentRoom');
    if (!roomRaw) return;
    const room: CurrentRoom = JSON.parse(roomRaw);
    const roomId = getRoomId(room);
    roomIdRef.current = roomId;

    fetchRoomData(roomId, currentUser.name);
    fetchMessages(roomId);

    const interval = setInterval(() => {
      fetchRoomData(roomId, currentUser.name);
      fetchMessages(roomId);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!message.trim() || !user || !roomIdRef.current) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    const optimistic: ChatMessage = { id: Date.now().toString(), sender: user.name, text: message.trim(), time, avatarSeed: user.avatarSeed };
    setMessages((prev) => [...prev, optimistic]);
    setMessage('');

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
    <div className="min-h-screen bg-[#1A2635] font-sans flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-7xl px-6 mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="bg-[#FF9142] text-white px-8 py-3 rounded-t-2xl font-bold text-xl shadow-lg">{myGroup?.name ?? 'My team'}</button>
          <button onClick={() => { setEditingName(myGroup?.name ?? ''); setIsEditingName(true); }} className="bg-[#2D3E50] p-3 rounded-full text-white hover:bg-slate-700 transition-colors"><Edit2 size={20} /></button>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-[#7096D1] text-white px-10 py-3 rounded-full font-bold text-xl flex items-center gap-2 shadow-inner">{myGroup ? myGroup.members.length : teamMembers.length} :Members</div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/join/myroom')} className="bg-[#2D3E50] p-3 rounded-lg text-white hover:bg-slate-700 transition-colors"><List size={20} /></button>
            <button onClick={() => router.push('/join/myroom')} className="bg-[#2D3E50] p-3 rounded-full text-white hover:bg-slate-700 transition-colors"><Info size={20} /></button>
          </div>
        </div>
      </div>

      <main className="w-full max-w-7xl px-6 pb-12">
        <div className="bg-[#E5E7EB] rounded-b-[40px] rounded-tr-[40px] p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] shadow-2xl">
          <div className="lg:col-span-5 flex flex-col gap-6">
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
                    const isCurrentUser = member.name === user?.name;
                    const avatarUrl = member.avatarSeed
                      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed + 100}`
                      : `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`;
                    const showRole = member.role && member.role !== 'ไม่ระบุ';
                    const roleIcon = showRole ? roleIcons[member.role!] : null;
                    const mbtiType = memberTypes[member.name];
                    return (
                      <div key={idx} className={`bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border-2 ${isCurrentUser ? 'border-[#7096D1]' : 'border-transparent'}`}>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100">
                              <img src={avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                            </div>
                            {isCurrentUser && (
                              <div className="absolute -bottom-1 -right-1 bg-[#2D3E50] text-white rounded-full p-1 border-2 border-white">
                                <User size={12} fill="currentColor" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-gray-800 text-lg">{member.name}</h4>
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
                          {myGroup?.leaderId === member.name && <span className="text-4xl leading-none">👑</span>}
                          {mbtiType ? (
                            <button onClick={() => setPopup({ member, type: mbtiType })} className="w-12 h-12 rounded-full overflow-hidden hover:opacity-80 transition-opacity cursor-pointer">
                              <img src={mbtiType.icon} alt={mbtiType.title} className="w-full h-full object-contain" />
                            </button>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-100" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="w-full bg-[#7096D1] text-white py-4 rounded-2xl font-bold text-xl text-center select-none">&quot;Choose a team leader&quot;</div>
            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div onClick={() => router.push('/join/vote')} className="bg-white rounded-[30px] p-4 flex flex-col items-center gap-2 shadow-sm border-b-4 border-gray-200 cursor-pointer hover:brightness-95 transition-all">
                <span className="font-bold text-gray-700">Vote</span>
                <div className="w-24 h-24 flex items-center justify-center"><img src="https://cdn-icons-png.flaticon.com/512/3050/3050525.png" alt="Vote Icon" className="w-full h-full object-contain" /></div>
              </div>
              <div onClick={() => router.push('/join/analyze')} className="bg-white rounded-[30px] p-4 flex flex-col items-center gap-2 shadow-sm border-b-4 border-gray-200 cursor-pointer hover:brightness-95 transition-all">
                <span className="font-bold text-gray-700">Analyze</span>
                <div className="w-24 h-24 flex items-center justify-center"><img src="https://cdn-icons-png.flaticon.com/512/2620/2620703.png" alt="Analyze Icon" className="w-full h-full object-contain" /></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-[30px] flex flex-col overflow-hidden shadow-inner">
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
              {messages.map((msg) => {
                const isMe = msg.sender === user?.name;
                return (
                  <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!isMe && (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={(() => {
                            const seed = msg.avatarSeed ?? (myGroup?.members ?? teamMembers).find((m) => m.name === msg.sender)?.avatarSeed;
                            return seed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed + 100}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`;
                          })()}
                          alt={msg.sender}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      {!isMe && <span className="text-xs text-gray-400 mb-1 px-1">{msg.sender}</span>}
                      <div className={`px-5 py-3 rounded-3xl font-medium text-lg shadow-sm ${isMe ? 'bg-[#7096D1] text-white rounded-br-none' : 'bg-gray-600 text-white rounded-bl-none'}`}>{msg.text}</div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  </div>
                );
              })}
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
          <div className="bg-white rounded-[30px] w-full max-w-sm p-8 flex flex-col items-center gap-5 shadow-2xl">
            <div className="text-5xl">🗑️</div>
            <h2 className="text-xl font-black text-gray-800 text-center">ห้องนี้ถูกลบแล้ว</h2>
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
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-black text-gray-800 mb-4">แก้ไขชื่อทีม</h2>
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
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src={popup.type.icon} alt={popup.type.title} className="w-14 h-14 object-contain" />
                <div>
                  <p className="text-xs text-gray-400 font-medium">ประเภทบุคลิกภาพ</p>
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
