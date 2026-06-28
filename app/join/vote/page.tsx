'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, X } from 'lucide-react';
import Navbar from '../../navbar/page';
import { GROUP_COLORS, type GroupKey } from '@/lib/mbti';

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
  leaderId?: string;
}

interface MBTIResult { fullCode: string; groupLabel: string; group: GroupKey; description: string; jobs: string[]; }

export default function VotePage() {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [myGroup, setMyGroup] = useState<MatchedGroup | null>(null);
  const [user, setUser] = useState<{ name: string; avatarSeed: number; gmail?: string } | null>(null);
  const [voted, setVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [groupVotes, setGroupVotes] = useState<Record<string, string>>({});
  const [memberTypes, setMemberTypes] = useState<Record<string, MBTIResult>>({});
  const [mbtiPopup, setMbtiPopup] = useState<{ name: string; type: MBTIResult } | null>(null);
  const [voteError, setVoteError] = useState('');
  const roomIdRef = useRef<string>('');
  const typesFetchedRef = useRef(false);

  const fetchGroup = async (roomId: string, userName: string, userGmail?: string) => {
    const res = await fetch(`/api/rooms/${roomId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (!data.room) return;
    const room = data.room;
    if (room.matchedGroups?.length) {
      const mine: MatchedGroup = room.matchedGroups.find(
        (g: MatchedGroup) => g.members.some((m) => (userGmail && m.gmail === userGmail) || m.name === userName)
      );
      if (mine) {
        setMyGroup(mine);
        const votes: Record<string, string> = room.votes?.[String(mine.id)] ?? {};
        setGroupVotes(votes);

        // ดึง MBTI types ครั้งเดียว
        if (!typesFetchedRef.current) {
          typesFetchedRef.current = true;
          const typesRes = await fetch(`/api/rooms/${roomId}/member-types?groupId=${mine.id}`);
          if (typesRes.ok) {
            const typesData = await typesRes.json();
            setMemberTypes(typesData.types ?? {});
          }
        }
      }
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return;
    const currentUser = JSON.parse(raw);
    setUser(currentUser);

    const roomRaw = localStorage.getItem('currentRoom');
    if (!roomRaw) return;
    const room = JSON.parse(roomRaw);
    const roomId = room.roomId ?? room.id;
    roomIdRef.current = roomId;

    fetchGroup(roomId, currentUser.name, currentUser.gmail);
    const interval = setInterval(() => fetchGroup(roomId, currentUser.name, currentUser.gmail), 2000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = async () => {
    if (!selectedMember || !myGroup || !user || !roomIdRef.current || submitting) return;
    setSubmitting(true);
    setVoteError('');
    try {
      // Load current votes from DB
      const res = await fetch(`/api/rooms/${roomIdRef.current}`);
      if (!res.ok) return;
      const data = await res.json();
      const room = data.room;

      const groupKey = String(myGroup.id);
      const existingVotes: Record<string, string> = room.votes?.[groupKey] ?? {};
      const updatedVotes = { ...existingVotes, [user.name]: selectedMember };

      // Count winner (guard against empty tally)
      const tally: Record<string, number> = {};
      Object.values(updatedVotes).forEach((name) => {
        tally[name] = (tally[name] ?? 0) + 1;
      });
      const entries = Object.entries(tally);
      const winner = entries.length > 0
        ? entries.reduce((a, b) => b[1] >= a[1] ? b : a)[0]
        : selectedMember;

      // Update matchedGroups with leaderId
      const updatedGroups = (room.matchedGroups ?? []).map((g: MatchedGroup) => {
        if (g.id !== myGroup.id) return g;
        return { ...g, leaderId: winner };
      });

      const newVotes = { ...(room.votes ?? {}), [groupKey]: updatedVotes };

      const patchRes = await fetch(`/api/rooms/${roomIdRef.current}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          votes: newVotes,
          matchedGroups: updatedGroups,
        }),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        console.error('Vote save failed:', err);
        setVoteError('บันทึกโหวตไม่สำเร็จ กรุณาลองใหม่');
        return;
      }

      setVoted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const members = myGroup?.members ?? [];

  return (
    <div className="min-h-screen bg-[#1D324B] font-sans flex flex-col items-center">
      <Navbar bgColor="#122031" nameColor="white" />

      <main className="w-full max-w-5xl mt-4 px-4 flex-1 flex flex-col">

        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-white text-3xl font-black uppercase tracking-tight">
            &ldquo;Vote your team leader&rdquo;
          </h1>
          {myGroup && (
            <p className="text-white/60 font-bold mt-1">{myGroup.name}</p>
          )}
        </div>

        <div className="flex items-start gap-3 flex-1">

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mt-2 flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-700 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>

        <div className="flex-1 self-stretch bg-[#E5E7EB] rounded-t-[24px] p-8 md:p-12 shadow-2xl flex flex-col items-center">



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
              {(() => {
                  const tally: Record<string, number> = {};
                  Object.values(groupVotes).forEach((name) => { tally[name] = (tally[name] ?? 0) + 1; });
                  const maxVotes = Math.max(0, ...Object.values(tally));
                  return (
                    <div className="w-full max-w-3xl grid grid-cols-2 sm:grid-cols-3 gap-6 mb-12">
                      {members.map((member) => {
                        const isMe = member.name === user?.name;
                        const avatarUrl = `/img/p${member.avatarSeed || 1}.PNG`;
                        const mbtiType = memberTypes[member.name];
                        const voteCount = tally[member.name] ?? 0;
                        const isLeading = voteCount > 0 && voteCount === maxVotes;
                        const myVote = groupVotes[user?.name ?? ''];

                        return (
                          <button
                            key={member.name}
                            onClick={() => setSelectedMember(member.name)}
                            className={`
                              bg-white rounded-[20px] p-6 flex flex-col items-center gap-3 shadow-sm
                              transition-all duration-200 border-4 outline-none relative
                              ${selectedMember === member.name
                                ? 'border-[#7096D1] scale-105 shadow-xl'
                                : isLeading ? 'border-[#FFB800]' : 'border-transparent hover:border-gray-200'}
                            `}
                          >
                            {/* MBTI type badge — top-right corner */}
                            {mbtiType && (
                              <div
                                onClick={(e) => { e.stopPropagation(); setMbtiPopup({ name: member.name, type: mbtiType }); }}
                                className="absolute top-3 right-3 w-10 h-10 rounded-full overflow-hidden hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center"
                                style={{ backgroundColor: `${GROUP_COLORS[mbtiType.group]}26` }}
                              >
                                <span className="text-[8px] font-black" style={{ color: GROUP_COLORS[mbtiType.group] }}>{mbtiType.fullCode}</span>
                              </div>
                            )}

                            {/* Avatar */}
                            <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-50 border-2 border-gray-100 shadow-inner">
                              <img src={avatarUrl} alt={member.name} className="w-full h-full object-contain" />
                            </div>

                            {/* Name + Me tag */}
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                <h4 className="text-gray-800 text-base leading-tight">{member.name}</h4>
                                {isMe && <span className="bg-[#7096D1] text-white text-[9px] px-1.5 py-0.5 rounded font-bold">คุณ</span>}
                              </div>

                              {/* Voter avatars */}
                              {voteCount > 0 && (
                                <div className="flex justify-center -space-x-2 mt-2">
                                  {Object.entries(groupVotes)
                                    .filter(([, votedFor]) => votedFor === member.name)
                                    .map(([voter]) => {
                                      const seed = members.find((m) => m.name === voter)?.avatarSeed ?? 1;
                                      return (
                                        <div key={voter} className="w-9 h-9 rounded-full overflow-hidden border-2 border-white bg-gray-100">
                                          <img src={`/img/p${seed}.PNG`} alt={voter} className="w-full h-full object-contain" />
                                        </div>
                                      );
                                    })}
                                </div>
                              )}

                              {/* Vote count */}
                              <div className={`mt-1 text-sm font-black ${isLeading ? 'text-[#FFB800]' : 'text-gray-400'}`}>
                                {voteCount > 0 ? `${voteCount} โหวต` : '0 โหวต'}
                              </div>

                              {/* Who I voted for */}
                              {myVote === member.name && (
                                <div className="mt-1 text-[10px] text-[#7096D1] font-bold">✓ คุณโหวตให้</div>
                              )}
                            </div>

                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

              {/* Vote Button */}
              {(() => {
                const alreadyVoted = !!groupVotes[user?.name ?? ''];
                const canVote = selectedMember !== null && !alreadyVoted && !submitting;
                return (
                  <button
                    disabled={!canVote}
                    onClick={handleVote}
                    className={`
                      w-full max-w-xs py-5 rounded-[20px] font-black text-3xl transition-all
                      ${canVote
                        ? 'bg-[#2D3E50] text-white shadow-[0_8px_0_0_#111c27] hover:shadow-[0_4px_0_0_#111c27] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px]'
                        : 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-[0_8px_0_0_#b0b0b0]'}
                    `}
                  >
                    {alreadyVoted ? 'โหวตแล้ว' : 'VOTE'}
                  </button>
                );
              })()}

              {voteError && (
                <p className="mt-3 text-red-500 text-sm font-bold">{voteError}</p>
              )}
              <p className="mt-6 text-gray-500 text-sm font-bold italic opacity-60">
                * เลือกสมาชิกหนึ่งคนเพื่อโหวตเป็นหัวหน้ากลุ่ม
              </p>
            </>
          )}

        </div>
        </div>
      </main>

      {/* MBTI Type Popup */}
      {mbtiPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setMbtiPopup(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${GROUP_COLORS[mbtiPopup.type.group]}1A` }}
                >
                  <span className="text-xs font-black" style={{ color: GROUP_COLORS[mbtiPopup.type.group] }}>{mbtiPopup.type.fullCode}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">ประเภทบุคลิกภาพ</p>
                  <p className="text-xl font-black text-[#4B3E7A]">{mbtiPopup.type.fullCode}</p>
                  <p className="text-xs font-bold text-gray-500">{mbtiPopup.type.groupLabel}</p>
                  <p className="text-sm text-gray-500 font-medium">{mbtiPopup.name}</p>
                </div>
              </div>
              <button onClick={() => setMbtiPopup(null)} className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            {mbtiPopup.type.description && (
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{mbtiPopup.type.description}</p>
            )}
            {mbtiPopup.type.jobs?.length > 0 && (
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">ตำแหน่งงานที่เหมาะสม</p>
                <div className="flex flex-wrap gap-2">
                  {mbtiPopup.type.jobs.map((job) => (
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
