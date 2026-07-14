'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, ChevronLeft } from 'lucide-react';
import Navbar from '../../navbar/page';
import { scoreMbti, buildAxisBars, typeIcon, typeColor } from '@/lib/mbti';
import { serviceQuestions, serviceTypeTable } from '@/lib/mbti-service';
import { TYPE_IMAGES } from '@/lib/type-images';

const QUESTIONS_PER_PAGE = 30;
const totalPages = Math.ceil(serviceQuestions.length / QUESTIONS_PER_PAGE);

const ServiceQuestionnaire = () => {
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  const [jobResult, setJobResult] = useState<{
    code: string;
    title: string;
    description: string;
    jobs: string[];
    icon: string;
    typeScores: { title: string; icon: string; score: number }[];
  } | null>(null);

  const currentQuestions = serviceQuestions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE,
  );
  const isPageComplete = currentQuestions.every((q) => answers[q.id] !== undefined);

  const handleSelect = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const allAnswered = serviceQuestions.every((q) => answers[q.id] !== undefined);
    if (!allAnswered) { alert('กรุณาตอบให้ครบทุกข้อก่อนนะครับ'); return; }

    const { code, axisScore } = scoreMbti(serviceQuestions, answers);
    const info = serviceTypeTable[code];
    const typeScores = buildAxisBars(axisScore);

    setJobResult({ code, title: info.title, description: info.description, jobs: info.jobs, icon: typeIcon(code), typeScores });
    setShowPopup(true);
  };

  const handlePageNext = () => {
    if (!isPageComplete) {
      const firstUnanswered = currentQuestions.find((q) => answers[q.id] === undefined);
      if (firstUnanswered) {
        document.getElementById(`question-${firstUnanswered.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedId(firstUnanswered.id);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setHighlightedId(null), 2000);
      }
      alert('กรุณาตอบให้ครบทุกข้อในหน้านี้ก่อนนะครับ');
      return;
    }
    if (currentPage < totalPages - 1) {
      setCurrentPage(p => p + 1);
      setHighlightedId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handlePopupClose = async () => {
    if (jobResult) {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const currentUser = JSON.parse(raw);
        const newTypes = {
          ...currentUser.types,
          service: {
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

      {/* Top bar: back + template badge */}
      <div className="w-full max-w-5xl flex items-center justify-between px-4 md:px-8 mt-6 mb-4">
        <button
          onClick={() => {
            if (currentPage > 0) {
              setCurrentPage(p => p - 1);
              setHighlightedId(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              router.back();
            }
          }}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <div className="bg-[#A7F3D0] px-8 py-3 rounded-2xl shadow-sm">
          <h2 className="text-[#FF4D8D] font-black italic tracking-tight uppercase">CUSTOMER / SERVICE</h2>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-5xl bg-white rounded-[24px] shadow-xl p-4 sm:p-8 md:p-16 flex flex-col gap-8 sm:gap-12 border-b-8 border-gray-300 mb-8">
        {/* Progress indicator */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentPage ? 'w-10 bg-[#4B3E7A]' :
                  i < currentPage ? 'w-6 bg-[#4B3E7A] opacity-40' :
                  'w-6 bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-400">
            ข้อ {currentPage * QUESTIONS_PER_PAGE + 1}–{Math.min((currentPage + 1) * QUESTIONS_PER_PAGE, serviceQuestions.length)} จาก {serviceQuestions.length}
          </p>
        </div>

        {/* Questions for this page */}
        {currentQuestions.map((q, idx) => (
          <div key={q.id} id={`question-${q.id}`} className={`flex flex-col items-center gap-5 sm:gap-8 rounded-2xl px-2 sm:px-4 pt-4 transition-all duration-300 ${highlightedId === q.id ? 'ring-2 ring-red-400 bg-red-50' : ''}`}>
            <h3 className="text-[#1A2E44] text-lg sm:text-xl md:text-2xl font-black text-center leading-relaxed">&ldquo;{q.text}&rdquo;</h3>
            <div className="w-full flex items-center justify-between max-w-3xl gap-1 sm:gap-3">
              <div className="flex flex-col items-center gap-0.5 sm:flex-row sm:gap-3 flex-shrink-0">
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-[#22C55E] flex items-center justify-center text-[#22C55E] bg-white flex-shrink-0">
                  <Plus size={16} strokeWidth={4} className="sm:hidden" />
                  <Plus size={24} strokeWidth={4} className="hidden sm:block" />
                </div>
                <span className="text-[#22C55E] font-black text-[9px] sm:text-lg md:text-xl text-center leading-none">เห็นด้วย</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-1 justify-center px-1 sm:px-4">
                {[1, 2, 3, 4, 5, 6, 7].map((val) => {
                  const isSelected = answers[q.id] === val;
                  const sizeClass = val === 4 ? 'w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6' : (val === 3 || val === 5) ? 'w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8' : (val === 2 || val === 6) ? 'w-5 h-5 sm:w-7 sm:h-7 md:w-10 md:h-10' : 'w-6 h-6 sm:w-9 sm:h-9 md:w-12 md:h-12';
                  const borderColor = val < 4 ? 'border-[#22C55E]' : val > 4 ? 'border-[#A7F3D0]' : 'border-gray-400';
                  return (
                    <button key={val} onClick={() => handleSelect(q.id, val)}
                      className={`${sizeClass} rounded-full border-2 transition-all duration-200 flex-shrink-0 ${borderColor} ${isSelected ? (val < 4 ? 'bg-[#22C55E]' : val > 4 ? 'bg-[#A7F3D0]' : 'bg-gray-400') : 'bg-transparent'} hover:scale-110`} />
                  );
                })}
              </div>
              <div className="flex flex-col items-center gap-0.5 sm:flex-row sm:gap-3 flex-shrink-0">
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-[#A7F3D0] flex items-center justify-center text-[#A7F3D0] bg-white flex-shrink-0">
                  <Minus size={16} strokeWidth={4} className="sm:hidden" />
                  <Minus size={24} strokeWidth={4} className="hidden sm:block" />
                </div>
                <span className="text-[#A7F3D0] font-black text-[9px] sm:text-lg md:text-xl text-center leading-none sm:whitespace-nowrap">ไม่เห็นด้วย</span>
              </div>
            </div>
            {idx !== currentQuestions.length - 1 && <div className="w-full h-[2px] bg-gray-100 mt-4" />}
          </div>
        ))}

        <div className="flex justify-center mt-8">
          <button onClick={handlePageNext} className="bg-[#4B3E7A] text-white px-12 py-4 rounded-2xl font-black text-xl hover:bg-[#3b3161] transition-colors shadow-lg">
            {currentPage < totalPages - 1 ? 'ถัดไป' : 'ส่งคำตอบ'}
          </button>
        </div>
      </div>

      {showPopup && jobResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] p-5 sm:p-8 flex flex-col items-center gap-5 shadow-2xl w-full max-w-md">
            <img src={TYPE_IMAGES[jobResult.code]} alt={jobResult.code} className="w-32 h-32 sm:w-40 sm:h-40 object-contain flex-shrink-0" />
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
                    <div key={t.title} className="flex items-center gap-2 sm:gap-3">
                      <img src={t.icon} alt={t.title} className="w-6 h-6 sm:w-8 sm:h-8 object-contain flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-[#1A2E44] w-20 sm:w-32 md:w-40 flex-shrink-0 truncate">{t.title}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div className="bg-[#4B3E7A] h-2.5 rounded-full transition-all duration-500" style={{ width: `${t.score}%` }} />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-[#4B3E7A] w-8 sm:w-10 text-right flex-shrink-0">{t.score}%</span>
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

export default ServiceQuestionnaire;
