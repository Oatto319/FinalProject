'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Navbar from '../../navbar/page';

interface RoomMember {
  name: string;
  avatarSeed: number;
  gmail: string;
  role?: string;
}

interface MatchedGroup {
  id: number;
  name: string;
  members: RoomMember[];
}

const ROLE_ICONS: Record<string, string> = {
  'นักวิเคราะห์': '/img/brain.png',
  'นักสร้างสรรค์': '/img/idea.png',
  'ผู้ปฏิบัติ': '/img/pencil.png',
  'ผู้ประสานงาน': '/img/make.png',
};

export default function VotePage() {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [myGroup, setMyGroup] = useState<MatchedGroup | null>(null);
  const [user, setUser] = useState<{ name: string; avatarSeed: number } | null>(null);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return;
    const currentUser = JSON.parse(raw);
    setUser(currentUser);

    const loadGroup = () => {
      const roomRaw = localStorage.getItem('currentRoom');
      if (!roomRaw) return;
      const room = JSON.parse(roomRaw);

      const groupsRaw = localStorage.getItem(`matchedGroups_${room.id}`);
      if (groupsRaw) {
        const groups: MatchedGroup[] = JSON.parse(groupsRaw);
        const mine = groups.find((g) => g.members.some((m) => m.name === currentUser.name));
        if (mine) { setMyGroup(mine); return; }
      }

      // Fallback: ใช้สมาชิกทั้งหมดในห้องถ้ายังไม่มี matchedGroups
      const roomsRaw = localStorage.getItem('rooms');
      if (roomsRaw) {
        const rooms = JSON.parse(roomsRaw);
        const latest = rooms[room.id];
        if (latest?.members?.length) {
          setMyGroup({ id: 0, name: 'ทีม', members: latest.members });
        }
      }
    };

    loadGroup();
    const interval = setInterval(loadGroup, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = () => {
    if (!selectedMember || !myGroup) return;
    const roomRaw = localStorage.getItem('currentRoom');
    if (!roomRaw) return;
    const room = JSON.parse(roomRaw);
    const key = `votes_${room.id}_${myGroup.id}`;
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    existing[user?.name ?? ''] = selectedMember;
    localStorage.setItem(key, JSON.stringify(existing));
    setVoted(true);
  };

  const members = myGroup?.members ?? [];

  return (
    <div className="min-h-screen bg-[#1A2635] font-sans flex flex-col items-center">
      <Navbar />

      <main className="w-full max-w-5xl mt-8 px-4 pb-12">
        <div className="bg-[#E5E7EB] rounded-[40px] p-8 md:p-12 shadow-2xl flex flex-col items-center min-h-[700px] relative">

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="absolute left-8 top-8 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-700 shadow-md hover:bg-gray-100 transition-all active:scale-90">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>

          {/* Top Illustration */}
          <div className="w-full flex justify-center -mt-16 mb-6">
            <img
              src="/img/team.png"
              alt="Team Illustration"
              className="w-full max-w-[280px] h-auto object-contain drop-shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://img.freepik.com/free-vector/team-holding-jigsaw-puzzle-pieces_74855-6962.jpg';
              }}
            />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-[#2D3E50] text-3xl font-black uppercase tracking-tight">
              &ldquo;Vote your team leader&rdquo;
            </h1>
            {myGroup && (
              <p className="text-gray-500 font-bold mt-1">{myGroup.name}</p>
            )}
          </div>

          {voted ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="text-6xl">✅</div>
              <p className="text-2xl font-black text-[#2D3E50]">โหวตแล้ว!</p>
              <p className="text-gray-500 font-medium">คุณโหวตให้ <span className="font-bold text-[#7096D1]">{selectedMember}</span></p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-gray-400 font-medium py-16">ไม่พบข้อมูลทีม</div>
          ) : (
            <>
              {/* Members Grid */}
              <div className="w-full max-w-3xl grid grid-cols-2 sm:grid-cols-3 gap-6 mb-12">
                {members.map((member) => {
                  const isMe = member.name === user?.name;
                  const avatarUrl = member.avatarSeed
                    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed + 100}`
                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`;
                  const roleIcon = member.role ? ROLE_ICONS[member.role] : null;

                  return (
                    <button
                      key={member.name}
                      onClick={() => setSelectedMember(member.name)}
                      className={`
                        bg-white rounded-[30px] p-6 flex flex-col items-center gap-3 shadow-sm
                        transition-all duration-200 border-4 outline-none
                        ${selectedMember === member.name
                          ? 'border-[#7096D1] scale-105 shadow-xl'
                          : 'border-transparent hover:border-gray-200'}
                      `}
                    >
                      {/* Avatar */}
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-50 border-2 border-gray-100 shadow-inner">
                        <img src={avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Name + Me tag */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          <h4 className="font-bold text-gray-800 text-base leading-tight">{member.name}</h4>
                          {isMe && <span className="bg-[#7096D1] text-white text-[9px] px-1.5 py-0.5 rounded font-bold">คุณ</span>}
                        </div>

                        {/* MBTI Role */}
                        {member.role && (
                          <div className="flex items-center justify-center gap-1 mt-1">
                            {roleIcon && <img src={roleIcon} alt={member.role} className="w-4 h-4 object-contain" />}
                            <p className="text-xs text-gray-500 font-medium">{member.role}</p>
                          </div>
                        )}
                      </div>

                      {/* Radio indicator */}
                      <div className={`
                        w-7 h-7 rounded-full border-2 flex items-center justify-center
                        ${selectedMember === member.name ? 'bg-[#7096D1] border-[#7096D1]' : 'border-gray-200'}
                      `}>
                        {selectedMember === member.name && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Vote Button */}
              <button
                disabled={selectedMember === null}
                onClick={handleVote}
                className={`
                  w-full max-w-xs py-5 rounded-[25px] font-black text-3xl shadow-lg transition-all transform active:scale-95
                  ${selectedMember !== null
                    ? 'bg-[#2D3E50] text-white hover:bg-[#1E293B]'
                    : 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'}
                `}
              >
                VOTE
              </button>

              <p className="mt-6 text-gray-500 text-sm font-bold italic opacity-60">
                * เลือกสมาชิกหนึ่งคนเพื่อโหวตเป็นหัวหน้ากลุ่ม
              </p>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
