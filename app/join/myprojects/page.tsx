'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Users, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import Navbar from '../../navbar/page';

interface RoomData {
  roomId: string; title: string; description: string; totalMembers: number;
  groupSize: number; template: string; hostName: string; hostAvatarSeed: number;
  members: { name: string; avatarSeed: number; gmail: string }[];
  matchDone?: boolean; createdAt?: string;
}

export default function MyProjectsPage() {
  const router = useRouter();
  const [user, setUser]             = useState<{ name: string; avatarSeed: number } | null>(null);
  const [joinedRooms, setJoinedRooms] = useState<RoomData[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<RoomData | null>(null);
  const [deleteInput, setDeleteInput]   = useState('');
  const [deleteError, setDeleteError]   = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return;
    const u = JSON.parse(raw);
    setUser(u);

    fetch(`/api/myrooms?userName=${encodeURIComponent(u.name)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      })
      .then((data) => setJoinedRooms(data.rooms ?? []))
      .catch(() => setJoinedRooms([]));
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteInput !== deleteTarget.title) { setDeleteError('ชื่อห้องไม่ตรง กรุณาพิมพ์ใหม่'); return; }

    await fetch(`/api/rooms/${deleteTarget.roomId}`, { method: 'DELETE' });
    setJoinedRooms((prev) => prev.filter((r) => r.roomId !== deleteTarget.roomId));
    setDeleteTarget(null); setDeleteInput(''); setDeleteError('');
  };

  const handleSelectRoom = (room: RoomData) => {
    localStorage.setItem('currentRoom', JSON.stringify({ ...room, id: room.roomId }));
    const isHost = room.hostName === user?.name;
    if (isHost) {
      router.push(room.matchDone ? '/create/group' : '/create/match');
    } else {
      router.push('/join/myteam');
    }
  };

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      <Navbar />
      <main className="w-full max-w-5xl mt-8 px-4 pb-12">
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm flex flex-col min-h-[600px] relative">
          <button onClick={() => router.push('/')}
            className="absolute left-8 top-8 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-all active:scale-90">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col items-center mb-10 mt-4">
            <p className="text-gray-400 text-sm mt-1">ห้องที่เคยเข้าร่วม</p>
          </div>

          {joinedRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-gray-400">
              <div className="text-6xl">📭</div>
              <p className="font-bold text-lg">ยังไม่มีห้องที่เข้าร่วม</p>
              <p className="text-sm">กด Join เพื่อเข้าร่วมห้องแรกของคุณ</p>
              <button onClick={() => router.push('/join/roomid')}
                className="mt-4 bg-[#2D3E50] text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-700 transition-all active:scale-95">
                Join ห้องใหม่
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {joinedRooms.map((room) => {
                const isHost = room.hostName === user?.name;
                return (
                  <div key={room.roomId} onClick={() => handleSelectRoom(room)}
                    className="w-full bg-[#2D3E50] rounded-[25px] p-6 flex items-center justify-between text-left hover:brightness-110 transition-all active:scale-[0.98] shadow-md cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-sky-200 flex-shrink-0">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${room.hostAvatarSeed + 100}`} alt={room.hostName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-white font-bold text-lg leading-tight">{room.title}</h2>
                          {isHost && <span className="bg-[#F8A4A4] text-[#4B3E7A] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">HOST</span>}
                        </div>
                        <p className="text-gray-400 text-sm mt-0.5">{isHost ? 'คุณเป็นผู้สร้างห้องนี้' : `Host: ${room.hostName}`}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-gray-300 text-xs"><Users size={12} />{room.members.length}/{room.totalMembers}</span>
                          <span className="text-gray-500 text-xs">ID: {room.roomId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {room.matchDone ? (
                        <span className="flex items-center gap-1.5 bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full"><CheckCircle2 size={13} />จับกลุ่มแล้ว</span>
                      ) : (
                        <span className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-full"><Clock size={13} />รอ Match</span>
                      )}
                      {isHost && (
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(room); setDeleteInput(''); setDeleteError(''); }}
                          className="w-9 h-9 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full flex items-center justify-center transition-colors">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[30px] w-full max-w-md shadow-2xl p-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><Trash2 size={20} className="text-red-500" /></div>
              <h2 className="text-xl font-black text-gray-800">ลบห้อง</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              การลบห้องนี้จะไม่สามารถย้อนกลับได้ กรุณาพิมพ์ชื่อห้อง{' '}
              <span className="font-black text-gray-800">&ldquo;{deleteTarget.title}&rdquo;</span> เพื่อยืนยัน
            </p>
            <input type="text" value={deleteInput} onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleDeleteConfirm()}
              placeholder={deleteTarget.title} autoFocus
              className="w-full border-2 border-gray-200 rounded-2xl py-3 px-5 text-gray-800 font-medium focus:outline-none focus:border-red-400 transition-colors" />
            {deleteError && <p className="text-red-500 text-sm font-medium -mt-2">{deleteError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setDeleteTarget(null); setDeleteInput(''); setDeleteError(''); }}
                className="flex-1 py-3 rounded-2xl text-gray-500 font-bold hover:bg-gray-100 transition-colors">ยกเลิก</button>
              <button onClick={handleDeleteConfirm} disabled={deleteInput !== deleteTarget.title}
                className="flex-1 py-3 rounded-2xl font-bold text-white transition-colors bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">ลบห้อง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
