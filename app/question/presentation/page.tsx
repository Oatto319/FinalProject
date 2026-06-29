'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, ChevronLeft } from 'lucide-react';
import Navbar from '../../navbar/page';
import { scoreMbti, buildAxisBars, typeIcon, typeColor } from '@/lib/mbti';
import { presentationQuestions, presentationTypeTable } from '@/lib/mbti-presentation';

const PresentationQuestionnaire = () => {
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showPopup, setShowPopup] = useState(false);
  const [jobResult, setJobResult] = useState<{
    code: string;
    title: string;
    description: string;
    jobs: string[];
    icon: string;
    typeScores: { title: string; icon: string; score: number }[];
  } | null>(null);

  const handleSelect = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const allAnswered = presentationQuestions.every((q) => answers[q.id] !== undefined);
    if (!allAnswered) { alert('กรุณาตอบให้ครบทุกข้อก่อนนะครับ'); return; }

    const { code, axisScore } = scoreMbti(presentationQuestions, answers);
    const info = presentationTypeTable[code];
    const typeScores = buildAxisBars(axisScore);

    setJobResult({ code, title: info.title, description: info.description, jobs: info.jobs, icon: typeIcon(code), typeScores });
    setShowPopup(true);
  };

  const handlePopupClose = async () => {
    if (jobResult) {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const currentUser = JSON.parse(raw);
        const newTypes = {
          ...currentUser.types,
          presentation: {
            code: jobResult.code,
            title: jobResult.title,
            description: jobResult.description,
            jobs: jobResult.jobs,
            icon: jobResult.icon,
            typeScores: jobResult.typeScores,
            completedAt: new Date().toISOString(),
          }
        };
        const updatedUser = { ...currentUser, types: newTypes };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        try {
          await fetch('/api/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gmail: currentUser.gmail, types: newTypes }),
          });
        } catch (e) {
          console.error('Failed to save MBTI result to DB:', e);
        }
      }
    }
    setShowPopup(false);
    router.push('/templates');
  };

  return (
    <div className="min-h-screen bg-[#E5E7EB] font-sans flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-5xl flex items-center justify-between px-4 md:px-8 mt-6 mb-6">
        <button onClick={() => router.back()} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all">
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <div className="bg-[#E2F37C] px-8 py-3 rounded-2xl shadow-sm">
          <h2 className="text-[#22C55E] font-black italic tracking-tight uppercase">PRESENTATION</h2>
        </div>
      </div>

      <div className="w-full max-w-5xl bg-white rounded-[24px] shadow-xl p-8 md:p-16 flex flex-col gap-12 border-b-8 border-gray-300">
        {presentationQuestions.map((q, idx) => (
          <div key={q.id} className="flex flex-col items-center gap-8">
            <h3 className="text-[#1A2E44] text-xl md:text-2xl font-black text-center leading-relaxed">&ldquo;{q.text}&rdquo;</h3>
            <div className="w-full flex items-center justify-between max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="text-[#22C55E] font-black text-lg md:text-xl">เห็นด้วย</span>
                <div className="w-10 h-10 rounded-full border-2 border-[#22C55E] flex items-center justify-center text-[#22C55E] bg-white"><Plus size={24} strokeWidth={4} /></div>
              </div>
              <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center px-4">
                {[1, 2, 3, 4, 5, 6, 7].map((val) => {
                  const isSelected = answers[q.id] === val;
                  const sizeClass = val === 4 ? 'w-6 h-6' : (val === 3 || val === 5) ? 'w-8 h-8' : (val === 2 || val === 6) ? 'w-10 h-10' : 'w-12 h-12';
                  const borderColor = val < 4 ? 'border-[#22C55E]' : val > 4 ? 'border-[#E2F37C]' : 'border-gray-400';
                  return (
                    <button key={val} onClick={() => handleSelect(q.id, val)}
                      className={`${sizeClass} rounded-full border-2 transition-all duration-200 ${borderColor} ${isSelected ? (val < 4 ? 'bg-[#22C55E]' : val > 4 ? 'bg-[#E2F37C]' : 'bg-gray-400') : 'bg-transparent'} hover:scale-110`} />
                  );
                })}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#E2F37C] flex items-center justify-center text-[#22C55E] bg-white"><Minus size={24} strokeWidth={4} /></div>
                <span className="text-[#22C55E] font-black text-lg md:text-xl whitespace-nowrap">ไม่เห็นด้วย</span>
              </div>
            </div>
            {idx !== presentationQuestions.length - 1 && <div className="w-full h-[2px] bg-gray-100 mt-4" />}
          </div>
        ))}
        <div className="flex justify-center mt-8">
          <button onClick={handleSubmit} className="bg-[#4B3E7A] text-white px-12 py-4 rounded-2xl font-black text-xl hover:bg-[#3b3161] transition-colors shadow-lg">ถัดไป</button>
        </div>
      </div>

      {showPopup && jobResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] p-8 flex flex-col items-center gap-5 shadow-2xl w-full max-w-md">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${typeColor(jobResult.code)}1A` }}
            >
              <span className="text-xl font-black tracking-wide" style={{ color: typeColor(jobResult.code) }}>{jobResult.code}</span>
            </div>
            <div className="text-center w-full">
              <h2 className="text-2xl font-black text-[#1A2E44] mb-1">เสร็จแล้ว!</h2>
              <p className="text-xs text-gray-400 font-medium mb-3">ประเภทบุคลิกภาพการทำงานของคุณ · {jobResult.code}</p>
              <p className="text-2xl font-black text-[#4B3E7A] mb-3">{jobResult.title}</p>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{jobResult.description}</p>
              <div className="text-left">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">ตำแหน่งงานที่เหมาะสม</p>
                <div className="flex flex-wrap gap-2">
                  {jobResult.jobs.map((job) => (
                    <span key={job} className="bg-[#EDE9FF] text-[#4B3E7A] text-xs font-bold px-3 py-1.5 rounded-full">{job}</span>
                  ))}
                </div>
              </div>
              <div className="text-left w-full mt-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">สัดส่วนแต่ละมิติบุคลิกภาพ</p>
                <div className="flex flex-col gap-3">
                  {jobResult.typeScores.map((t) => (
                    <div key={t.title} className="flex items-center gap-3">
                      <img src={t.icon} alt={t.title} className="w-8 h-8 object-contain flex-shrink-0" />
                      <span className="text-sm font-bold text-[#1A2E44] w-40 flex-shrink-0">{t.title}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div className="bg-[#4B3E7A] h-2.5 rounded-full transition-all duration-500" style={{ width: `${t.score}%` }} />
                      </div>
                      <span className="text-sm font-black text-[#4B3E7A] w-10 text-right flex-shrink-0">{t.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handlePopupClose} className="w-full bg-[#4B3E7A] text-white py-4 rounded-2xl font-black text-lg hover:bg-[#3b3161] transition-colors shadow-lg">Finished</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationQuestionnaire;
