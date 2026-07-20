'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import Navbar from '../../navbar/page';
import { resolveAvatar } from '@/lib/avatar';

interface RoomData {
  roomId: string; title: string; description: string; totalMembers: number;
  groupSize: number; template: string; hostName: string; hostAvatarSeed: number; hostAvatarImage?: string | null;
  hostRole?: string; members: { name: string; avatarSeed: number; avatarImage?: string | null; gmail: string }[];
  matchDone?: boolean; matchMode?: string; createdAt?: string;
}

const TEMPLATE_COLORS: Record<string, string> = {
  programming: '#FFAAAA',
  service: '#71EFB8',
  presentation: '#EAFF48',
  design: '#8C71EF',
};

export default function MyProjectsPage() {
  const router = useRouter();
  const [user, setUser]             = useState<{ name: string; avatarSeed: number; role?: string; gmail?: string } | null>(null);
  const [joinedRooms, setJoinedRooms] = useState<RoomData[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<RoomData | null>(null);
  const [deleteInput, setDeleteInput]   = useState('');
  const [deleteError, setDeleteError]   = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return;
    const u = JSON.parse(raw);
    setUser(u);

    fetch('/api/myrooms')
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

    const res = await fetch(`/api/rooms/${deleteTarget.roomId}`, { method: 'DELETE' });
    if (!res.ok) { setDeleteError('เกิดข้อผิดพลาด ไม่สามารถลบห้องได้ กรุณาลองใหม่'); return; }
    setJoinedRooms((prev) => prev.filter((r) => r.roomId !== deleteTarget.roomId));
    setDeleteTarget(null); setDeleteInput(''); setDeleteError('');
  };

  const handleSelectRoom = (room: RoomData) => {
    localStorage.setItem('currentRoom', JSON.stringify({ ...room, id: room.roomId }));
    const isHost = room.hostName === user?.name;
    if (isHost) {
      if (room.matchDone) {
        router.push('/create/group');
      } else if (room.matchMode === 'selection') {
        router.push('/create/manual');
      } else {
        router.push('/create/match');
      }
    } else {
      router.push(room.matchDone ? '/join/myteam' : '/join/myroom');
    }
  };

  return (
    <div className="h-dvh bg-gray-300 font-sans flex flex-col items-center overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-hidden w-full max-w-5xl px-4 flex flex-col sm:flex-row sm:items-start gap-3 pt-4 pb-4">

        {/* Back Button */}
        <button onClick={() => router.push('/')}
          className="flex-shrink-0 self-start sm:mt-2 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all">
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>

        <div className="flex-1 overflow-y-auto h-full pb-2">
            {joinedRooms.length === 0 ? (
              <div className="bg-white rounded-[24px] p-6 sm:p-8 md:p-12 shadow-sm flex flex-col items-center gap-4 text-gray-400">
                <div className="text-6xl">📭</div>
                <p className="font-bold text-lg">ยังไม่มีห้องที่เข้าร่วม</p>
                <p className="text-sm">กด Join เพื่อเข้าร่วมห้องแรกของคุณ</p>
                <button onClick={() => router.push('/join/roomid')}
                  className="mt-2 bg-[#2D3E50] text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-700 transition-all active:scale-95">
                  Join ห้องใหม่
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {joinedRooms.map((room) => {
                  const isHost = room.hostName === user?.name;
                  const templateColor = TEMPLATE_COLORS[room.template] ?? '#D1D5DB';
                  return (
                    <div key={room.roomId} onClick={() => handleSelectRoom(room)}
                      className="bg-white rounded-[20px] shadow-sm overflow-hidden cursor-pointer hover:brightness-95 transition-all active:scale-[0.98]">

                      {/* Template header */}
                      <div className="px-5 py-3" style={{ backgroundColor: templateColor }}>
                        <span className="text-xs font-black uppercase tracking-widest text-white/80">{room.template}</span>
                      </div>

                      {/* Card body */}
                      <div className="p-5">
                        {/* Host profile */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-sky-200 flex-shrink-0">
                            <img src={resolveAvatar({ avatarSeed: room.hostAvatarSeed, avatarImage: room.hostAvatarImage })} alt={room.hostName} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-800 leading-tight">{room.hostName}</p>
                              {isHost && <span className="bg-[#94A3B8] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">HOST</span>}
                            </div>
                            {(() => {
                              const role = isHost ? (user?.role ?? room.hostRole ?? 'host') : (room.hostRole ?? 'host');
                              return (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${role === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>
                                  {role}
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Room info */}
                        <p className="font-bold text-gray-800 text-base mb-1">{room.title}</p>
                        <p className="text-gray-500 text-sm mb-3 leading-relaxed">{room.description}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">{room.totalMembers} คน · กลุ่มละ {room.groupSize} คน</p>
                          <p className="text-xl font-black text-[#4B3E7A]">{room.members.length}/{room.totalMembers}</p>
                        </div>

                        {/* Status + Delete */}
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                          {room.matchDone ? (
                            <span className="flex items-center gap-1 text-green-500 text-xs font-bold"><CheckCircle2 size={12} />จับกลุ่มแล้ว</span>
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-500 text-xs font-bold"><Clock size={12} />รอ Match</span>
                          )}
                          {isHost ? (
                            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(room); setDeleteInput(''); setDeleteError(''); }}
                              className="flex items-center gap-1.5 text-red-400 text-xs font-bold hover:text-red-600 transition-colors">
                              <Trash2 size={13} /> ลบห้อง
                            </button>
                          ) : <span />}
                        </div>
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
          <div className="bg-white rounded-[20px] w-full max-w-md shadow-2xl p-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><Trash2 size={20} className="text-red-500" /></div>
              <p className="text-xl font-black text-gray-800">ลบห้อง</p>
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
