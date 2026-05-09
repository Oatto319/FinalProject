'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Sparkles, X } from 'lucide-react';
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
  leaderId?: string;
}

interface MBTIResult { title: string; icon: string; description: string; jobs: string[]; }

export default function AnalyzePage() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [teamMembers, setTeamMembers] = useState<{ name: string; avatarSeed: number; score: number; role?: string }[]>([]);
  const [roomIdState, setRoomIdState] = useState('');
  const [matchedGroups, setMatchedGroups] = useState<MatchedGroup[]>([]);
  const [myGroupId, setMyGroupId] = useState<number | null>(null);
  const [memberTypes, setMemberTypes] = useState<Record<string, MBTIResult>>({});
  const [mbtiPopup, setMbtiPopup] = useState<{ name: string; type: MBTIResult } | null>(null);
  const typesFetchedRef = useRef(false);

  useEffect(() => {
    const userRaw = localStorage.getItem('currentUser');
    const roomRaw = localStorage.getItem('currentRoom');
    if (!userRaw || !roomRaw) return;

    const currentUser = JSON.parse(userRaw);
    const room = JSON.parse(roomRaw);
    const roomId = room.roomId ?? room.id;
    setRoomIdState(roomId);

    const load = async () => {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.room) return;
      const dbRoom = data.room;

      setMatchedGroups(dbRoom.matchedGroups ?? []);

      let members: RoomMember[] = [];
      if (dbRoom.matchedGroups?.length) {
        const mine: MatchedGroup = dbRoom.matchedGroups.find(
          (g: MatchedGroup) => g.members.some((m) => m.name === currentUser.name)
        );
        if (mine) {
          members = mine.members;
          setMyGroupId(mine.id);
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
      if (members.length === 0) {
        members = dbRoom.members ?? [];
      }

      const withScores = members.map((m: RoomMember) => ({
        name: m.name,
        avatarSeed: m.avatarSeed,
        role: m.role,
        score: 75 + (m.avatarSeed % 25),
      }));
      setTeamMembers(withScores);
    };

    load();

    const timer = setTimeout(() => setIsAnalyzing(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const bestFitIdx = teamMembers.reduce(
    (best, m, idx) => (m.score > (teamMembers[best]?.score ?? 0) ? idx : best),
    0
  );

  const handleConfirm = async () => {
    if (isAnalyzing) return;
    const leader = teamMembers[bestFitIdx];
    if (!leader || !roomIdState) return;

    const updatedGroups = matchedGroups.map((g) => {
      if (g.id !== myGroupId) return g;
      return { ...g, leaderId: leader.name };
    });

    await fetch(`/api/rooms/${roomIdState}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchedGroups: updatedGroups }),
    });

    router.push('/join/myteam');
  };

  return (
    <div className="min-h-screen bg-[#1D324B] font-sans flex flex-col items-center">
      <Navbar bgColor="#122031" nameColor="white" />

      <main className="w-full max-w-5xl mt-4 px-4 flex-1 flex flex-col">

        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-white text-3xl font-black uppercase tracking-tight">
            &ldquo;Analyze for leader&rdquo;
          </h1>
          <p className="text-white/60 font-bold mt-1">
            {isAnalyzing ? 'ระบบกำลังวิเคราะห์ความเหมาะสมจากข้อมูลสมาชิก...' : 'วิเคราะห์เสร็จสิ้น'}
          </p>
        </div>

        <div className="flex items-start gap-3 flex-1">

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mt-2 flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-700 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>

        <div className="flex-1 self-stretch bg-[#E5E7EB] rounded-t-[24px] p-8 md:p-12 shadow-2xl flex flex-col items-center overflow-hidden">

          {/* Analysis Results Grid */}
          <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {teamMembers.length === 0 && !isAnalyzing ? (
              <div className="col-span-3 text-center text-gray-400 font-medium py-8">
                ไม่พบข้อมูลสมาชิกในทีม
              </div>
            ) : (
              teamMembers.map((member, idx) => {
                const isBest = !isAnalyzing && idx === bestFitIdx;
                return (
                  <div
                    key={idx}
                    className={`
                      bg-white rounded-[22px] p-6 pb-10 flex flex-col items-center gap-4 shadow-sm relative overflow-hidden
                      transition-all duration-500 border-4
                      ${isBest ? 'border-yellow-400 scale-105 shadow-2xl' : 'border-transparent'}
                    `}
                  >
                    {isBest && (
                      <div className="absolute top-4 right-4 bg-yellow-400 text-white p-1 rounded-full">
                        <Sparkles size={16} fill="currentColor" />
                      </div>
                    )}
                    {/* MBTI icon — top-right */}
                    {!isBest && memberTypes[member.name] && (
                      <div
                        onClick={() => setMbtiPopup({ name: member.name, type: memberTypes[member.name] })}
                        className="absolute top-3 right-3 w-10 h-10 rounded-full overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <img src={memberTypes[member.name].icon} alt={memberTypes[member.name].title} className="w-full h-full object-contain" />
                      </div>
                    )}

                    <div className="relative w-24 h-24 md:w-28 md:h-28">
                      <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 border-2 border-gray-100 shadow-inner">
                        <img
                          src={`/img/p${member.avatarSeed || 1}.PNG`}
                          alt={member.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-pulse flex items-center justify-center">
                          <div className="w-full h-1 bg-blue-400 absolute animate-[scan_2s_ease-in-out_infinite]"></div>
                        </div>
                      )}
                    </div>

                    <div className="text-center w-full">
                      <h4 className="font-bold text-gray-800 text-lg leading-tight">{member.name}</h4>
                    </div>

                    <div className="w-full mt-auto">
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-1000 ease-out"
                          style={{
                            width: isAnalyzing ? '0%' : `${member.score}%`,
                            backgroundColor: isBest ? '#FACC15' : '#7096D1',
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 px-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Suitability</span>
                        <span className="text-[10px] font-bold text-gray-700">{isAnalyzing ? '...' : `${member.score}%`}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Result Action Button */}
          <button
            onClick={handleConfirm}
            disabled={isAnalyzing}
            className={`w-full max-w-sm py-5 rounded-[20px] font-black text-3xl transition-all
              ${isAnalyzing
                ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-[0_8px_0_0_#b0b0b0]'
                : 'bg-[#2D3E50] text-white shadow-[0_8px_0_0_#111c27] hover:shadow-[0_4px_0_0_#111c27] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px]'}
            `}
          >
            {isAnalyzing ? 'ANALYZING...' : 'CONFIRM LEADER'}
          </button>

          {/* Helper Legend */}
          <div className="mt-4 flex gap-6 text-gray-500 text-xs font-bold italic opacity-60">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Competency</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Best Fit</span>
          </div>

        </div>
        </div>
      </main>

      {/* MBTI Popup */}
      {mbtiPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setMbtiPopup(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src={mbtiPopup.type.icon} alt={mbtiPopup.type.title} className="w-14 h-14 object-contain" />
                <div>
                  <p className="text-xs text-gray-400 font-medium">ประเภทบุคลิกภาพ</p>
                  <p className="text-xl font-black text-[#4B3E7A]">{mbtiPopup.type.title}</p>
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

      <style jsx global>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
      `}</style>
    </div>
  );
}
