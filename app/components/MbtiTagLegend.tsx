'use client';

import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { typeColor } from '@/lib/mbti';
import { TYPE_IMAGES } from '@/lib/type-images';
import { programmingTypeTable } from '@/lib/mbti-programming';
import { serviceTypeTable } from '@/lib/mbti-service';
import { presentationTypeTable } from '@/lib/mbti-presentation';
import { designTypeTable } from '@/lib/mbti-design';

const TABLES: Record<string, Record<string, { title: string; description: string }>> = {
  programming: programmingTypeTable,
  service: serviceTypeTable,
  presentation: presentationTypeTable,
  design: designTypeTable,
};

const MBTI_GROUPS = [
  { label: 'Analysts',  subtitle: 'NT', codes: ['INTJ', 'INTP', 'ENTJ', 'ENTP'] },
  { label: 'Diplomats', subtitle: 'NF', codes: ['INFJ', 'INFP', 'ENFJ', 'ENFP'] },
  { label: 'Sentinels', subtitle: 'SJ', codes: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'] },
  { label: 'Explorers', subtitle: 'SP', codes: ['ISTP', 'ISFP', 'ESTP', 'ESFP'] },
];

function resolveTableKey(template: string): keyof typeof TABLES {
  const t = template.toLowerCase();
  if (t.includes('service')) return 'service';
  if (t.includes('presentation')) return 'presentation';
  if (t.includes('design')) return 'design';
  return 'programming';
}

export default function MbtiTagLegend({ template, className }: { template: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const table = TABLES[resolveTableKey(template)];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="ความหมายของแท็กบุคลิกภาพ"
        className={className ?? 'w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all'}
      >
        <Info size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-[20px] w-full max-w-lg max-h-[80vh] shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-[#4B3E7A] px-6 py-4 flex items-center justify-between flex-shrink-0">
              <p className="font-black text-white text-lg">ความหมายของแท็กบุคลิกภาพ</p>
              <button onClick={() => setOpen(false)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Body — grouped by 4 main categories */}
            <div className="p-6 flex flex-col gap-6 overflow-y-auto">
              {MBTI_GROUPS.map((group, gi) => {
                const groupColor = typeColor(group.codes[0]);
                return (
                  <div key={group.label}>
                    {/* Group divider (not on first group) */}
                    {gi > 0 && <div className="w-full h-px bg-gray-100 mb-5" />}

                    {/* Group header */}
                    <div className="flex items-center gap-2 mb-4">
                      <p className="font-black text-base" style={{ color: groupColor }}>{group.label}</p>
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${groupColor}18`, color: groupColor }}
                      >
                        {group.subtitle}
                      </span>
                    </div>

                    {/* Types in this group */}
                    <div className="flex flex-col gap-4">
                      {group.codes.map((code) => {
                        const info = table[code];
                        if (!info) return null;
                        return (
                          <div key={code} className="flex items-start gap-3">
                            <div
                              className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0"
                              style={{ backgroundColor: `${typeColor(code)}1A` }}
                            >
                              <img src={TYPE_IMAGES[code]} alt={code} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <p className="font-bold text-[#4B3E7A] text-sm">{info.title}</p>
                              <p className="text-xs text-gray-500 leading-relaxed">{info.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
