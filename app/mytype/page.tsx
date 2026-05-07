'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Navbar from '../navbar/page';

type MBTIResult = {
  title: string;
  description: string;
  jobs: string[];
  icon: string;
  typeScores: { title: string; icon: string; score: number }[];
  completedAt: string;
};

type UserTypes = {
  programming?: MBTIResult;
  service?: MBTIResult;
  presentation?: MBTIResult;
  design?: MBTIResult;
};

const TEMPLATES = [
  { id: 'programming',  label: 'PROGRAMMING',       color: 'bg-[#FFAAAA]', textColor: 'text-[#4F437B]', route: '/question/programming' },
  { id: 'service',      label: 'CUSTOMER / SERVICE', color: 'bg-[#71EFB8]', textColor: 'text-[#FF4573]', route: '/question/service' },
  { id: 'presentation', label: 'PRESENTATION',       color: 'bg-[#EAFF48]', textColor: 'text-[#21871C]', route: '/question/presentation' },
  { id: 'design',       label: 'DESIGN / CREATIVE',  color: 'bg-[#8C71EF]', textColor: 'text-white',     route: '/question/design' },
];

const MyTypePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatarSeed: number; gmail?: string; types?: UserTypes } | null>(null);
  const [expandedScores, setExpandedScores] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return;
    const local = JSON.parse(raw);
    setUser(local);

    fetch(`/api/users?gmail=${encodeURIComponent(local.gmail)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          const updated = { ...local, types: data.user.types };
          setUser(updated);
          localStorage.setItem('currentUser', JSON.stringify(updated));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#E5E7EB] font-sans flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-6xl px-4 py-4 flex flex-col items-center">

      {/* Main Card Container + Back Button */}
      <div className="w-full max-w-6xl flex items-start gap-3">

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mt-2 flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all"
        >
          <ChevronLeft size={24} strokeWidth={2.5} className="text-gray-700" />
        </button>

      <div className="flex-1 bg-white rounded-[24px] shadow-xl overflow-hidden flex flex-col relative border-b-8 border-gray-300">

        {/* Content Grid */}
        <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {TEMPLATES.map((tmpl) => {
            const result = user?.types?.[tmpl.id as keyof UserTypes];
            return (
              <div key={tmpl.id} className="flex flex-col rounded-[20px] overflow-hidden shadow-sm border border-gray-100">
                {/* Template Title Header */}
                <div className={`${tmpl.color} py-3 px-6 text-center`}>
                  <h2 className={`${tmpl.textColor} text-xl font-black tracking-tight uppercase`}>
                    {tmpl.label}
                  </h2>
                </div>

                {result ? (
                  /* มีผลแล้ว — แสดงข้อมูลจริง */
                  <div className="bg-white p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <img src={result.icon} alt={result.title} className="w-28 h-28 object-contain flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 font-medium">ประเภทบุคลิกภาพการทำงาน</p>
                        <p className="text-xl font-black text-[#4B3E7A]">{result.title}</p>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">{result.description}</p>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">ตำแหน่งงานที่เหมาะสม</p>
                      <div className="flex flex-wrap gap-2">
                        {result.jobs.map((job) => (
                          <span key={job} className="bg-[#EDE9FF] text-[#4B3E7A] text-xs font-bold px-3 py-1.5 rounded-full">
                            {job}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => setExpandedScores((prev) => ({ ...prev, [tmpl.id]: !prev[tmpl.id] }))}
                        className="flex items-center gap-1 text-xs font-black text-gray-400 uppercase tracking-widest mb-2 hover:text-gray-600 transition-colors"
                      >
                        คะแนนแต่ละประเภท
                        {expandedScores[tmpl.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {expandedScores[tmpl.id] && (
                        <div className="flex flex-col gap-2">
                          {result.typeScores.map((t) => (
                            <div key={t.title} className="flex items-center gap-3">
                              <img src={t.icon} alt={t.title} className="w-6 h-6 object-contain flex-shrink-0" />
                              <span className="text-xs font-bold text-[#1A2E44] w-24 flex-shrink-0">{t.title}</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-2">
                                <div
                                  className="bg-[#4B3E7A] h-2 rounded-full"
                                  style={{ width: `${(t.score / 11) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-black text-[#4B3E7A] w-10 text-right flex-shrink-0">{t.score}/11</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ยังไม่ได้ทำ */
                  <div className="bg-white p-6 flex flex-col items-center justify-center gap-4 min-h-[160px]">
                    <p className="text-gray-400 font-medium text-sm">ยังไม่ได้ทำ template นี้</p>
                    <button
                      onClick={() => router.push(tmpl.route)}
                      className="bg-[#4B3E7A] text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-[#3b3161] transition-colors"
                    >
                      ไปทำเลย
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default MyTypePage;
