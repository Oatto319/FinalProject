'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightCircle } from 'lucide-react';
import Navbar from '../../navbar/page';

interface RoomMember {
  name: string;
  avatarSeed: number;
  gmail: string;
}

interface RoomData {
  id: string;
  title: string;
  description: string;
  totalMembers: number;
  groupSize: number;
  template: string;
  hostName: string;
  hostAvatarSeed: number;
  members: RoomMember[];
}

export default function JoinCheckPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatarSeed: number; gmail: string } | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [matchMode, setMatchMode] = useState<string>('');

  useEffect(() => {
    const userRaw = localStorage.getItem('currentUser');
    if (userRaw) setUser(JSON.parse(userRaw));

    const roomId = localStorage.getItem('enteredRoomId');
    if (roomId) {
      const roomsRaw = localStorage.getItem('rooms');
      if (roomsRaw) {
        const rooms = JSON.parse(roomsRaw);
        if (rooms[roomId]) setRoom(rooms[roomId]);
      }
    }

    const pendingRaw = localStorage.getItem('pendingRoom');
    if (pendingRaw) setMatchMode(JSON.parse(pendingRaw).matchMode ?? '');
  }, []);

  const handleJoin = () => {
    if (!user || !room) return;

    // Add user to room members if not already in
    const roomsRaw = localStorage.getItem('rooms');
    const rooms = roomsRaw ? JSON.parse(roomsRaw) : {};
    const currentRoom: RoomData = rooms[room.id] ?? room;
    const alreadyIn = currentRoom.members.some((m: RoomMember) => m.name === user.name);
    if (!alreadyIn) {
      currentRoom.members.push({
        name: user.name,
        avatarSeed: user.avatarSeed,
        gmail: user.gmail ?? '',
      });
    }
    rooms[room.id] = currentRoom;
    localStorage.setItem('rooms', JSON.stringify(rooms));
    localStorage.setItem('currentRoom', JSON.stringify(currentRoom));

    // Track joined rooms per user
    const joinedKey = `joinedRooms_${user.name}`;
    const joined: string[] = JSON.parse(localStorage.getItem(joinedKey) || '[]');
    if (!joined.includes(room.id)) {
      joined.push(room.id);
      localStorage.setItem(joinedKey, JSON.stringify(joined));
    }

    router.push('/join/myroom');
  };

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      <Navbar />

      {/* Main Content Area */}
      <main className="w-full max-w-6xl mt-8 px-4 grid grid-cols-1 md:grid-cols-12 gap-6 pb-12">

        {/* Left Column: Room Info & Buttons */}
        <div className="md:col-span-5 flex flex-col gap-6">
          {/* Room Details Card */}
          <div className="bg-white rounded-[30px] p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-100">
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

            {room ? (
              <div className="grid grid-cols-2 gap-y-4 text-gray-700">
                <div className="font-bold text-lg col-span-2">{room.title}</div>
                <div className="font-bold text-lg text-gray-500">{room.description}</div>
                <div className="text-right font-bold text-lg text-[#2D3E50]">ID: {room.id}</div>
                <div className="font-bold text-lg text-gray-600">จำนวน {room.totalMembers} คน กลุ่มละ {room.groupSize} คน</div>
                <div className="text-right font-bold text-xl text-[#2D3E50]">{room.members.length}/{room.totalMembers}</div>
              </div>
            ) : (
              <p className="text-gray-400">ไม่พบข้อมูลห้อง</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-auto">
            <button
              onClick={() => router.back()}
              className="flex-1 bg-gray-500 text-white py-4 rounded-2xl font-bold text-xl shadow-md hover:bg-gray-600 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={!room}
              className="flex-2 bg-[#2D3E50] text-white py-4 px-12 rounded-2xl font-bold text-xl shadow-md flex items-center justify-center gap-3 hover:bg-[#1E293B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Join <ArrowRightCircle size={24} />
            </button>
          </div>
        </div>

        {/* Right Column: Template & Members */}
        <div className="md:col-span-7 flex flex-col gap-4">
          {/* Header Template Box */}
          <div className="bg-[#FFA4A4] rounded-[30px] p-6 text-center shadow-sm">
            <h1 className="text-[#4A4E69] text-5xl font-black tracking-widest uppercase">
              {room?.template ?? 'PROGRAMMING'}
            </h1>
          </div>

          {/* Member List */}
          <div className="flex flex-col gap-3">
            {(room?.members ?? []).length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400">
                ยังไม่มีสมาชิกในห้อง
              </div>
            ) : (
              (room?.members ?? []).map((member, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                      <img src={member.avatarSeed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed + 100}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`} alt={member.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{member.name}</h4>
                      <p className="text-xs text-gray-400">นักเรียน</p>
                    </div>
                  </div>
                  <span className="px-6 py-1.5 rounded-xl font-bold text-white text-sm bg-[#7096D1]">
                    Joined
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
