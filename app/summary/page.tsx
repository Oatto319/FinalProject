'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Crown, Users, Layers, ShieldCheck } from 'lucide-react';
import Navbar from '../navbar/page';
import { typeColor } from '@/lib/mbti';

interface CriteriaScore { key: string; label: string; score: number | null; }
interface ProjectSummary {
  roomId: string;
  title: string;
  template: string;
  ended: boolean;
  teamName: string | null;
  mbti: { code: string; title: string; jobs: string[] } | null;
  isLeader: boolean;
  isHostView: boolean;
  teamCount: number | null;
  memberCount: number | null;
  evaluation: { count: number; overall: number | null; byCriteria: CriteriaScore[] };
}

const TEMPLATE_LABELS: Record<string, string> = {
  programming: 'Programming',
  service: 'Customer Service',
  presentation: 'Presentation',
  design: 'Design',
};

export default function SummaryPage() {
  const router = useRouter();
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
        setProjects(data?.projects ?? []);
      })
      .catch(() => {
        if (!cancelled) setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง');
      });
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#E5E7EB] font-sans flex flex-col">
      <Navbar />

      <div className="w-full px-3 py-4 flex items-center gap-3 max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-700 transition-all active:scale-95"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <h1 className="text-lg font-black text-gray-800">สรุปผล</h1>
      </div>

      <div className="flex-1 px-3 pb-10 max-w-3xl mx-auto w-full flex flex-col gap-4">
        {error && <p className="text-center text-sm text-gray-400 mt-10">{error}</p>}

        {!error && projects === null && (
          <p className="text-center text-sm text-gray-400 mt-10">กำลังโหลด...</p>
        )}

        {!error && projects !== null && projects.length === 0 && (
          <div className="text-center mt-10">
            <p className="text-sm text-gray-400">ยังไม่มีโปรเจกต์ที่จับกลุ่มแล้ว</p>
            <p className="text-xs text-gray-300 mt-1">พอห้องแรกของคุณจับกลุ่มเสร็จ สรุปผลจะขึ้นที่นี่</p>
          </div>
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
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#4B3E7A]/8 text-[#4B3E7A]">
                  <Layers size={12} /> {p.teamCount ?? 0} ทีม
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#4B3E7A]/8 text-[#4B3E7A]">
                  <Users size={12} /> {p.memberCount ?? 0} คน
                </span>
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
                  <div className="flex items-baseline justify-between mb-3">
                    <p className="text-xs text-gray-400">
                      {p.isHostView ? 'คะแนนประเมินเฉลี่ยของทั้งห้อง' : 'คะแนนประเมินจากเพื่อนร่วมทีม'}
                    </p>
                    <p className="text-xl font-black text-gray-800">
                      {p.evaluation.overall}
                      <span className="text-xs font-bold text-gray-300"> / 5</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {p.evaluation.byCriteria
                      .filter((c) => c.score !== null)
                      .slice(0, 4)
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
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}