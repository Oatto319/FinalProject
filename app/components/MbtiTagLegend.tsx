'use client';

import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { typeColor } from '@/lib/mbti';
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

function resolveTableKey(template: string): keyof typeof TABLES {
  const t = template.toLowerCase();
  if (t.includes('service')) return 'service';
  if (t.includes('presentation')) return 'presentation';
  if (t.includes('design')) return 'design';
  return 'programming';
}

/** "ⓘ" button that opens a legend explaining what every MBTI tag for the room's template means. */
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
            <div className="bg-[#4B3E7A] px-6 py-4 flex items-center justify-between flex-shrink-0">
              <p className="font-black text-white text-lg">ความหมายของแท็กบุคลิกภาพ</p>
              <button onClick={() => setOpen(false)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              {Object.entries(table).map(([code, info]) => (
                <div key={code} className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${typeColor(code)}1A` }}
                  >
                    <span className="text-[11px] font-black" style={{ color: typeColor(code) }}>{code}</span>
                  </div>
                  <div>
                    <p className="font-bold text-[#4B3E7A] text-sm">{info.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{info.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
