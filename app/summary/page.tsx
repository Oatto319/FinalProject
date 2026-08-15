'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown, Crown, Users, Layers, ShieldCheck } from 'lucide-react';
import Navbar from '../navbar/page';
import { typeColor } from '@/lib/mbti';
import { resolveAvatar } from '@/lib/avatar';

interface Profile { name: string; avatarSeed: number; avatarImage: string | null; role: string; }
interface CriteriaScore { key: string; label: string; score: number | null; }
interface OverallScore { count: number; overall: number | null; byCriteria: CriteriaScore[]; }

const ROLE_LABELS: Record<string, string> = { host: 'อาจารย์', user: 'นักเรียน' };
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

// สีความหมาย (ไม่ใช่สีแบรนด์) ให้รู้ "ดี/กลาง/ควรพัฒนา" ได้ในแวบแรกโดยไม่ต้องอ่านตัวเลข
type Band = 'good' | 'mid' | 'low' | 'none';

function scoreBand(score: number | null): Band {
  if (score === null) return 'none';
  if (score >= 4.2) return 'good';
  if (score >= 3.5) return 'mid';
  return 'low';
}

const BAND_STYLES: Record<Band, { ring: string; text: string; bg: string; verdict: string }> = {
  good: { ring: '#059669', text: 'text-emerald-600', bg: 'bg-emerald-50', verdict: 'ผลงานดีเยี่ยม' },
  mid: { ring: '#D97706', text: 'text-amber-600', bg: 'bg-amber-50', verdict: 'กำลังไปได้ดี' },
  low: { ring: '#E11D48', text: 'text-rose-600', bg: 'bg-rose-50', verdict: 'ควรพัฒนาเพิ่มเติม' },
  none: { ring: '#D1D5DB', text: 'text-gray-400', bg: 'bg-gray-100', verdict: 'ยังไม่มีข้อมูลประเมิน' },
};

