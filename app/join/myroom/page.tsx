'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import Navbar from '../../navbar/page';

interface RoomMember { name: string; avatarSeed: number; gmail: string; }
interface CurrentRoom {
  id: string; roomId?: string; title: string; description: string;
  totalMembers: number; groupSize: number; template: string;
  hostName: string; hostAvatarSeed: number; members: RoomMember[];
}

export default function MyRoomPage() {
  const router = useRouter();
  const [user, setUser]             = useState<{ name: string; avatarSeed: number } | null>(null);
  const [room, setRoom]             = useState<CurrentRoom | null>(null);
  const [members, setMembers]       = useState<RoomMember[]>([]);
  const [isReady, setIsReady]       = useState(false);
  const [readyUsers, setReadyUsers] = useState<string[]>([]);
  const [matchMode, setMatchMode]   = useState('');
  const [roomDeleted, setRoomDeleted] = useState(false);

  const getRoomId = (r: CurrentRoom) => r.roomId ?? r.id;

  const fetchRoom = async (roomId: string) => {
    const res = await fetch(`/api/rooms/${roomId}`);
    if (!res.ok) {
      setRoomDeleted(true);
      localStorage.removeItem('currentRoom');
      return;
    }
    const data = await res.json();
    if (data.room) {
      if (data.room.matchDone) {
        router.push('/join/myteam');
        return;
      }
      setMembers(data.room.members ?? []);
      setReadyUsers(data.room.readyUsers ?? []);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));

    const pendingRaw = localStorage.getItem('pendingRoom');
    if (pendingRaw) setMatchMode(JSON.parse(pendingRaw).matchMode ?? '');

    const roomRaw = localStorage.getItem('currentRoom');
    if (roomRaw) {
      const r: CurrentRoom = JSON.parse(roomRaw);
      setRoom(r);
      fetchRoom(getRoomId(r)).then(() => {
        // เช็ค ready status ของ user จาก server
        const userRaw = localStorage.getItem('currentUser');
        if (!userRaw) return;
        const u = JSON.parse(userRaw);
        fetch(`/api/rooms/${getRoomId(r)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.room) setIsReady((data.room.readyUsers ?? []).includes(u.name));
          });
      });
    }
  }, []);

  useEffect(() => {
    if (!room) return;
    const interval = setInterval(() => fetchRoom(getRoomId(room)), 2000);
    return () => clearInterval(interval);
  }, [room]);

  const handleReady = async () => {
    if (!user || !room) return;
    const newStatus = !isReady;
    setIsReady(newStatus);
    try {
      const res = await fetch(`/api/rooms/${getRoomId(room)}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: user.name, isReady: newStatus }),
      });
      const data = await res.json();
      setReadyUsers(data.readyUsers ?? []);
    } catch {
      setIsReady(!newStatus); // rollback
    }
  };

  const copyToClipboard = () => { if (room) navigator.clipboard.writeText(getRoomId(room)); };

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      <Navbar />
      <main className="w-full max-w-6xl mt-8 px-4 pb-12">
        <div className="bg-white rounded-[24px] overflow-hidden shadow-sm min-h-[700px]">
          <div className="bg-[#FFA4A4] p-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-[#4A4E69] text-5xl font-black tracking-widest uppercase">{room?.template ?? 'PROGRAMMING'}</h1>
            <div className="flex items-center gap-3 bg-[#4A4E69]/10 px-6 py-2 rounded-2xl">
              <span className="text-[#4A4E69] text-4xl font-black">#{room ? getRoomId(room) : '...'}</span>
              <button onClick={copyToClipboard} className="bg-white/80 p-2 rounded-full hover:bg-white transition-colors text-[#4A4E69]">
                <Copy size={24} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-8 bg-gray-200/50 min-h-[600px]">
            <div className="md:col-span-6 flex flex-col gap-3">
              {members.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-gray-400">รอสมาชิกเข้าร่วม...</div>
              ) : (
                members.map((member, idx) => {
                  const isMe = member.name === user?.name;
                  const avatarUrl = member.avatarSeed
                    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed + 100}`
                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`;
                  return (
                    <div key={idx} className={`bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border-2 ${isMe ? 'border-[#7096D1]' : 'border-gray-100'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                          <img src={avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-800">{member.name}</h4>
                            {isMe && <span className="bg-[#7096D1] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">คุณ</span>}
                          </div>
                          <p className="text-xs text-gray-400">นักเรียน</p>
                        </div>
                      </div>
                      <button className={`px-6 py-1.5 rounded-xl font-bold text-white text-sm ${readyUsers.includes(member.name) ? 'bg-[#7096D1]' : 'bg-[#C76A6A]'}`}>
                        {readyUsers.includes(member.name) ? 'Ready' : 'Wait'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="md:col-span-6 flex flex-col gap-6">
              <div className="bg-white rounded-[20px] p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-100 bg-blue-50">
                    <img src={room?.hostAvatarSeed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.hostAvatarSeed + 100}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`} alt="Host" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-gray-700">{room?.hostName ?? '...'}</span>
                      <span className="bg-[#8E97B0] text-white text-xs px-2 py-0.5 rounded uppercase font-bold">Host</span>
                    </div>
                    <p className="text-gray-400 text-sm">อาจารย์</p>
                    {matchMode && (
                      <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${matchMode === 'auto' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {matchMode === 'auto' ? '⚡ จับคู่อัตโนมัติ' : '🎛 กำหนดเอง'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-4 text-gray-700">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="font-bold text-lg">{room?.title ?? '...'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="font-bold text-lg text-gray-500">{room?.description ?? ''}</span>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">เข้าร่วมแล้ว:</p>
                      <p className="font-bold text-xl text-[#2D3E50]">{members.length}/{room?.totalMembers ?? '?'}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="font-bold text-lg text-gray-600">
                      {room ? `จำนวน ${room.totalMembers} คน กลุ่มละ ${room.groupSize} คน` : ''}
                    </p>
                  </div>
                </div>
              </div>

              <button onClick={handleReady}
                className={`mt-auto w-full py-8 rounded-[20px] font-black text-5xl uppercase tracking-[0.2em] text-white transition-all
                  ${isReady
                    ? 'bg-green-500 shadow-[0_10px_0_0_#15803d] hover:shadow-[0_5px_0_0_#15803d] hover:translate-y-[5px] active:shadow-none active:translate-y-[10px]'
                    : 'bg-[#7096D1] shadow-[0_10px_0_0_#4A6FA5] hover:shadow-[0_5px_0_0_#4A6FA5] hover:translate-y-[5px] active:shadow-none active:translate-y-[10px]'
                  }`}>
                {isReady ? 'READY ✓' : 'READY'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {roomDeleted && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] w-full max-w-sm p-8 flex flex-col items-center gap-5 shadow-2xl">
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
    </div>
  );
}
