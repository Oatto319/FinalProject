'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Crown, Users, Layers, ShieldCheck, Star } from 'lucide-react';
import Navbar from '../navbar/page';
import { typeColor } from '@/lib/mbti';
import { resolveAvatar } from '@/lib/avatar';

interface CriteriaScore { key: string; label: string; score: number | null; }
interface OverallScore { count: number; overall: number | null; byCriteria: CriteriaScore[]; }
interface HostTeamSummary {
  id: number;
  name: string;
  memberCount: number;
  avgEvaluation: number | null;
  typeCounts: Record<string, number>;
  members: { name: string; avatarSeed: number; avatarImage: string | null }[];
  leaderName: string | null;
}
interface ProjectSummary {
  roomId: string;
  title: string;
  template: string;
  ended: boolean;
  matchedAt: string | null;
  teamName: string | null;
  mbti: { code: string; title: string; jobs: string[] } | null;
  isLeader: boolean;
  isHostView: boolean;
  teamCount: number | null;
  memberCount: number | null;
  evaluation: { count: number; overall: number | null; byCriteria: CriteriaScore[] };
  teams: HostTeamSummary[] | null;
  typeComposition?: Record<string, number> | null;
}

const TEMPLATE_LABELS: Record<string, string> = {
  programming: 'Programming',
  service: 'Customer Service',
  presentation: 'Presentation',
  design: 'Design',
};

// แถบดาว 5 ดวง — เติมสีตามสัดส่วนคะแนนจริง (เช่น 4.6/5 ดาวดวงที่ 5 จะเติมสีแค่ 60%) ไม่ปัดเป็นเต็ม/ว่างเท่านั้น
function StarRating({ score, size = 11 }: { score: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const fillPct = Math.max(0, Math.min(1, score - (i - 1))) * 100;
        return (
          <div key={i} className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-gray-200 fill-gray-200" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPct}%` }}>
              <Star size={size} className="text-amber-400 fill-amber-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// การ์ดเดี่ยว โชว์คะแนนเฉลี่ยรวมของตัวเอง ข้ามทุกโปรเจกต์ที่เคยเป็นสมาชิกทีม (ไม่รวมห้องที่เป็น host)
// วางเหนือลิสต์โปรเจกต์ เพื่อให้เห็นภาพรวมตัวเองก่อนไล่ดูรายห้อง
function OverallScoreCard({ overall }: { overall: OverallScore }) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-bold">คะแนนเฉลี่ยรวมของคุณ</p>
        <p className="text-[11px] text-gray-300 mt-0.5">
          {overall.count > 0 ? `อ้างอิงจากเพื่อนร่วมทีมประเมิน ${overall.count} ครั้ง ทุกโปรเจกต์` : 'ยังไม่มีเพื่อนร่วมทีมประเมินคุณ'}
        </p>
      </div>
      <span className="flex items-center gap-1.5 text-3xl font-black text-gray-800 flex-shrink-0">
        <Star size={26} className="text-amber-400 fill-amber-400" />
        {overall.overall !== null ? overall.overall.toFixed(1) : '–'}
      </span>
    </div>
  );
}

// บล็อกคะแนน+เกณฑ์ย่อยที่ใช้ร่วมกันทั้งฝั่ง host (คะแนนเฉลี่ยของทั้งห้อง) และฝั่งสมาชิกทีม (คะแนนที่ได้รับ)
// เพื่อให้สอง view นี้มี UX เดียวกันทั้งเลย์เอาต์และตำแหน่งที่แสดง (sidebar บนจอใหญ่ / บล็อกล่างบนมือถือ)
function EvalScoreBlock({ label, evaluation, align }: { label: string; evaluation: ProjectSummary['evaluation']; align: 'between' | 'end' }) {
  return (
    <>
      <div className={`flex items-center gap-1.5 mb-3 lg:mb-0 ${align === 'end' ? 'justify-end' : 'justify-between'}`}>
        <p className={`text-gray-400 ${align === 'end' ? 'text-sm' : 'text-xs'}`}>{label}</p>
        <span className="flex items-center gap-1 text-xl font-black text-gray-800">
          <Star size={18} className="text-amber-400 fill-amber-400" />
          {evaluation.overall !== null ? evaluation.overall.toFixed(1) : '–'}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {evaluation.byCriteria
          .filter((c) => c.score !== null)
          .slice(0, 4)
          .map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-2 text-xs text-gray-400">
              <span>{c.label}</span>
              <div className="flex items-center gap-1">
                <StarRating score={c.score ?? 0} size={13} />
                <span className="text-gray-500 font-bold">{(c.score ?? 0).toFixed(1)}</span>
              </div>
            </div>
          ))}
      </div>
    </>
  );
}

