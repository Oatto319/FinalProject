'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Crown, Users, Layers, ShieldCheck, Star } from 'lucide-react';
import Navbar from '../navbar/page';
import { typeColor } from '@/lib/mbti';
import { resolveAvatar } from '@/lib/avatar';

interface CriteriaScore { key: string; label: string; score: number | null; }
interface HostTeamSummary {
  id: number;
  name: string;
  memberCount: number;
  avgEvaluation: number | null;
  typeCounts: Record<string, number>;
  members: { name: string; avatarSeed: number; avatarImage: string | null }[];
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

// การ์ดแนวโน้มคะแนนประเมินข้ามโปรเจกต์ (เรียงตามเวลาจริง ไม่ใช่ลำดับที่แสดงในลิสต์ด้านล่างซึ่งเอาห้องที่จบแล้วขึ้นก่อน)
function EvalTrendCard({ points }: { points: { title: string; overall: number }[] }) {
  if (points.length < 2) return null;
  const w = 100;
  const h = 32;
  const stepX = w / (points.length - 1);
  const toY = (v: number) => h - (v / 5) * h;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${toY(p.overall)}`).join(' ');
  const latest = points[points.length - 1].overall;
  const delta = Math.round((latest - points[points.length - 2].overall) * 10) / 10;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs text-gray-400 font-bold">แนวโน้มคะแนนประเมิน ({points.length} โปรเจกต์)</p>
        <p className={`text-xs font-black ${delta > 0 ? 'text-emerald-500' : delta < 0 ? 'text-red-400' : 'text-gray-400'}`}>
          {delta > 0 ? '▲' : delta < 0 ? '▼' : '='} {Math.abs(delta)} จากโปรเจกต์ก่อนหน้า
        </p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
        <path d={path} fill="none" stroke="#34D399" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={i * stepX} cy={toY(p.overall)} r="1.5" fill="#34D399" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-300 truncate max-w-[45%]">{points[0].title}</span>
        <span className="text-[10px] text-gray-700 font-bold truncate max-w-[45%] text-right">{points[points.length - 1].title} · {latest}/5</span>
      </div>
    </div>
  );
}

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

export default function SummaryPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
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

        {projects && (
          <EvalTrendCard
            points={projects
              .filter((p) => !p.isHostView && p.evaluation.overall !== null && p.matchedAt !== null)
              .sort((a, b) => new Date(a.matchedAt as string).getTime() - new Date(b.matchedAt as string).getTime())
              .map((p) => ({ title: p.title, overall: p.evaluation.overall as number }))}
          />
        )}

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

            {p.isHostView ? (
              <div className="lg:flex lg:items-center lg:gap-3">
                <div className="flex-1 min-w-0 lg:max-w-[calc(100%-14.25rem)]">
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#4B3E7A]/8 text-[#4B3E7A]">
                      <Layers size={12} /> {p.teamCount ?? 0} ทีม
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#4B3E7A]/8 text-[#4B3E7A]">
                      <Users size={12} /> {p.memberCount ?? 0} คน
                    </span>
                  </div>

                  {/* สรุปรายทีม — เฉพาะค่าเฉลี่ย/จำนวนนับ ไม่มีคะแนนรายคน เพื่อไม่ให้ขัดกับความไม่เปิดเผยตัวตนของแบบประเมิน */}
                  {p.teams && p.teams.length > 0 && (
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
                              {team.members.map((m) => (
                                <div key={m.name} title={m.name} className="w-9 h-9 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full overflow-hidden border-2 border-white bg-gray-100 flex-shrink-0">
                                  <img src={resolveAvatar(m)} alt={m.name} className="w-full h-full object-contain" />
                                </div>
                              ))}
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
                  )}
                </div>

                {p.evaluation.count > 0 && (
                  <div className="hidden lg:flex flex-col gap-2 w-44 flex-shrink-0 mr-10">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-sm text-gray-400">คะแนนประเมินเฉลี่ยของทั้งห้อง</span>
                      <span className="flex items-center gap-1 text-xl font-black text-gray-800">
                        <Star size={18} className="text-amber-400 fill-amber-400" />
                        {(p.evaluation.overall ?? 0).toFixed(1)}
                      </span>
                    </div>
                    {p.evaluation.byCriteria
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
                )}
              </div>
            ) : (
              p.mbti && p.mbti.jobs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {p.mbti.jobs.slice(0, 4).map((job) => (
                    <span key={job} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#4B3E7A]/8 text-[#4B3E7A]">
                      {job}
                    </span>
                  ))}
                </div>
              )
            )}

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
                <>
                  <div className={`flex items-center justify-between mb-3 ${p.isHostView ? 'lg:hidden' : ''}`}>
                    <p className="text-xs text-gray-400">
                      {p.isHostView ? 'คะแนนประเมินเฉลี่ยของทั้งห้อง' : 'คะแนนประเมินจากเพื่อนร่วมทีม'}
                    </p>
                    <span className="flex items-center gap-1 text-xl font-black text-gray-800">
                      <Star size={18} className="text-amber-400 fill-amber-400" />
                      {(p.evaluation.overall ?? 0).toFixed(1)}
                    </span>
                  </div>
                  <div className={`flex flex-col gap-2 ${p.isHostView ? 'lg:hidden' : ''}`}>
                    {p.evaluation.byCriteria
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