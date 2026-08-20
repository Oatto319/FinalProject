'use client';

import { useState } from 'react';
import { Sparkles, ShieldAlert, Users2, ChevronRight, X } from 'lucide-react';
import { typeColor } from '@/lib/mbti';
import { TYPE_IMAGES } from '@/lib/type-images';
import { programmingTypeTable } from '@/lib/mbti-programming';
import { serviceTypeTable } from '@/lib/mbti-service';
import { presentationTypeTable } from '@/lib/mbti-presentation';
import { designTypeTable } from '@/lib/mbti-design';
import type { MbtiTypeInfo } from '@/lib/mbti';

const TYPE_TABLES: Record<string, Record<string, MbtiTypeInfo>> = {
  programming: programmingTypeTable,
  service: serviceTypeTable,
  presentation: presentationTypeTable,
  design: designTypeTable,
};

const TEMPLATE_LABELS: Record<string, string> = {
  programming: 'Programming',
  service: 'Customer / Service',
  presentation: 'Presentation',
  design: 'Design / Creative',
};

function resolveTableKey(template: string): keyof typeof TYPE_TABLES {
  const t = template.toLowerCase();
  if (t.includes('service')) return 'service';
  if (t.includes('presentation')) return 'presentation';
  if (t.includes('design')) return 'design';
  return 'programming';
}

interface SynergyNote { gmailA: string; gmailB: string; reasons: string[]; avoid: boolean; }
interface RoomTypeRecommendation { code: string; avgScore: number; presentCount: number; }
export interface RoomInsights {
  bestPairs: SynergyNote[];
  cautionPairs: SynergyNote[];
  recommendedTypes: RoomTypeRecommendation[];
}
interface MemberLite { gmail: string; name: string; }

export default function RoomCompatibilityInsights({
  roomInsights,
  template,
  members,
}: {
  roomInsights: RoomInsights;
  template: string;
  members: MemberLite[];
}) {
  const [open, setOpen] = useState(false);
  const tableKey = resolveTableKey(template);
  const table = TYPE_TABLES[tableKey];
  const templateLabel = TEMPLATE_LABELS[tableKey];

  const nameOf = (gmail: string) => members.find((m) => m.gmail === gmail)?.name ?? gmail;

  const hasAnyData =
    roomInsights.bestPairs.length > 0 || roomInsights.cautionPairs.length > 0 || roomInsights.recommendedTypes.length > 0;
  if (!hasAnyData) return null;

  return (
    <>
      {/* การ์ดสรุป — กดเพื่อดูรายละเอียดทั้งหมดแบบเต็มจอ */}
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-white rounded-[20px] shadow-sm p-4 sm:p-5 flex items-center gap-4 text-left hover:shadow-md transition-all active:scale-[0.99] mb-2"
      >
        <div className="w-11 h-11 rounded-2xl bg-[#EDE9FF] flex items-center justify-center text-[#4B3E7A] flex-shrink-0">
          <Users2 size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-[#4B3E7A] text-sm sm:text-base">วิเคราะห์ความเข้ากันของห้องนี้</p>
          <p className="text-xs text-gray-400 mt-0.5">
            เข้ากันดี {roomInsights.bestPairs.length} คู่
            {roomInsights.cautionPairs.length > 0 && ` · ควรระวัง ${roomInsights.cautionPairs.length} คู่`}
            {roomInsights.recommendedTypes.length > 0 && ` · แนะนำ ${roomInsights.recommendedTypes.length} type สำหรับ ${templateLabel}`}
          </p>
        </div>
        <ChevronRight size={20} className="text-gray-300 flex-shrink-0" />
      </button>

      {/* Modal เต็มข้อมูล */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-[20px] w-full max-w-lg max-h-[85vh] shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#4B3E7A] px-6 py-4 flex items-center justify-between flex-shrink-0">
              <p className="flex items-center gap-2 font-black text-white text-base sm:text-lg">
                <Users2 size={18} /> วิเคราะห์ความเข้ากันของห้องนี้
              </p>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 sm:p-6 flex flex-col gap-5 overflow-y-auto">
              {roomInsights.bestPairs.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-2">
                    <Sparkles size={13} /> จับกลุ่มกับใครแล้วลงตัวที่สุดในห้องนี้
                  </p>
                  <div className="flex flex-col gap-2">
                    {roomInsights.bestPairs.map((p, i) => (
                      <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <p className="text-sm font-bold text-emerald-700">{nameOf(p.gmailA)} + {nameOf(p.gmailB)}</p>
                        {p.reasons.map((r, ri) => (
                          <p key={ri} className="text-xs text-gray-500 leading-relaxed">{r}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-amber-600 mb-2">
                  <ShieldAlert size={13} /> คู่ที่ควรระวัง
                </p>
                {roomInsights.cautionPairs.length === 0 ? (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">ไม่มีคู่ที่ต้องระวังเป็นพิเศษในห้องนี้</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {roomInsights.cautionPairs.map((p, i) => (
                      <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-sm font-bold text-amber-700">{nameOf(p.gmailA)} + {nameOf(p.gmailB)}</p>
                        {p.reasons.map((r, ri) => (
                          <p key={ri} className="text-xs text-gray-500 leading-relaxed">{r}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {roomInsights.recommendedTypes.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#4B3E7A] mb-2">
                    MBTI ที่เข้ากับเพื่อนร่วมห้องนี้ได้ดีในบริบท {templateLabel}
                  </p>
                  <div className="flex flex-col gap-2">
                    {roomInsights.recommendedTypes.map((r) => (
                      <div key={r.code} className="flex items-center gap-3 bg-[#F5F3FF] rounded-xl p-2.5">
                        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: `${typeColor(r.code)}1A` }}>
                          <img src={TYPE_IMAGES[r.code]} alt={r.code} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black" style={{ color: typeColor(r.code) }}>
                            {r.code} · {table[r.code]?.title ?? r.code}
                          </p>
                          <p className="text-[11px] text-gray-400">มีในห้องนี้ {r.presentCount} คน</p>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#4B3E7A]/10 text-[#4B3E7A] flex-shrink-0">
                          {r.avgScore}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                    จัดอันดับจากคะแนนความเข้ากันเฉลี่ยกับเพื่อนร่วมห้องคนอื่นๆ ที่ join ห้องนี้จริง ไม่ใช่ข้อสรุปตายตัวว่า type อื่นทำงานสาย {templateLabel} ไม่ได้
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