export default function SummaryPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [overall, setOverall] = useState<OverallScore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cardVisible, setCardVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setCardVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleBack = () => {
    setCardVisible(false);
    setTimeout(() => router.back(), 300);
  };

  useEffect(() => {
    let cancelled = false;
    // cache: 'no-store' — สรุปผลเปลี่ยนได้ทุกครั้งที่มีคนส่งแบบประเมิน จึงต้องไม่ให้เบราว์เซอร์ใช้ของเก่า
    fetch('/api/summary', { cache: 'no-store' })
      .then(async (r) => {
        // session หมดอายุ (cookie ยังอยู่แต่ token ใน DB ไม่ตรงแล้ว) — middleware ไม่ redirect ให้ จึงต้องพากลับไป login เอง
        if (r.status === 401) {
          router.replace('/login');
          return;
        }
        const data = await r.json().catch(() => null);
        if (cancelled) return;
        if (!r.ok) {
          setError(data?.error ?? 'โหลดข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง');
          return;
        }
        setProjects(data?.projects ?? []);
        setOverall(data?.overall ?? null);
      })
      .catch(() => {
        if (!cancelled) setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง');
      });
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#1D324B] font-sans flex flex-col">
      <div className="sticky top-0 z-20">
        <Navbar bgColor="#122031" nameColor="white" />
      </div>

      <div className={`flex flex-col flex-1 transition-transform duration-300 ease-out ${cardVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="w-full px-3 py-4 flex items-center gap-3 max-w-7xl mx-auto">
        <button
          onClick={handleBack}
          className="lg:hidden flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-700 transition-all active:scale-95"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <h1 className="text-lg font-black text-white">สรุปผล</h1>
      </div>

      <div className="flex-1 px-3 pb-10 max-w-7xl mx-auto w-full flex items-start gap-3">
        <button
          onClick={handleBack}
          className="hidden lg:flex flex-shrink-0 w-12 h-12 bg-white rounded-full items-center justify-center text-gray-700 transition-all active:scale-95"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>

        <div className="flex-1 min-w-0 flex flex-col gap-4">
        {error && <p className="text-center text-sm text-white/60 mt-10">{error}</p>}

        {!error && projects === null && (
          <p className="text-center text-sm text-white/60 mt-10">กำลังโหลด...</p>
        )}

        {!error && projects !== null && projects.length === 0 && (
          <div className="text-center mt-10">
            <p className="text-sm text-white/60">ยังไม่มีโปรเจกต์ที่จับกลุ่มแล้ว</p>
            <p className="text-xs text-white/40 mt-1">พอห้องแรกของคุณจับกลุ่มเสร็จ สรุปผลจะขึ้นที่นี่</p>
          </div>
        )}

        {overall && <OverallScoreCard overall={overall} />}

        {projects?.map((p) => (
          <div key={p.roomId} className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="min-w-0">
                <p className="font-black text-gray-800 truncate">{p.title}</p>
                {p.teamName && <p className="text-xs text-gray-400 truncate">{p.teamName}</p>}
              </div>
              <span
                className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  p.ended ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}
              >
                {p.ended ? 'จบโปรเจกต์แล้ว' : 'กำลังดำเนินการ'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              {p.isHostView ? (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">
                  <ShieldCheck size={12} /> คุณเป็นเจ้าของกิจกรรม
                </span>
              ) : p.mbti ? (
                <span
                  className="text-xs font-black px-2.5 py-1 rounded-lg text-white"
                  style={{ backgroundColor: typeColor(p.mbti.code) }}
                >
                  {p.mbti.code}
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-400">
                  ยังไม่มีผล MBTI
                </span>
              )}
              <span className="text-xs text-gray-400">{TEMPLATE_LABELS[p.template] ?? p.template}</span>
              {p.isLeader && (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
                  <Crown size={12} /> หัวหน้าทีม
                </span>
              )}
            </div>

            {/* เลย์เอาต์เดียวกันทั้ง host และสมาชิกทีม: เนื้อหาหลัก + sidebar คะแนนบนจอใหญ่ (w-44)
                ทั้งสอง view ใช้กล่องทีมชุดเดียวกัน (p.teams) ต่างกันแค่จำนวนกล่อง — host เห็นทุกทีมในห้อง สมาชิกเห็นแค่ทีมตัวเอง */}
            <div className="lg:flex lg:items-center lg:gap-3">
              <div className="flex-1 min-w-0 lg:max-w-[calc(100%-14.25rem)]">
                {p.teams && p.teams.length > 0 && (
                  <>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#4B3E7A]/8 text-[#4B3E7A]">
                        <Layers size={12} /> {p.teamCount ?? p.teams.length} ทีม
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#4B3E7A]/8 text-[#4B3E7A]">
                        <Users size={12} /> {p.memberCount ?? 0} คน
                      </span>
                    </div>

                    {/* สรุปรายทีม — เฉพาะค่าเฉลี่ย/จำนวนนับ ไม่มีคะแนนรายคน เพื่อไม่ให้ขัดกับความไม่เปิดเผยตัวตนของแบบประเมิน */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                      {p.teams.map((team) => (
                        <div key={team.id} className="bg-gray-50 rounded-2xl p-4 h-[220px] overflow-hidden flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-gray-700 truncate">{team.name}</span>
                            <span className="text-[11px] text-gray-400 flex-shrink-0">
                              {team.avgEvaluation !== null ? `เฉลี่ย ${team.avgEvaluation.toFixed(1)}/5` : 'ยังไม่มีประเมิน'}
                            </span>
                          </div>

                          {team.members.length > 0 && (
                            <div className="flex flex-wrap -space-x-2 sm:-space-x-3 lg:-space-x-4 mb-2">
                              {team.members.map((m) => {
                                const isTeamLeader = team.leaderName === m.name;
                                return (
                                  <div
                                    key={m.name}
                                    title={isTeamLeader ? `${m.name} (หัวหน้าทีม)` : m.name}
                                    className="relative w-9 h-9 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full overflow-hidden border-2 border-white bg-gray-100 flex-shrink-0"
                                  >
                                    <img src={resolveAvatar(m)} alt={m.name} className="w-full h-full object-contain" />
                                    {isTeamLeader && (
                                      <Crown
                                        size={13}
                                        className="absolute -top-1 -right-1 text-amber-500 fill-amber-400 drop-shadow"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1">
                            {Object.entries(team.typeCounts).map(([key, count]) => {
                              const target = p.typeComposition?.[key];
                              return (
                                <span key={key} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4B3E7A]/8 text-[#4B3E7A]">
                                  {key} {count}{target ? `/${target}` : ''}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {p.evaluation.count > 0 && (
                <div className="hidden lg:flex flex-col gap-2 w-44 flex-shrink-0 mr-10">
                  <EvalScoreBlock
                    label={p.isHostView ? 'คะแนนประเมินเฉลี่ยของทั้งห้อง' : 'คะแนนประเมินจากเพื่อนร่วมทีม'}
                    evaluation={p.evaluation}
                    align="end"
                  />
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4">
              {p.evaluation.count === 0 ? (
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Users size={14} />
                  {!p.ended
                    ? 'แบบประเมินจะเปิดให้ทำเมื่อกิจกรรมจบ'
                    : p.isHostView
                      ? 'ยังไม่มีแบบประเมินในห้องนี้'
                      : 'เพื่อนร่วมทีมยังไม่ได้ประเมินคุณ'}
                </p>
              ) : (
                <div className="lg:hidden">
                  <EvalScoreBlock
                    label={p.isHostView ? 'คะแนนประเมินเฉลี่ยของทั้งห้อง' : 'คะแนนประเมินจากเพื่อนร่วมทีม'}
                    evaluation={p.evaluation}
                    align="between"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        </div>
      </div>
      </div>
    </div>
  );
}