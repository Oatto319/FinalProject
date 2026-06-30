'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Navbar from '../navbar/page';
import { MBTI_CODES } from '@/lib/mbti';
import { programmingTypeTable } from '@/lib/mbti-programming';
import { serviceTypeTable } from '@/lib/mbti-service';
import { presentationTypeTable } from '@/lib/mbti-presentation';
import { designTypeTable } from '@/lib/mbti-design';

const ENGLISH_NAMES: Record<string, string> = {
  INTJ: 'Architect',    INTP: 'Logician',     ENTJ: 'Commander',    ENTP: 'Debater',
  INFJ: 'Advocate',     INFP: 'Mediator',     ENFJ: 'Protagonist',  ENFP: 'Campaigner',
  ISTJ: 'Logistician',  ISFJ: 'Defender',     ESTJ: 'Executive',    ESFJ: 'Consul',
  ISTP: 'Virtuoso',     ISFP: 'Adventurer',   ESTP: 'Entrepreneur', ESFP: 'Entertainer',
};

const GROUPS = [
  { label: 'Analysts',  watermark: 'ANALYSTS',  suffix: 'NT', codes: ['INTJ','INTP','ENTJ','ENTP'], color: '#6D58B9' },
  { label: 'Diplomats', watermark: 'DIPLOMATS', suffix: 'NF', codes: ['INFJ','INFP','ENFJ','ENFP'], color: '#3FA796' },
  { label: 'Sentinels', watermark: 'SENTINELS', suffix: 'SJ', codes: ['ISTJ','ISFJ','ESTJ','ESFJ'], color: '#4F86C6' },
  { label: 'Explorers', watermark: 'EXPLORERS', suffix: 'SP', codes: ['ISTP','ISFP','ESTP','ESFP'], color: '#E08E45' },
];

const TABS = [
  { id: 'programming',  label: 'Programming' },
  { id: 'service',      label: 'Customer Service' },
  { id: 'presentation', label: 'Presentation' },
  { id: 'design',       label: 'Design' },
] as const;
type TabId = typeof TABS[number]['id'];

const TYPE_TABLES = {
  programming: programmingTypeTable,
  service: serviceTypeTable,
  presentation: presentationTypeTable,
  design: designTypeTable,
};

type UserShape = {
  name: string;
  avatarSeed: number;
  gmail?: string;
  types?: Record<string, unknown>;
};

const MyTypePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserShape | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('programming');
  const [modalCode, setModalCode] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return;
    const local = JSON.parse(raw);
    setUser(local);

    fetch(`/api/users?gmail=${encodeURIComponent(local.gmail)}`)
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          const updated = { ...local, types: data.user.types };
          setUser(updated);
          localStorage.setItem('currentUser', JSON.stringify(updated));
        }
      })
      .catch(() => {});
  }, []);

  const types = user?.types as Record<string, { code?: string } | undefined> | undefined;
  const autoCode = types?.[activeTab]?.code ?? null;
  const hasQuizForTab = autoCode !== null;

  const modalGroup = modalCode ? GROUPS.find(g => g.codes.includes(modalCode)) : null;
  const modalInfo = modalCode ? TYPE_TABLES[activeTab][modalCode] : null;

  return (
    <div className="min-h-screen bg-[#E5E7EB] font-sans flex flex-col">
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-up-1 { animation: slideUpFade 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .slide-up-2 { animation: slideUpFade 0.45s cubic-bezier(0.22,1,0.36,1) 0.18s both; }
      `}</style>
      <Navbar />

      {/* Top bar: back button + template tabs */}
      <div className="slide-up-1 w-full px-3 py-4 flex items-center gap-3 max-w-7xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-700 transition-all active:scale-95"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <div className="flex flex-1 gap-1 p-1 bg-white rounded-2xl shadow-sm">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#4B3E7A] text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* No-quiz CTA */}
      {!hasQuizForTab && (
        <p className="text-center text-sm text-gray-400 mb-2">
          ยังไม่ได้ทำแบบทดสอบ {TABS.find(t => t.id === activeTab)?.label} —{' '}
          <button
            onClick={() => router.push(`/question/${activeTab}`)}
            className="text-[#4B3E7A] font-bold underline"
          >
            ไปทำเลย
          </button>
        </p>
      )}

      {/* Group Sections */}
      <div className="slide-up-2 flex flex-col gap-3 px-3 pb-6 max-w-7xl mx-auto w-full">
        {GROUPS.map(group => (
              <section
                key={group.label}
                className="relative overflow-hidden rounded-3xl mb-4"
                style={{ backgroundColor: group.color + '1A' }}
              >
                {/* Watermark */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                  aria-hidden="true"
                >
                  <span
                    className="font-black leading-none tracking-tight"
                    style={{ fontSize: '14rem', color: '#ffffff', opacity: 0.25 }}
                  >
                    {group.watermark}
                  </span>
                </div>

                {/* Section Header */}
                <div className="relative z-10 px-12 pt-12 pb-3 flex items-baseline gap-2">
                  <h2 className="text-2xl font-black" style={{ color: group.color }}>
                    {group.label}
                  </h2>
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: group.color + '25', color: group.color }}
                  >
                    {group.suffix}
                  </span>
                </div>

                {/* Cards Grid */}
                <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 px-10 pb-12">
                  {group.codes.map(code => {
                    const isAutoHighlight = hasQuizForTab && code === autoCode;
                    const avatarSrc = `/img/p${MBTI_CODES.indexOf(code) + 1}.PNG`;
                    const info = TYPE_TABLES[activeTab][code];

                    return (
                      <div
                        key={code}
                        onClick={() => setModalCode(code)}
                        className="group relative cursor-pointer flex flex-col items-center gap-1 pb-5 pt-2 transition-all rounded-2xl"
                        style={isAutoHighlight ? {
                          backgroundColor: '#ffffff',
                          border: '3px solid #ffffff',
                        } : {
                          border: '3px solid transparent',
                        }}
                      >
                        {/* Avatar */}
                        <img
                          src={avatarSrc}
                          alt={code}
                          className="w-28 h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 object-contain mb-3 transition-transform duration-300 group-hover:scale-110"
                        />

                        {/* English name */}
                        <span className="text-2xl md:text-3xl font-black text-center leading-tight" style={{ color: group.color }}>
                          {ENGLISH_NAMES[code]}
                        </span>

                        {/* Code */}
                        <span className="text-base md:text-lg font-bold text-gray-500 tracking-widest">
                          {code}
                        </span>

                        {/* Thai title */}
                        <span className="text-base md:text-lg font-semibold text-[#4B3E7A] text-center leading-tight">
                          {info?.title ?? ''}
                        </span>

                        {/* Badge */}
                        {isAutoHighlight && (
                          <span
                            className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: group.color }}
                          >
                            ผลของฉัน
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
      </div>

      {/* Detail Modal */}
      {modalCode && modalGroup && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setModalCode(null)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Colored header */}
            <div
              className="rounded-t-[32px] p-10 flex flex-col items-center gap-3"
              style={{ backgroundColor: modalGroup.color + '18' }}
            >
              <img
                src={`/img/p${MBTI_CODES.indexOf(modalCode) + 1}.PNG`}
                alt={modalCode}
                className="w-48 h-48 object-contain"
              />
              <span className="text-4xl font-black" style={{ color: modalGroup.color }}>
                {modalCode}
              </span>
              <span className="text-base font-bold text-gray-400">
                {ENGLISH_NAMES[modalCode]}
              </span>
              <span className="text-2xl font-black text-[#4B3E7A] text-center">
                {modalInfo?.title ?? ''}
              </span>
            </div>

            {/* Body */}
            <div className="p-10 flex flex-col gap-5">
              <p className="text-gray-500 text-base leading-relaxed">
                {modalInfo?.description ?? ''}
              </p>

              {modalInfo?.jobs && modalInfo.jobs.length > 0 && (
                <div>
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">
                    ตำแหน่งงานที่เหมาะสม
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {modalInfo.jobs.map(job => (
                      <span
                        key={job}
                        className="text-sm font-bold px-4 py-2 rounded-full"
                        style={{ backgroundColor: modalGroup.color + '18', color: modalGroup.color }}
                      >
                        {job}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setModalCode(null)}
                className="mt-2 w-full py-4 rounded-2xl font-black text-white text-base"
                style={{ backgroundColor: modalGroup.color }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTypePage;
