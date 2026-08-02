'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { todayDateString, toDateString, dateStringToUtcDate } from '@/lib/date';
import DeadlinePicker from '@/app/components/DeadlinePicker';

interface CurrentUser {
  name: string;
  gender: string;
  avatarSeed: number;
  avatarImage?: string | null;
  role?: string;
}

// ✅ ข้อความ "CREATE" ลอยผ่านจอเป็นพื้นหลัง (รูปแบบเดียวกับ app/join/roomid/page.tsx)
const BACKGROUND_FLOAT_TEXT = [
  { top: '6%',  left: '-10%', fontSize: 'clamp(1.2rem, 14vw, 5rem)',   rotate: '-24deg', opacity: 0.14, drift: 'waveDrift1', duration: '26s', delay: '0s' },
  { top: '20%', left: '-15%', fontSize: 'clamp(1.5rem, 20vw, 8rem)',  rotate: '16deg',  opacity: 0.12, drift: 'waveDrift2', duration: '32s', delay: '-4s' },
  { top: '38%', left: '-10%', fontSize: 'clamp(1rem,   12vw, 4rem)',  rotate: '-8deg',  opacity: 0.16, drift: 'waveDrift3', duration: '22s', delay: '-8s' },
  { top: '56%', left: '-15%', fontSize: 'clamp(1.5rem, 22vw, 9rem)',  rotate: '-18deg', opacity: 0.12, drift: 'waveDrift1', duration: '34s', delay: '-10s' },
  { top: '74%', left: '-10%', fontSize: 'clamp(1.2rem, 16vw, 6rem)',  rotate: '20deg',  opacity: 0.16, drift: 'waveDrift3', duration: '25s', delay: '-6s' },
  { top: '90%', left: '-15%', fontSize: 'clamp(1rem,   12vw, 4.5rem)',rotate: '-30deg', opacity: 0.14, drift: 'waveDrift2', duration: '30s', delay: '-14s' },
];

// ✅ สี & ข้อความลอย ตาม template ที่เลือก (สีอ้างอิงจากหน้า templates)
const TEMPLATE_BACKGROUNDS: Record<string, { bg: string; floatColor: string; label: string }> = {
  programming:  { bg: '#FFAAAA', floatColor: '#D87878', label: 'PROGRAMMING' },
  service:      { bg: '#71EFB8', floatColor: '#5CC095', label: 'CUSTOMER / SERVICE' },
  presentation: { bg: '#EAFF48', floatColor: '#B2C334', label: 'PRESENTATION' },
  design:       { bg: '#8C71EF', floatColor: '#6D58B9', label: 'DESIGN / CREATIVE' },
};

// ค่าเริ่มต้น กรณียังไม่มี template เลือกไว้ (คงพฤติกรรมเดิม)
const DEFAULT_BACKGROUND = { bg: '#FFDB10', floatColor: '#C9A400', label: 'CREATE' };

