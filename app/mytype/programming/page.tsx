'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Navbar from '../../navbar/page';
import { typeColor } from '@/lib/mbti';

type MBTIResult = {
  code?: string;
  title: string;
  description: string;
  jobs: string[];
  icon: string;
  typeScores: { title: string; icon: string; score: number }[];
  completedAt: string;
};

const TEMPLATE = {
  id: 'programming',
  label: 'PROGRAMMING',
  color: 'bg-[#F8A4A4]',
  textColor: 'text-[#4B3E7A]',
  route: '/question/programming',
};

const ProgrammingTypePage = () => {
  const router = useRouter();
  const [result, setResult] = useState<MBTIResult | null | undefined>(undefined);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return;
    const local = JSON.parse(raw);

    fetch(`/api/users?gmail=${encodeURIComponent(local.gmail)}`)
      .then((r) => r.json())
      .then((data) => {
        const typeResult = data.user?.types?.[TEMPLATE.id];
        setResult(typeResult ?? null);
        if (data.user) {
          const updated = { ...local, types: data.user.types };
          localStorage.setItem('currentUser', JSON.stringify(updated));
        }
      })
      .catch(() => setResult(null));
  }, []);

  return (
    <div className="min-h-screen bg-[#E5E7EB] font-sans flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-3xl p-4 md:p-8 flex flex-col items-center">
        <div className="w-full bg-white rounded-[24px] shadow-xl overflow-hidden border-b-8 border-gray-300">

          <div className="flex justify-between items-center p-6 pb-0">
            <button
              onClick={() => router.back()}
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <div className={`${TEMPLATE.color} px-10 py-3 rounded-tl-3xl rounded-br-3xl shadow-sm`}>
              <h1 className={`${TEMPLATE.textColor} text-2xl font-black italic tracking-tighter uppercase`}>{TEMPLATE.label}</h1>
            </div>
          </div>

          <div className="p-6 md:p-10">
            {result === undefined ? (
              <div className="flex items-center justify-center min-h-[200px] text-gray-400">กำลังโหลด...</div>
            ) : result ? (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${result.code ? typeColor(result.code) : '#6D58B9'}1A` }}
                  >
                    <span className="text-lg font-black tracking-wide" style={{ color: result.code ? typeColor(result.code) : '#6D58B9' }}>{result.code}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">ประเภทบุคลิกภาพการทำงาน{result.code ? ` · ${result.code}` : ''}</p>
                    <p className="text-2xl font-black text-[#4B3E7A]">{result.title}</p>
                    {result.completedAt && (
                      <p className="text-xs text-gray-300 mt-1">ทำเมื่อ {new Date(result.completedAt).toLocaleDateString('th-TH')}</p>
                    )}
                  </div>
                </div>

                <p className="text-gray-500 text-sm leading-relaxed">{result.description}</p>

                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">ตำแหน่งงานที่เหมาะสม</p>
                  <div className="flex flex-wrap gap-2">
                    {result.jobs.map((job) => (
                      <span key={job} className="bg-[#EDE9FF] text-[#4B3E7A] text-xs font-bold px-3 py-1.5 rounded-full">{job}</span>
                    ))}
                  </div>
                </div>


                <button
                  onClick={() => router.push(TEMPLATE.route)}
                  className="w-full border-2 border-[#4B3E7A] text-[#4B3E7A] py-3 rounded-2xl font-bold text-sm hover:bg-[#EDE9FF] transition-colors"
                >
                  ทำแบบสอบถามใหม่
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 min-h-[200px]">
                <p className="text-gray-400 font-medium">ยังไม่ได้ทำ template นี้</p>
                <button
                  onClick={() => router.push(TEMPLATE.route)}
                  className="bg-[#4B3E7A] text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-[#3b3161] transition-colors"
                >
                  ไปทำเลย
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgrammingTypePage;
