'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Users, CheckCircle2, Clock } from 'lucide-react';
import Navbar from '../../navbar/page';

interface RoomData {
  id: string;
  title: string;
  description: string;
  totalMembers: number;
  groupSize: number;
  template: string;
  hostName: string;
  hostAvatarSeed: number;
  members: { name: string; avatarSeed: number; gmail: string }[];
  createdAt?: string;
}

export default function MyProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatarSeed: number } | null>(null);
  const [joinedRooms, setJoinedRooms] = useState<RoomData[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return;
    const u = JSON.parse(raw);
    setUser(u);

    const roomsRaw = localStorage.getItem('rooms');
    if (!roomsRaw) return;
    const rooms: Record<string, RoomData> = JSON.parse(roomsRaw);

    const joinedKey = `joinedRooms_${u.name}`;
    const joinedIds: string[] = JSON.parse(localStorage.getItem(joinedKey) || '[]');

    // รวมห้องที่ join + ห้องที่เป็น host
    const allIds = new Set([
      ...joinedIds,
      ...Object.keys(rooms).filter((id) => rooms[id].hostName === u.name),
    ]);

    const list: RoomData[] = [...allIds].map((id) => rooms[id]).filter(Boolean);
    setJoinedRooms(list);
  }, []);

  const handleSelectRoom = (room: RoomData) => {
    localStorage.setItem('currentRoom', JSON.stringify(room));
    router.push('/join/myteam');
  };

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      <Navbar />
      <main className="w-full max-w-5xl mt-8 px-4 pb-12">
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm flex flex-col min-h-[600px] relative">

          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="absolute left-8 top-8 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-all active:scale-90"
          >
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center mb-10 mt-4">
            <p className="text-gray-400 text-sm mt-1">ห้องที่เคยเข้าร่วม</p>
          </div>

          {/* Room List */}
          {joinedRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-gray-400">
              <div className="text-6xl">📭</div>
              <p className="font-bold text-lg">ยังไม่มีห้องที่เข้าร่วม</p>
              <p className="text-sm">กด Join เพื่อเข้าร่วมห้องแรกของคุณ</p>
              <button
                onClick={() => router.push('/join/roomid')}
                className="mt-4 bg-[#2D3E50] text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-700 transition-all active:scale-95"
              >
                Join ห้องใหม่
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {joinedRooms.map((room) => {
                const matched = !!localStorage.getItem(`matchDone_${room.id}`);
                const isHost = room.hostName === user?.name;
                return (
                  <button
                    key={room.id}
                    onClick={() => handleSelectRoom(room)}
                    className="w-full bg-[#2D3E50] rounded-[25px] p-6 flex items-center justify-between text-left hover:brightness-110 transition-all active:scale-[0.98] shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-sky-200 flex-shrink-0">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${room.hostAvatarSeed + 100}`}
                          alt={room.hostName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-white font-bold text-lg leading-tight">{room.title}</h2>
                          {isHost && (
                            <span className="bg-[#F8A4A4] text-[#4B3E7A] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                              HOST
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mt-0.5">{isHost ? 'คุณเป็นผู้สร้างห้องนี้' : `Host: ${room.hostName}`}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-gray-300 text-xs">
                            <Users size={12} />
                            {room.members.length}/{room.totalMembers}
                          </span>
                          <span className="text-gray-500 text-xs">ID: {room.id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {matched ? (
                        <span className="flex items-center gap-1.5 bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full">
                          <CheckCircle2 size={13} />
                          จับกลุ่มแล้ว
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-full">
                          <Clock size={13} />
                          รอ Match
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
