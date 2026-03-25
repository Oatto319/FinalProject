'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, List, Info, Send, User } from 'lucide-react';
import Navbar from '../../components/Navbar';

interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
  avatarSeed?: number;
}

interface RoomMember {
  name: string;
  avatarSeed: number;
  gmail: string;
}

interface CurrentRoom {
  id: string;
  title: string;
  totalMembers: number;
  groupSize: number;
  template: string;
  hostName: string;
  hostAvatarSeed: number;
  members: RoomMember[];
}

export default function MyTeamPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatarSeed: number } | null>(null);
  const [teamMembers, setTeamMembers] = useState<RoomMember[]>([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    let currentUser: { name: string; avatarSeed: number } | null = null;
    if (raw) {
      currentUser = JSON.parse(raw);
      setUser(currentUser);
    }

    // Load team members from currentRoom
    const roomRaw = localStorage.getItem('currentRoom');
    if (roomRaw) {
      const room: CurrentRoom = JSON.parse(roomRaw);
      const matched = localStorage.getItem(`matchDone_${room.id}`);
      setIsMatched(!!matched);
      // Load latest members from rooms registry
      const roomsRaw = localStorage.getItem('rooms');
      let members: RoomMember[] = room.members ?? [];
      if (roomsRaw) {
        const rooms = JSON.parse(roomsRaw);
        const latest: CurrentRoom = rooms[room.id];
        if (latest) members = latest.members ?? [];
      }
      setTeamMembers(members);

      // Load saved chat messages or initialize with welcome message
      const chatKey = `chat_${room.id}`;
      const savedMessages = localStorage.getItem(chatKey);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else if (currentUser) {
        const now = new Date();
        const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
        const welcome: ChatMessage[] = [
          { id: 1, sender: currentUser.name, text: 'เข้าร่วมทีมแล้ว!', time, isMe: true },
        ];
        setMessages(welcome);
        localStorage.setItem(chatKey, JSON.stringify(welcome));
      }
    }
  }, []);

  const handleSend = () => {
    if (!message.trim() || !user) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newMsg: ChatMessage = {
      id: messages.length + 1,
      sender: user.name,
      text: message.trim(),
      time,
      isMe: true,
      avatarSeed: user.avatarSeed,
    };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setMessage('');

    // Persist chat
    const roomRaw = localStorage.getItem('currentRoom');
    if (roomRaw) {
      const room = JSON.parse(roomRaw);
      localStorage.setItem(`chat_${room.id}`, JSON.stringify(updated));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="min-h-screen bg-[#1A2635] font-sans flex flex-col items-center">
      <Navbar subtitle="นักเรียน" />

      {/* Sub-Header Tools */}
      <div className="w-full max-w-7xl px-6 mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="bg-[#FF9142] text-white px-8 py-3 rounded-t-2xl font-bold text-xl shadow-lg">
            My team
          </button>
          <button
            onClick={() => alert('แก้ไขชื่อทีม')}
            className="bg-[#2D3E50] p-3 rounded-full text-white hover:bg-slate-700 transition-colors">
            <Edit2 size={20} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#7096D1] text-white px-10 py-3 rounded-full font-bold text-xl flex items-center gap-2 shadow-inner">
            {teamMembers.length} :Members
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/join/myroom')}
              className="bg-[#2D3E50] p-3 rounded-lg text-white hover:bg-slate-700 transition-colors">
              <List size={20} />
            </button>
            <button
              onClick={() => router.push('/join/myroom')}
              className="bg-[#2D3E50] p-3 rounded-full text-white hover:bg-slate-700 transition-colors">
              <Info size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Team Content Grid */}
      <main className="w-full max-w-7xl px-6 pb-12">
        <div className="bg-[#E5E7EB] rounded-b-[40px] rounded-tr-[40px] p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] shadow-2xl">

          {/* Left Column: Team Management */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {!isMatched && (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 flex flex-col items-center gap-3">
                <div className="text-5xl">⏳</div>
                <p className="font-bold text-gray-500">รอ Host จับกลุ่ม...</p>
                <p className="text-sm">ทีมจะปรากฏเมื่อ Host กด Match</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {!isMatched ? null : teamMembers.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-gray-400">
                  ไม่พบสมาชิกในทีม
                </div>
              ) : (
                teamMembers.map((member, idx) => {
                  const isCurrentUser = member.name === user?.name;
                  return (
                    <div key={idx} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm relative group">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100">
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed}`}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {isCurrentUser && (
                            <div className="absolute -bottom-1 -right-1 bg-[#2D3E50] text-white rounded-full p-1 border-2 border-white">
                              <User size={12} fill="currentColor" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg">
                            {member.name}{isCurrentUser ? ' (คุณ)' : ''}
                          </h4>
                          <p className="text-sm text-gray-400">นักเรียน</p>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`ดูโปรไฟล์: ${member.name}`)}
                        className="w-12 h-12 rounded-full bg-[#7086D1] flex items-center justify-center text-white text-2xl font-bold hover:bg-[#5A74B1] transition-colors">
                        ?
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => router.push('/join/vote')}
              className="w-full bg-[#7096D1] text-white py-4 rounded-2xl font-bold text-xl shadow-lg hover:bg-[#5A74B1] transition-all transform active:scale-95">
              &quot;Choose a team leader&quot;
            </button>

            {/* Bottom Analysis Cards */}
            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div
                onClick={() => router.push('/join/vote')}
                className="bg-white rounded-[30px] p-4 flex flex-col items-center gap-2 shadow-sm border-b-4 border-gray-200 cursor-pointer hover:brightness-95 transition-all">
                <span className="font-bold text-gray-700">Vote</span>
                <div className="w-24 h-24 flex items-center justify-center">
                  <img src="https://cdn-icons-png.flaticon.com/512/3050/3050525.png" alt="Vote Icon" className="w-full h-full object-contain" />
                </div>
              </div>
              <div
                onClick={() => router.push('/join/analyze')}
                className="bg-white rounded-[30px] p-4 flex flex-col items-center gap-2 shadow-sm border-b-4 border-gray-200 cursor-pointer hover:brightness-95 transition-all">
                <span className="font-bold text-gray-700">Analyze</span>
                <div className="w-24 h-24 flex items-center justify-center">
                  <img src="https://cdn-icons-png.flaticon.com/512/2620/2620703.png" alt="Analyze Icon" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Chat Section */}
          <div className="lg:col-span-7 bg-white rounded-[30px] flex flex-col overflow-hidden shadow-inner">
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
              {messages.map((msg) => {
                const isMe = msg.sender === user?.name;
                return (
                  <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!isMe && (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        {msg.avatarSeed !== undefined ? (
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.avatarSeed}`}
                            alt={msg.sender}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs font-bold">
                            {msg.sender.charAt(0)}
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      {!isMe && (
                        <span className="text-xs text-gray-400 mb-1 px-1">{msg.sender}</span>
                      )}
                      <div className={`px-5 py-3 rounded-3xl font-medium text-lg shadow-sm ${
                        isMe
                          ? 'bg-[#7096D1] text-white rounded-br-none'
                          : 'bg-gray-600 text-white rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="เริ่มแชท......"
                className="flex-1 bg-gray-50 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-700"
              />
              <button
                onClick={handleSend}
                className="w-14 h-14 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-100 transition-all">
                <Send size={28} />
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