export default function CreateRoomPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [template, setTemplate] = useState<string>('');
  const [formData, setFormData] = useState({ title: '', description: '', totalMembers: '', groupSize: '', deadline: '' });
  const [step, setStep] = useState(1);
  const [showError, setShowError] = useState(false);
  const [sizeWarning, setSizeWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTotalDrop, setShowTotalDrop] = useState(false);
  const [showGroupDrop, setShowGroupDrop] = useState(false);

  const totalOptions = [5, 10, 15, 20, 25, 30, 35, 40];
  const groupOptions = [2, 3, 4, 5, 6, 7, 8, 10];
  const dayOptions = [3, 7, 14, 30];
  const MAX_TOTAL_MEMBERS = 300;
  const MAX_GROUP_SIZE = 50;

  const todayStr = () => todayDateString();
  // นับวันแบบ absolute instant (ไม่พึ่ง timezone ของเครื่อง client) แล้วค่อยแปลงกลับเป็นวันที่ตามเขตเวลาไทย
  // deadline แบบด่วนตั้งเวลาไว้ใกล้สิ้นวัน (23:55) ให้เป็นค่าเริ่มต้นที่สมเหตุสมผลที่สุด
  // ใช้ 23:55 แทน 23:59 ให้ตรงกับ step 5 นาทีของวงล้อเลือกเวลาใน DeadlinePicker
  const addDaysDeadline = (days: number) => {
    const base = dateStringToUtcDate(todayDateString());
    base.setUTCDate(base.getUTCDate() + days);
    return `${toDateString(base)}T23:55`;
  };

  const selectDeadline = (days: number) => {
    setFormData((prev) => ({ ...prev, deadline: addDaysDeadline(days) }));
  };

  const selectOption = (name: string, value: number) => {
    const e = { target: { name, value: String(value) } } as React.ChangeEvent<HTMLInputElement>;
    handleChange(e);
    setShowTotalDrop(false);
    setShowGroupDrop(false);
  };

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));

    const pendingRaw = localStorage.getItem('pendingRoom');
    if (pendingRaw) {
      const pending = JSON.parse(pendingRaw);
      if (pending.template) setTemplate(pending.template);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    const total = parseInt(name === 'totalMembers' ? value : updated.totalMembers);
    const size  = parseInt(name === 'groupSize'    ? value : updated.groupSize);
    if (total > MAX_TOTAL_MEMBERS) setSizeWarning(`⚠️ จำนวนคนทั้งหมดต้องไม่เกิน ${MAX_TOTAL_MEMBERS} คน`);
    else if (size > MAX_GROUP_SIZE) setSizeWarning(`⚠️ จำนวนคนต่อกลุ่มต้องไม่เกิน ${MAX_GROUP_SIZE} คน`);
    else if (total > 0 && size > 0) {
      if (size > total) setSizeWarning('⚠️ จำนวนกลุ่มละกี่คน มากกว่าจำนวนนักเรียนทั้งหมด');
      else if (total % size !== 0) setSizeWarning(`⚠️ จำนวนไม่ลงตัว — จะได้ ${Math.floor(total / size)} กลุ่มเต็ม และเหลือ ${total % size} คน`);
      else setSizeWarning(`✓ ได้ ${total / size} กลุ่ม กลุ่มละ ${size} คน`);
    } else setSizeWarning('');
  };

  const handleCreate = async () => {
    if (loading) return;
    const { title, description, totalMembers, groupSize, deadline } = formData;
    if (!title || !description || !totalMembers || !groupSize) { setShowError(true); return; }
    const total = parseInt(totalMembers);
    const size = parseInt(groupSize);
    if (!(total >= 1) || total > MAX_TOTAL_MEMBERS || !(size >= 1) || size > MAX_GROUP_SIZE) {
      setShowError(true);
      return;
    }
    if (deadline && deadline.split('T')[0] < todayStr()) { setShowError(true); return; }
    setShowError(false);
    setLoading(true);

    try {
      const roomId = Math.floor(100000 + Math.random() * 900000).toString();
      const pendingRaw = localStorage.getItem('pendingRoom');
      const template = pendingRaw ? (JSON.parse(pendingRaw).template ?? 'programming') : 'programming';

      const roomData = {
        roomId,
        title,
        description,
        totalMembers: total,
        groupSize: size,
        deadline: deadline || null,
        template,
        hostName: user?.name ?? '',
        hostAvatarSeed: user?.avatarSeed ?? 0,
        hostAvatarImage: user?.avatarImage ?? null,
        hostRole: user?.role ?? 'host',
        members: [],
      };

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'สร้างห้องไม่สำเร็จ กรุณาลองใหม่');
        if (res.status === 403 && data.pending) router.push('/evaluation');
        return;
      }

      // เก็บ currentRoom ใน localStorage สำหรับ navigate
      const roomForLocal = { ...roomData, id: roomId };
      localStorage.setItem('currentRoom', JSON.stringify(roomForLocal));

      router.push('/create/typeselection');
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!formData.title || !formData.description) { setShowError(true); return; }
    setShowError(false);
    setStep(2);
  };

  const theme = TEMPLATE_BACKGROUNDS[template] ?? DEFAULT_BACKGROUND;

  return (
    <>
      <style>{`
        @keyframes waveDrift1 {
          0%   { transform: translateX(-10vw) translateY(0vh); }
          50%  { transform: translateX(120vw) translateY(-6vh); }
          100% { transform: translateX(-10vw) translateY(0vh); }
        }

        @keyframes waveDrift2 {
          0%   { transform: translateX(-10vw) translateY(0vh); }
          50%  { transform: translateX(115vw) translateY(8vh); }
          100% { transform: translateX(-10vw) translateY(0vh); }
        }

        @keyframes waveDrift3 {
          0%   { transform: translateX(-10vw) translateY(0vh); }
          50%  { transform: translateX(125vw) translateY(-4vh); }
          100% { transform: translateX(-10vw) translateY(0vh); }
        }
      `}</style>

      <div
        className="min-h-screen font-sans flex flex-col items-center px-4 py-12 relative overflow-hidden"
        style={{ background: theme.bg }}
      >
        {/* ✅ เลเยอร์พื้นหลัง CREATE ลอยผ่านจอ */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
        >
          {BACKGROUND_FLOAT_TEXT.map((s, i) => (
            <div
              key={`text-${i}`}
              style={{
                position: 'absolute',
                top: s.top,
                left: s.left,
                transform: `rotate(${s.rotate})`,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  fontSize: s.fontSize,
                  color: `color-mix(in srgb, ${theme.floatColor} ${Math.round(s.opacity * 100)}%, ${theme.bg})`,
                  fontFamily: 'var(--font-luckiest-guy), Arial, sans-serif',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  letterSpacing: '-0.03em',
                  whiteSpace: 'nowrap',
                  animation: `${s.drift} ${s.duration} linear infinite`,
                  animationDelay: s.delay,
                }}
              >
                {theme.label}
              </span>
            </div>
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <h1 className="text-white font-black uppercase tracking-widest text-5xl sm:text-6xl md:text-7xl mb-6 sm:mb-8" style={{ textShadow: '0 4px 0 rgba(0,0,0,0.3)' }}>CREATE</h1>

          <div className="w-full max-w-lg bg-white rounded-[24px] p-4 sm:p-6 shadow-2xl">

            {step === 1 ? (
              <>
                <div className="flex flex-col gap-4">
                  {/* Room Name */}
                  <div className="bg-[#1D324B] rounded-[20px] p-5">
                    <p className="text-white font-bold text-base mb-3">&ldquo;To name the room&rdquo;</p>
                    <input
                      type="text" name="title" value={formData.title} onChange={handleChange}
                      placeholder="ชื่อกิจกรรม" maxLength={100}
                      className="w-full bg-white rounded-xl py-4 px-5 text-[#1D324B] font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-300 transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div className="bg-[#1D324B] rounded-[20px] p-5">
                    <p className="text-white font-bold text-base mb-3">&ldquo;Describe the activity&rdquo;</p>
                    <textarea
                      name="description" value={formData.description} onChange={handleChange}
                      placeholder="รายละเอียดกิจกรรม / กำหนดส่งงาน" rows={2} maxLength={500}
                      className="w-full bg-white rounded-xl py-4 px-5 text-[#1D324B] font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-300 resize-none transition-all"
                    />
                  </div>
                </div>

                {showError && (
                  <p className="text-red-500 font-bold text-sm mt-4 px-1">⚠️ กรุณากรอกชื่อและรายละเอียด</p>
                )}

                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => router.push('/')}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all"
                  >
                    <ChevronLeft size={24} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-3 bg-[#1D324B] text-white px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-all active:scale-95"
                  >
                    Next
                    <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <ArrowRight size={18} />
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {/* Total Members */}
                  <div className="bg-[#1D324B] rounded-[20px] p-5">
                    <p className="text-white font-bold text-base mb-3">&ldquo;Maximum people?&rdquo;</p>
                    <div className="relative">
                      <input
                        type="number" name="totalMembers" value={formData.totalMembers} onChange={handleChange}
                        placeholder="30" min={1} max={MAX_TOTAL_MEMBERS}
                        className="w-full bg-white rounded-xl py-4 pl-5 pr-14 text-[#1D324B] font-semibold text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-300 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => { setShowTotalDrop((v) => !v); setShowGroupDrop(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 transition-colors"
                      >
                        <ChevronDown size={20} strokeWidth={2.5} />
                      </button>
                      {showTotalDrop && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg z-20 overflow-hidden">
                          <div className="grid grid-cols-4">
                            {totalOptions.map((v) => (
                              <button key={v} type="button" onClick={() => selectOption('totalMembers', v)}
                                className={`py-3 text-center font-bold text-[#1D324B] hover:bg-blue-50 transition-colors ${formData.totalMembers === String(v) ? 'bg-blue-100 text-blue-600' : ''}`}>
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Group Size */}
                  <div className="bg-[#1D324B] rounded-[20px] p-5">
                    <p className="text-white font-bold text-base mb-3">&ldquo;How many people per group?&rdquo;</p>
                    <div className="relative">
                      <input
                        type="number" name="groupSize" value={formData.groupSize} onChange={handleChange}
                        placeholder="3" min={1} max={MAX_GROUP_SIZE}
                        className="w-full bg-white rounded-xl py-4 pl-5 pr-14 text-[#1D324B] font-semibold text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-300 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => { setShowGroupDrop((v) => !v); setShowTotalDrop(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 transition-colors"
                      >
                        <ChevronDown size={20} strokeWidth={2.5} />
                      </button>
                      {showGroupDrop && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg z-20 overflow-hidden">
                          <div className="grid grid-cols-4">
                            {groupOptions.map((v) => (
                              <button key={v} type="button" onClick={() => selectOption('groupSize', v)}
                                className={`py-3 text-center font-bold text-[#1D324B] hover:bg-blue-50 transition-colors ${formData.groupSize === String(v) ? 'bg-blue-100 text-blue-600' : ''}`}>
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {sizeWarning && (
                      <p className={`text-sm font-bold mt-3 ${sizeWarning.startsWith('✓') ? 'text-green-400' : 'text-yellow-300'}`}>
                        {sizeWarning}
                      </p>
                    )}
                  </div>

                  {/* Deadline */}
                  <div className="bg-[#1D324B] rounded-[20px] p-5">
                    <p className="text-white font-bold text-base mb-3">&ldquo;When is the deadline?&rdquo;</p>
                    <DeadlinePicker
                      value={formData.deadline}
                      onChange={(deadline) => setFormData((prev) => ({ ...prev, deadline }))}
                    />
                    <div className="flex flex-wrap gap-2 mt-3">
                      {dayOptions.map((d) => (
                        <button key={d} type="button" onClick={() => selectDeadline(d)}
                          className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${formData.deadline === addDaysDeadline(d) ? 'bg-blue-400 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                          {d} วัน
                        </button>
                      ))}
                      {formData.deadline && (
                        <button type="button" onClick={() => setFormData((prev) => ({ ...prev, deadline: '' }))}
                          className="px-4 py-2 rounded-full font-bold text-sm text-white/60 hover:text-white transition-colors">
                          ล้าง
                        </button>
                      )}
                    </div>
                    <p className="text-white/50 text-xs mt-2">ไม่กำหนดก็ได้ (ไม่บังคับ)</p>
                  </div>
                </div>

                {showError && (
                  <p className="text-red-500 font-bold text-sm mt-4 px-1">⚠️ กรุณากรอกจำนวนให้ครบ หรือกำหนดวันสิ้นสุดให้ถูกต้อง</p>
                )}

                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => { setStep(1); setShowError(false); }}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all"
                  >
                    <ChevronLeft size={24} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={handleCreate} disabled={loading}
                    className="bg-[#1D324B] text-white px-10 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-60"
                  >
                    {loading ? 'กำลังสร้าง...' : 'Create'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}