'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Sparkles, BrainCircuit } from 'lucide-react';
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

export default function AnalyzePage() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [teamMembers, setTeamMembers] = useState<{ name: string; avatarSeed: number; score: number; role?: string }[]>([]);
  const [roomIdState, setRoomIdState] = useState('');
  const [matchedGroups, setMatchedGroups] = useState<MatchedGroup[]>([]);
  const [myGroupId, setMyGroupId] = useState<number | null>(null);

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
    <div className="min-h-screen bg-[#1A2635] font-sans flex flex-col items-center">
      <Navbar />

      <main className="w-full max-w-5xl mt-8 px-4 pb-12">
        <div className="bg-[#E5E7EB] rounded-[40px] p-8 md:p-12 shadow-2xl flex flex-col items-center min-h-[700px] relative overflow-hidden">

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="absolute left-8 top-8 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-700 shadow-md hover:bg-gray-100 transition-all z-20">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>

          {/* Analyze Icon & Animation */}
          <div className="relative mb-8">
            <div className={`p-6 rounded-full bg-white shadow-xl transition-all duration-1000 ${isAnalyzing ? 'animate-pulse scale-110' : 'scale-100'}`}>
              <BrainCircuit size={64} className={isAnalyzing ? 'text-blue-500' : 'text-[#2D3E50]'} />
            </div>
            {isAnalyzing && (
              <div className="absolute inset-0 border-4 border-blue-400 rounded-full animate-ping opacity-25"></div>
            )}
          </div>

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-[#2D3E50] text-3xl font-black uppercase tracking-tight mb-2">
              &ldquo;Analyze for leader&rdquo;
            </h1>
            <p className="text-gray-500 font-medium">ระบบกำลังวิเคราะห์ความเหมาะสมจากข้อมูลสมาชิก...</p>
          </div>

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
                      bg-white rounded-[35px] p-6 flex flex-col items-center gap-4 shadow-sm relative overflow-hidden
                      transition-all duration-500 border-4
                      ${isBest ? 'border-yellow-400 scale-105 shadow-2xl' : 'border-transparent'}
                    `}
                  >
                    {isBest && (
                      <div className="absolute top-4 right-4 bg-yellow-400 text-white p-1 rounded-full">
                        <Sparkles size={16} fill="currentColor" />
                      </div>
                    )}

                    <div className="relative w-24 h-24 md:w-28 md:h-28">
                      <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 border-2 border-gray-100 shadow-inner">
                        <img
                          src={member.avatarSeed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed + 100}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`}
                          alt={member.name}
                          className="w-full h-full object-cover"
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
                      <p className="text-sm text-gray-400 mt-1 mb-3">นักเรียน</p>

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
            className={`
              w-full max-w-sm py-5 rounded-[25px] font-black text-3xl shadow-lg transition-all transform active:scale-95
              ${isAnalyzing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#2D3E50] text-white hover:bg-[#1E293B] shadow-[#1A2635]/30'}
            `}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'ANALYZING...' : 'CONFIRM LEADER'}
          </button>

          {/* Helper Legend */}
          <div className="mt-8 flex gap-6 text-gray-500 text-xs font-bold italic opacity-60">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Competency</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Best Fit</span>
          </div>

        </div>
      </main>

      <style jsx global>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
      `}</style>
    </div>
  );
}
