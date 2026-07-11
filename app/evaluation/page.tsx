'use client';

import { useState } from 'react';
import Navbar from '../navbar/page';
import { resolveAvatar } from '@/lib/avatar';

const CRITERIA = [
  { id: 'decision',       label: 'ความรวดเร็วในการตัดสินใจ' },
  { id: 'creative',       label: 'ความคิดสร้างสรรค์' },
  { id: 'emotion',        label: 'การควบคุมอารมณ์' },
  { id: 'teamwork',       label: 'การทำงานเป็นทีม' },
  { id: 'responsibility', label: 'ความรับผิดชอบ' },
];

const RATING_LABELS = ['ปรับปรุง', 'พอใช้', 'ปานกลาง', 'ดี', 'ดีมาก'];

const person = { name: 'อ้วาน นาวารัน', role: 'นักเรียน', avatarSeed: 1, mbtiType: 'INTJ', isLeader: true };

export default function EvaluationPage() {
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const allAnswered = CRITERIA.every(c => ratings[c.id] !== undefined);

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#1D324B' }}>
      <Navbar bgColor="#122031" nameColor="white" />

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-6">
        <div className="w-full max-w-2xl rounded-3xl overflow-hidden">
          {/* Profile header */}
          <div className="flex items-center gap-3 px-5 py-6" style={{ backgroundColor: '#CBD6E3' }}>
            <img
              src={resolveAvatar({ avatarSeed: person.avatarSeed })}
              alt={person.name}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base text-gray-800 truncate">{person.name}</p>
              <p className="text-sm text-gray-500">{person.role}</p>
            </div>
            {person.isLeader && (
              <img src="/img/crown.PNG" alt="หัวหน้ากลุ่ม" className="w-14 h-14 object-contain flex-shrink-0" />
            )}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
              style={{ backgroundColor: '#6B63B5' }}
            >
              {person.mbtiType}
            </div>
          </div>

          {/* Body */}
          <div className="bg-white">
          {/* Criteria */}
          {CRITERIA.map((criterion, idx) => (
            <div key={criterion.id}>
              {idx > 0 && <div className="h-px mx-5" style={{ backgroundColor: '#B0B5C8' }} />}
              <div className="px-5 py-5">
                <p className="font-semibold text-sm mb-4" style={{ color: '#2D3748' }}>
                  {criterion.label}
                </p>
                <div className="flex justify-between">
                  {[1, 2, 3, 4, 5].map(n => {
                    const selected = ratings[criterion.id] === n;
                    return (
                      <button
                        key={n}
                        onClick={() => setRatings(prev => ({ ...prev, [criterion.id]: n }))}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all active:scale-95"
                          style={selected
                            ? { backgroundColor: '#2D3E50', color: '#ffffff' }
                            : { backgroundColor: '#ffffff', color: '#9CA3AF', border: '2px solid #CBD5E0' }
                          }
                        >
                          {n}
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 text-center leading-tight">
                          {RATING_LABELS[n - 1]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Submit */}
          <div className="px-5 pb-6 pt-2">
            <button
              disabled={!allAnswered}
              className="w-full py-3.5 rounded-2xl font-black text-white text-base transition-all active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: '#2D3E50' }}
            >
              ส่งการประเมิน
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