// วงแหวนคะแนนตัวใหญ่ + คำตัดสินเป็นคำพูด + สถิติย่อ — จุดโฟกัสเดียวที่เข้าใจได้ในแวบแรกโดยไม่ต้องอ่านตัวเลขละเอียด
function ScoreMeter({
  overall,
  stats,
}: {
  overall: OverallScore;
  stats: { total: number; ended: number; inProgress: number };
}) {
  const band = scoreBand(overall.overall);
  const style = BAND_STYLES[band];
  const size = 176;
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const fraction = overall.overall !== null ? Math.max(0, Math.min(1, overall.overall / 5)) : 0;
  const dashOffset = circumference * (1 - fraction);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F3F4F6" strokeWidth="14" />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={style.ring} strokeWidth="14"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black" style={{ color: style.ring }}>{overall.overall ?? '–'}</span>
          <span className="text-xs text-gray-300 font-bold mt-0.5">จาก 5.0</span>
        </div>
      </div>

      <span className={`inline-block mt-3 text-xs font-black px-3 py-1.5 rounded-full ${style.bg} ${style.text}`}>
        {style.verdict}
      </span>
      <p className="text-xs text-gray-400 mt-2">
        {overall.count > 0 ? `อ้างอิงจากเพื่อนร่วมทีมประเมิน ${overall.count} ครั้ง` : 'ยังไม่มีเพื่อนร่วมทีมประเมินคุณ'}
      </p>

      <div className="grid grid-cols-3 gap-2 w-full mt-4">
        <div className="bg-gray-50 rounded-2xl py-2.5">
          <p className="text-lg font-black text-[#4B3E7A]">{stats.total}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">โปรเจกต์</p>
        </div>
        <div className="bg-gray-50 rounded-2xl py-2.5">
          <p className="text-lg font-black text-emerald-600">{stats.ended}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">จบแล้ว</p>
        </div>
        <div className="bg-gray-50 rounded-2xl py-2.5">
          <p className="text-lg font-black text-amber-600">{stats.inProgress}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">กำลังทำ</p>
        </div>
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

// การ์ดห้องแบบกระชับ — ค่าเริ่มต้นโชว์แค่ชื่อ/สถานะ/แท็กหลัก/คะแนนรวม ส่วนรายละเอียด (เกณฑ์ย่อย/งานที่เหมาะ/ทีม)
// พับซ่อนไว้หลังปุ่ม "ดูรายละเอียด" — จำเป็นเมื่อมีหลายโปรเจกต์พร้อมกัน จะได้กวาดตาดูภาพรวมทั้งหมดได้ในหน้าจอเดียว
function RoomCard({ p }: { p: ProjectSummary }) {
  const [expanded, setExpanded] = useState(false);
  const style = BAND_STYLES[scoreBand(p.evaluation.overall)];
  const hasExpandableContent =
    (p.isHostView ? !!(p.teams && p.teams.length > 0) : !!(p.mbti && p.mbti.jobs.length > 0)) ||
    p.evaluation.byCriteria.some((c) => c.score !== null);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-black text-gray-800 line-clamp-2">{p.title}</p>
          {p.teamName && <p className="text-xs text-gray-400 truncate">{p.teamName}</p>}
        </div>
        <span
          className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
            p.ended ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}
        >
          {p.ended ? 'จบแล้ว' : 'กำลังดำเนินการ'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {p.isHostView ? (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">
            <ShieldCheck size={12} /> เจ้าของกิจกรรม
          </span>
        ) : p.mbti ? (
          <span className="text-xs font-black px-2.5 py-1 rounded-lg text-white" style={{ backgroundColor: typeColor(p.mbti.code) }}>
            {p.mbti.code}
          </span>
        ) : (
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-400">ยังไม่มีผล MBTI</span>
        )}
        <span className="text-xs text-gray-400">{TEMPLATE_LABELS[p.template] ?? p.template}</span>
        {p.isLeader && (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
            <Crown size={12} /> หัวหน้าทีม
          </span>
        )}
      </div>

      <div className="border-t border-gray-100 pt-3">
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
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400">
                {p.isHostView ? 'คะแนนเฉลี่ยของทั้งห้อง' : 'คะแนนจากเพื่อนร่วมทีม'}
              </p>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${((p.evaluation.overall ?? 0) / 5) * 100}%`, background: p.isHostView ? '#9CA3AF' : style.ring }}
                />
              </div>
            </div>
            <p className={`flex-shrink-0 text-xl font-black ${p.isHostView ? 'text-gray-800' : style.text}`}>
              {p.evaluation.overall}
              <span className="text-xs font-bold text-gray-300"> / 5</span>
            </p>
          </div>
        )}
      </div>

      {hasExpandableContent && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1 text-[11px] font-bold text-gray-400 mt-3 pt-3 border-t border-gray-100 active:scale-[0.99] transition-transform"
        >
          {expanded ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
          <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}

      {expanded && (
        <div className="mt-3 flex flex-col gap-3">
          {p.isHostView ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#4B3E7A]/8 text-[#4B3E7A]">
                  <Layers size={12} /> {p.teamCount ?? 0} ทีม
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#4B3E7A]/8 text-[#4B3E7A]">
                  <Users size={12} /> {p.memberCount ?? 0} คน
                </span>
              </div>

              {/* สรุปรายทีม — เฉพาะค่าเฉลี่ย/จำนวนนับ ไม่มีคะแนนรายคน เพื่อไม่ให้ขัดกับความไม่เปิดเผยตัวตนของแบบประเมิน */}
              {p.teams && p.teams.length > 0 && (
                <div className="flex flex-col gap-2">
                  {p.teams.map((team) => (
                    <div key={team.id} className="bg-gray-50 rounded-2xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-gray-700 truncate">{team.name}</span>
                        <span className="text-[11px] text-gray-400 flex-shrink-0">
                          {team.avgEvaluation !== null ? `เฉลี่ย ${team.avgEvaluation}/5` : 'ยังไม่มีประเมิน'}
                        </span>
                      </div>
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
            </>
          ) : (
            p.mbti && p.mbti.jobs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {p.mbti.jobs.slice(0, 4).map((job) => (
                  <span key={job} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#4B3E7A]/8 text-[#4B3E7A]">
                    {job}
                  </span>
                ))}
              </div>
            )
          )}

          {p.evaluation.byCriteria.some((c) => c.score !== null) && (
            <div className="flex flex-col gap-2">
              {p.evaluation.byCriteria
                .filter((c) => c.score !== null)
                .map((c) => (
                  <div key={c.key}>
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>{c.label}</span>
                      <span>{c.score}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${((c.score ?? 0) / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SummaryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [overall, setOverall] = useState<OverallScore | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setProfile(data?.profile ?? null);
        setOverall(data?.overall ?? null);
        setProjects(data?.projects ?? []);
      })
      .catch(() => {
        if (!cancelled) setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง');
      });
    return () => { cancelled = true; };
  }, [router]);

  const endedCount = projects?.filter((p) => p.ended).length ?? 0;
  const inProgressCount = projects?.filter((p) => !p.ended).length ?? 0;

  return (
    <div className="min-h-screen bg-[#E5E7EB] font-sans flex flex-col">
      <Navbar />

      <div className="w-full px-3 py-4 flex items-center gap-3 max-w-3xl lg:max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-700 transition-all active:scale-95"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <h1 className="text-lg font-black text-gray-800">สรุปผล</h1>
      </div>

      <div className="flex-1 px-3 pb-10 max-w-3xl lg:max-w-5xl mx-auto w-full">
        {error && <p className="text-center text-sm text-gray-400 mt-10">{error}</p>}

        {!error && projects === null && (
          <p className="text-center text-sm text-gray-400 mt-10">กำลังโหลด...</p>
        )}

        {!error && projects !== null && (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            {/* คอลัมน์ซ้าย (PC): โปรไฟล์ + คะแนนรวม ปักหมุดค้างไว้ตอนเลื่อนดูรายห้อง */}
            <div className="flex flex-col gap-4 lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-6">
              {profile && (
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-orange-100 border-2 border-orange-200">
                    <img src={resolveAvatar(profile)} alt="Profile" className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-gray-800 truncate">{profile.name}</p>
                    <p className="text-xs text-gray-400">{ROLE_LABELS[profile.role] ?? profile.role}</p>
                  </div>
                </div>
              )}

              {overall && (
                <ScoreMeter
                  overall={overall}
                  stats={{ total: projects.length, ended: endedCount, inProgress: inProgressCount }}
                />
              )}
            </div>

            {/* คอลัมน์ขวา (PC) / ต่อจากด้านบน (มือถือ): รายห้อง */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              {projects.length === 0 ? (
                <div className="text-center mt-4 lg:mt-10">
                  <p className="text-sm text-gray-400">ยังไม่มีโปรเจกต์ที่จับกลุ่มแล้ว</p>
                  <p className="text-xs text-gray-300 mt-1">พอห้องแรกของคุณจับกลุ่มเสร็จ สรุปผลจะขึ้นที่นี่</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 xl:grid xl:grid-cols-2 xl:items-start">
                  {projects.map((p) => (
                    <RoomCard key={p.roomId} p={p} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
