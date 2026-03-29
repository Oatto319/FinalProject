'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, List, Info, Send, User } from 'lucide-react';
import Navbar from '../../navbar/page';

interface ChatMessage { id: string; sender: string; text: string; time: string; avatarSeed?: number; }
interface RoomMember { name: string; avatarSeed: number; gmail: string; role?: string; }
interface MatchedGroup { id: number; name: string; members: RoomMember[]; leaderId?: string; }
interface CurrentRoom {
  id: string; roomId?: string; title: string; totalMembers: number;
  groupSize: number; template: string; hostName: string; hostAvatarSeed: number; members: RoomMember[];
}

export default function MyTeamPage() {
  const router = useRouter();
  const [user, setUser]             = useState<{ name: string; avatarSeed: number } | null>(null);
  const [teamMembers, setTeamMembers] = useState<RoomMember[]>([]);
  const [myGroup, setMyGroup]       = useState<MatchedGroup | null>(null);
  const [message, setMessage]       = useState('');
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [isMatched, setIsMatched]   = useState(false);
  const roomIdRef = useRef<string>('');

  const getRoomId = (r: CurrentRoom) => r.roomId ?? r.id;

  const fetchRoomData = async (roomId: string, userName: string) => {
    const res = await fetch(`/api/rooms/${roomId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (!data.room) return;
    const room = data.room;
    setIsMatched(!!room.matchDone);
    setTeamMembers(room.members ?? []);
    if (room.matchedGroups?.length) {
      const mine = room.matchedGroups.find((g: MatchedGroup) => g.members.some((m) => m.name === userName));
      if (mine) setMyGroup(mine);
    }
  };

  const fetchMessages = async (roomId: string) => {
    const res = await fetch(`/api/rooms/${roomId}/messages`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
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
      body: JSON.stringify({ sender: user.name, text: optimistic.text, time, avatarSeed: user.avatarSeed }),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleSend(); };

  return (
    <div className="min-h-screen bg-[#1A2635] font-sans flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-7xl px-6 mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="bg-[#FF9142] text-white px-8 py-3 rounded-t-2xl font-bold text-xl shadow-lg">My team</button>
          <button onClick={() => alert('แก้ไขชื่อทีม')} className="bg-[#2D3E50] p-3 rounded-full text-white hover:bg-slate-700 transition-colors"><Edit2 size={20} /></button>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-[#7096D1] text-white px-10 py-3 rounded-full font-bold text-xl flex items-center gap-2 shadow-inner">{teamMembers.length} :Members</div>
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
                {myGroup && (
                  <div className="bg-[#2D3E50] text-white rounded-2xl px-6 py-3 text-center font-black text-xl">{myGroup.name}</div>
                )}
                <div className="flex flex-col gap-3">
                  {(myGroup?.members ?? teamMembers).map((member, idx) => {
                    const isCurrentUser = member.name === user?.name;
                    const avatarUrl = member.avatarSeed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed + 100}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`;
                    const roleIcons: Record<string, string> = { 'นักวิเคราะห์': '/img/brain.png', 'นักสร้างสรรค์': '/img/idea.png', 'ผู้ปฏิบัติ': '/img/pencil.png', 'ผู้ประสานงาน': '/img/make.png' };
                    const roleIcon = member.role ? roleIcons[member.role] : null;
                    return (
                      <div key={idx} className={`bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border-2 ${isCurrentUser ? 'border-[#7096D1]' : 'border-transparent'}`}>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100"><img src={avatarUrl} alt={member.name} className="w-full h-full object-cover" /></div>
                            {isCurrentUser && <div className="absolute -bottom-1 -right-1 bg-[#2D3E50] text-white rounded-full p-1 border-2 border-white"><User size={12} fill="currentColor" /></div>}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {myGroup?.leaderId === member.name && <span className="text-lg">👑</span>}
                              <h4 className="font-bold text-gray-800 text-lg">{member.name}</h4>
                              {isCurrentUser && <span className="bg-[#7096D1] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">คุณ</span>}
                            </div>
                            {member.role && (
                              <div className="flex items-center gap-1 mt-0.5">
                                {roleIcon && <img src={roleIcon} alt={member.role} className="w-4 h-4 object-contain" />}
                                <p className="text-xs text-gray-500 font-medium">{member.role}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <button onClick={() => alert(`ดูโปรไฟล์: ${member.name}`)} className="w-12 h-12 rounded-full bg-[#7086D1] flex items-center justify-center text-white text-2xl font-bold hover:bg-[#5A74B1] transition-colors">?</button>
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
                        <img src={(() => { const seed = msg.avatarSeed ?? (myGroup?.members ?? teamMembers).find((m) => m.name === msg.sender)?.avatarSeed; return seed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed + 100}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`; })()} alt={msg.sender} className="w-full h-full object-cover" />
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
              <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="เริ่มแชท......" className="flex-1 bg-gray-50 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-700" />
              <button onClick={handleSend} className="w-14 h-14 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-100 transition-all">
                <Send size={28} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
