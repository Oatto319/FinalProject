'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Sparkles, ShieldAlert, Users } from 'lucide-react';
import Navbar from '../../navbar/page';
import { MBTI_CODES, typeColor, typeIcon, roleColor } from '@/lib/mbti';
import { TYPE_IMAGES } from '@/lib/type-images';
import { typeCompatibilitySummary, pairCompatibility, type TypePartner } from '@/lib/mbti-compatibility';
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

const TEMPLATE_TABS = [
  { id: 'programming', label: 'Programming' },
  { id: 'service', label: 'Customer / Service' },
  { id: 'presentation', label: 'Presentation' },
  { id: 'design', label: 'Design / Creative' },
];

interface RoomMemberLite { name: string; gmail: string; avatarSeed: number; avatarImage?: string | null; }
interface MemberTypeLite { code: string; }

function MbtiGuideContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');

  const [template, setTemplate] = useState(() => {
    const t = (searchParams.get('template') ?? 'programming').toLowerCase();
    return TYPE_TABLES[t] ? t : 'programming';
  });
  const [selectedCode, setSelectedCode] = useState('INTJ');
  const [roomMembers, setRoomMembers] = useState<RoomMemberLite[]>([]);
  const [memberTypes, setMemberTypes] = useState<Record<string, MemberTypeLite>>({});
  const [roomTitle, setRoomTitle] = useState('');

  useEffect(() => {
    if (!roomId) return;
    (async () => {
      const roomRes = await fetch(`/api/rooms/${roomId}`);
      if (!roomRes.ok) return;
      const roomData = await roomRes.json();
      if (!roomData.room) return;
      setRoomMembers(roomData.room.members ?? []);
      setRoomTitle(roomData.room.title ?? '');
      if (!searchParams.get('template') && roomData.room.template) {
        const t = String(roomData.room.template).toLowerCase();
        if (TYPE_TABLES[t]) setTemplate(t);
      }

      const typesRes = await fetch(`/api/rooms/${roomId}/member-types?source=members`);
      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setMemberTypes(typesData.types ?? {});
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const table = TYPE_TABLES[template];
  const info = table[selectedCode];
  const summary = typeCompatibilitySummary(selectedCode, template);

  // สมาชิกในห้องนี้ที่ตรงกับ type ที่เลือกอยู่ (จับคู่ member.gmail/name กับ key ที่ fetchMemberTypes ใช้ — gmail ก่อน ไม่มีค่อย fallback name)
  const membersOfSelectedType = roomMembers.filter((m) => memberTypes[m.gmail || m.name]?.code === selectedCode);

  // type ที่มีจริงในห้องนี้ (distinct) พร้อมรายชื่อสมาชิก — ใช้สร้างคำแนะนำที่อิงข้อมูลจริงของห้อง ไม่ใช่แค่ทฤษฎีลอยๆ
  const roomTypeGroups = new Map<string, RoomMemberLite[]>();
  for (const m of roomMembers) {
    const code = memberTypes[m.gmail || m.name]?.code;
    if (!code) continue;
    const bucket = roomTypeGroups.get(code) ?? [];
    bucket.push(m);
    roomTypeGroups.set(code, bucket);
  }
  const distinctRoomTypes = [...roomTypeGroups.keys()];

  interface RoomPair { codeA: string; codeB: string; score: number; reasons: string[]; avoid: boolean; }
  const roomPairs: RoomPair[] = [];
  for (let i = 0; i < distinctRoomTypes.length; i++) {
    for (let j = i + 1; j < distinctRoomTypes.length; j++) {
      const r = pairCompatibility(distinctRoomTypes[i], distinctRoomTypes[j], template);
      roomPairs.push({ codeA: distinctRoomTypes[i], codeB: distinctRoomTypes[j], score: r.score, reasons: r.reasons, avoid: r.avoid });
    }
  }
  const bestRoomPairs = [...roomPairs].sort((a, b) => b.score - a.score).slice(0, 3);
  const cautionRoomPairs = roomPairs.filter((p) => p.avoid);

  const nameOfType = (code: string) => table[code]?.title ?? code;

  const renderPartner = (p: TypePartner, tone: 'good' | 'caution') => (
    <button
      key={p.code}
      onClick={() => setSelectedCode(p.code)}
      className={`w-full text-left rounded-xl p-3 transition-all hover:scale-[1.01] ${
        tone === 'good' ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: `${typeColor(p.code)}1A` }}>
          <img src={TYPE_IMAGES[p.code]} alt={p.code} className="w-full h-full object-contain" />
        </div>
        <p className={`text-sm font-black ${tone === 'good' ? 'text-emerald-600' : 'text-amber-600'}`}>
          {p.code} · {nameOfType(p.code)}
        </p>
      </div>
      {p.reasons.map((r, i) => (
        <p key={i} className="text-xs text-gray-600 leading-relaxed">{r}</p>
      ))}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#1D324B] font-sans flex flex-col items-center">
      <Navbar bgColor="#122031" nameColor="white" />
      <div className="w-full max-w-6xl px-4 mt-4 pb-10">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all flex-shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-white text-xl sm:text-2xl font-black italic tracking-tight uppercase">MBTI Templates</h1>
            <p className="text-white/50 text-xs font-medium">คู่มืออ้างอิง MBTI 16 ประเภท สำหรับใช้ประกอบการจัดกลุ่ม{roomTitle ? ` — ${roomTitle}` : ''}</p>
          </div>
        </div>

        {/* Template tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {TEMPLATE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                template === t.id ? 'bg-[#4B3E7A] text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ภาพรวมห้องนี้ — แสดงเฉพาะเมื่อเปิดจากหน้า lobby ของห้องจริง และมีสมาชิกทำแบบทดสอบแล้วอย่างน้อย 2 type */}
        {roomId && distinctRoomTypes.length >= 2 && (
          <div className="bg-white rounded-[20px] p-4 sm:p-5 shadow-sm mb-4">
            <p className="flex items-center gap-1.5 text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
              <Users size={13} /> คำแนะนำสำหรับห้องนี้ ({roomMembers.length} คน, {distinctRoomTypes.length} type)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1"><Sparkles size={13} /> คู่ที่เหมาะสมสำหรับการทำงานร่วมกัน</p>
                <div className="flex flex-col gap-2">
                  {bestRoomPairs.map((p, i) => (
                    <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                      <p className="text-xs font-bold text-emerald-700">{nameOfType(p.codeA)} ({p.codeA}) + {nameOfType(p.codeB)} ({p.codeB})</p>
                      <p className="text-[11px] text-gray-500">{p.reasons[0]}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-amber-600 mb-2 flex items-center gap-1"><ShieldAlert size={13} /> คู่ที่ควรทำความเข้าใจกัน</p>
                {cautionRoomPairs.length === 0 ? (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-2.5">ไม่มีคู่ที่ต้องระวังเป็นพิเศษในห้องนี้</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {cautionRoomPairs.map((p, i) => (
                      <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                        <p className="text-xs font-bold text-amber-700">{nameOfType(p.codeA)} ({p.codeA}) + {nameOfType(p.codeB)} ({p.codeB})</p>
                        <p className="text-[11px] text-gray-500">{p.reasons[0]}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
              คำแนะนำนี้เป็นแนวทางประกอบการจัดกลุ่มเท่านั้น ไม่ได้หมายความว่า MBTI คู่ใดคู่หนึ่งจะทำงานร่วมกันไม่ได้แน่นอน —
              ระบบจับกลุ่มอัตโนมัติได้พิจารณาความหลากหลายและความเข้ากันนี้ให้แล้วเมื่อกด Match
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 16-type grid */}
          <div className="lg:col-span-5 bg-white rounded-[20px] p-4 shadow-sm">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">เลือกดู MBTI Type</p>
            <div className="grid grid-cols-4 gap-2">
              {MBTI_CODES.map((code) => {
                const active = code === selectedCode;
                const present = roomTypeGroups.has(code);
                return (
                  <button
                    key={code}
                    onClick={() => setSelectedCode(code)}
                    className={`relative flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
                      active ? 'ring-2 ring-offset-1' : 'hover:bg-gray-50'
                    }`}
                    style={active ? { backgroundColor: `${typeColor(code)}18`, boxShadow: `0 0 0 2px ${typeColor(code)}` } : undefined}
                  >
                    {present && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#7096D1]" title="มีสมาชิกในห้องนี้" />}
                    <div className="w-10 h-10 rounded-lg overflow-hidden" style={{ backgroundColor: `${typeColor(code)}1A` }}>
                      <img src={TYPE_IMAGES[code]} alt={code} className="w-full h-full object-contain" />
                    </div>
                    <span className="text-[10px] font-black" style={{ color: typeColor(code) }}>{code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-7 bg-white rounded-[20px] p-4 sm:p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0" style={{ backgroundColor: `${typeColor(selectedCode)}1A` }}>
                <img src={TYPE_IMAGES[selectedCode]} alt={selectedCode} className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mb-1" style={{ backgroundColor: `${roleColor(typeIcon(selectedCode))}18`, color: roleColor(typeIcon(selectedCode)) }}>
                  {selectedCode}
                </p>
                <p className="text-xl font-black" style={{ color: typeColor(selectedCode) }}>{info?.title ?? selectedCode}</p>
                {membersOfSelectedType.length > 0 && (
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    ในห้องนี้: {membersOfSelectedType.map((m) => m.name).join(', ')}
                  </p>
                )}
              </div>
            </div>

            {info?.description && (
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">จุดเด่นและลักษณะการทำงาน</p>
                <p className="text-sm text-gray-600 leading-relaxed">{info.description}</p>
                {info.jobs?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {info.jobs.map((job) => (
                      <span key={job} className="bg-[#EDE9FF] text-[#4B3E7A] text-[11px] font-bold px-2.5 py-1 rounded-full">{job}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Sparkles size={13} /> ทำงานร่วมกันได้ดีกับ
              </p>
              <div className="flex flex-col gap-2">
                {summary.bestPartners.map((p) => renderPartner(p, 'good'))}
              </div>
            </div>

            <div>
              <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                <ShieldAlert size={13} /> ควรทำความเข้าใจสไตล์ที่ต่างกันกับ
              </p>
              {summary.cautionPartners.length === 0 ? (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                  ไม่มี type ที่ต้องระวังเป็นพิเศษสำหรับ {selectedCode} ในบริบทนี้
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {summary.cautionPartners.map((p) => renderPartner(p, 'caution'))}
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                หมายเหตุ: เป็นเพียงแนวทางประกอบการตัดสินใจ ไม่ได้แปลว่า type เหล่านี้ทำงานร่วมกันไม่ได้ — ต่างกันแค่สไตล์การสื่อสาร/การทำงานที่ควรเข้าใจกันเพิ่มขึ้น
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MbtiGuidePage() {
  return (
    <Suspense fallback={null}>
      <MbtiGuideContent />
    </Suspense>
  );
}
