'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, ChevronDown } from 'lucide-react';
import { dateStringToUtcDate, dateTimeStringToUtcDate, todayDateString, toDateString } from '@/lib/date';

const OPTION_HEIGHT = 34;
const WHEEL_PAD = 51; // (136 - OPTION_HEIGHT) / 2 — keeps the centered option in the middle of the 136px-tall wheel
const YEAR_COUNT = 6;

const indexFromScrollTop = (scrollTop: number) => Math.round(scrollTop / OPTION_HEIGHT);
const scrollTopFromIndex = (index: number) => index * OPTION_HEIGHT;

const monthLabel = (month: number) => new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(new Date(2000, month, 1));
const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
const pad2 = (n: number) => String(n).padStart(2, '0');

interface Draft { year: number; month: number; day: number; hour: number; minute: number; }

function parseValue(value: string): Draft | null {
  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  if ([year, month, day, hour, minute].some((n) => Number.isNaN(n))) return null;
  return { year, month: month - 1, day, hour, minute };
}

// ใช้เขตเวลาไทยตายตัวเสมอ (เหมือน lib/date.ts) แทนเขตเวลาของเครื่อง client เพื่อไม่ให้ "วันนี้"/"ผ่านมาแล้วหรือยัง" ต่างกันตามอุปกรณ์
function defaultDraft(): Draft {
  const base = dateStringToUtcDate(todayDateString());
  base.setUTCDate(base.getUTCDate() + 7);
  const [year, month, day] = toDateString(base).split('-').map(Number);
  return { year, month: month - 1, day, hour: 23, minute: 55 };
}

function formatValue(d: Draft): string {
  return `${d.year}-${pad2(d.month + 1)}-${pad2(d.day)}T${pad2(d.hour)}:${pad2(d.minute)}`;
}

function formatThai(d: Draft): string {
  const date = new Date(d.year, d.month, d.day, d.hour, d.minute);
  const dateLabel = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${dateLabel} เวลา ${pad2(d.hour)}:${pad2(d.minute)}`;
}

/** A single scrollable "wheel" column — value is derived purely from scroll position (index * OPTION_HEIGHT). */
function WheelColumn({ options, selectedIndex, onSettle, flex, scrollKey }: {
  options: string[];
  selectedIndex: number;
  onSettle: (index: number) => void;
  flex?: number;
  scrollKey: number; // bump to force a re-sync of scrollTop (e.g. when the day count changes under the wheel)
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clamp defensively: an out-of-range index would set an over-large scrollTop that the browser
  // silently clamps, which fires a native 'scroll' event and makes handleScroll "settle" onto that
  // clamped position — silently mutating the value behind the caller's back.
  const clampedIndex = Math.min(Math.max(selectedIndex, 0), options.length - 1);

  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = scrollTopFromIndex(clampedIndex);
    // Only re-sync when the wheel is (re)mounted/reset — not on every settle, or user scroll would fight this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey]);

  const handleScroll = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const idx = Math.min(Math.max(indexFromScrollTop(el.scrollTop), 0), options.length - 1);
      onSettle(idx);
    }, 60);
  };

  // Let a tap on any visible option jump straight to it, instead of forcing the user
  // to scroll it precisely into the centered slot.
  const handleOptionClick = (i: number) => {
    const el = ref.current;
    if (!el) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    el.scrollTo({ top: scrollTopFromIndex(i), behavior: 'smooth' });
    onSettle(i);
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      style={{ flex: flex ?? 1, height: 136, overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollbarWidth: 'none', position: 'relative', zIndex: 1 }}
      className="[&::-webkit-scrollbar]:hidden"
    >
      <div style={{ height: WHEEL_PAD }} />
      {options.map((label, i) => (
        <div
          key={i}
          onClick={() => handleOptionClick(i)}
          // scrollSnapStop: 'always' forces momentum/fling scrolling to stop at every option instead of
          // gliding past several snap points at once — that glide-past is what was skipping over the
          // day/month/year the user meant to land on during a fast swipe.
          style={{ height: OPTION_HEIGHT, scrollSnapAlign: 'center', scrollSnapStop: 'always', cursor: 'pointer' }}
          className={`flex items-center justify-center font-medium tabular-nums transition-colors ${
            i === clampedIndex ? 'text-[#1D324B] font-bold text-[17px]' : 'text-gray-300 text-[15px]'
          }`}
        >
          {label}
        </div>
      ))}
      <div style={{ height: WHEEL_PAD }} />
    </div>
  );
}

interface DeadlinePickerProps {
  value: string; // '' or 'YYYY-MM-DDTHH:mm'
  onChange: (value: string) => void;
}

export default function DeadlinePicker({ value, onChange }: DeadlinePickerProps) {
  const [open, setOpen] = useState(false);
  const [openField, setOpenField] = useState<'date' | 'time' | null>('date');
  const [draft, setDraft] = useState<Draft>(() => parseValue(value) ?? defaultDraft());
  const [resetTick, setResetTick] = useState(0);
  const [dayResetTick, setDayResetTick] = useState(0);
  const [error, setError] = useState('');

  const openPicker = () => {
    setDraft(parseValue(value) ?? defaultDraft());
    setOpenField('date');
    setError('');
    setResetTick((t) => t + 1);
    setOpen(true);
  };

  const maxDay = daysInMonth(draft.month, draft.year);
  const dayOptions = useMemo(() => Array.from({ length: maxDay }, (_, i) => String(i + 1)), [maxDay]);
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => monthLabel(i)), []);
  const yearStart = useMemo(() => Number(todayDateString().slice(0, 4)), []);
  const yearOptions = useMemo(() => Array.from({ length: YEAR_COUNT }, (_, i) => `${yearStart + i + 543}`), [yearStart]);
  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => pad2(i)), []);
  const minuteOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => pad2(i * 5)), []);

  const setMonth = (i: number) => {
    setDraft((d) => ({ ...d, month: i, day: Math.min(d.day, daysInMonth(i, d.year)) }));
    setDayResetTick((t) => t + 1);
  };
  const setYear = (i: number) => {
    setDraft((d) => ({ ...d, year: yearStart + i, day: Math.min(d.day, daysInMonth(d.month, yearStart + i)) }));
    setDayResetTick((t) => t + 1);
  };

  const handleConfirm = () => {
    const composed = formatValue(draft);
    // เทียบเป็น instant จริงผ่านเขตเวลาไทยเสมอ (เดียวกับที่ server ใช้ตรวจ) แทนการตีความ y/m/d/h/m ตามเขตเวลาของเครื่อง client
    if (dateTimeStringToUtcDate(composed).getTime() < Date.now()) {
      setError('เลือกเวลาที่ยังไม่ผ่านมาได้เท่านั้น');
      return;
    }
    onChange(composed);
    setOpen(false);
  };

  const parsed = parseValue(value);

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className="w-full bg-white rounded-xl py-4 px-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
      >
        <span className="flex items-center gap-2 text-[#1D324B] font-semibold text-lg">
          <CalendarClock size={20} className="text-blue-400" />
          {parsed ? formatThai(parsed) : 'เลือกวันที่และเวลา'}
        </span>
        <ChevronDown size={18} className="text-gray-300" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <CalendarClock size={20} className="text-blue-400" />
              </div>
              <p className="text-xl font-black text-[#1D324B]">เลือกวันที่และเวลา</p>
            </div>

            {/* Date field */}
            <div className="bg-gray-50 border border-gray-100 rounded-[18px] overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenField((f) => (f === 'date' ? null : 'date'))}
                className="w-full flex items-center justify-between px-4 py-4 text-left"
              >
                <span className="text-xs font-bold text-gray-400">วันที่</span>
                <span className="flex-1 text-right mr-2 font-bold text-[#1D324B]">
                  {draft.day} {monthLabel(draft.month)} {draft.year + 543}
                </span>
                <ChevronDown size={16} className={`text-gray-300 transition-transform ${openField === 'date' ? 'rotate-180 text-blue-400' : ''}`} />
              </button>
              {openField === 'date' && (
                <div className="px-3 pb-4">
                  <div className="relative flex gap-1.5 bg-white rounded-2xl border border-gray-100 py-2.5">
                    <div className="pointer-events-none absolute left-2.5 right-2.5 top-1/2 -translate-y-1/2 h-[34px] rounded-lg bg-blue-50 border border-blue-100" />
                    <WheelColumn options={dayOptions} selectedIndex={draft.day - 1} flex={0.8} scrollKey={resetTick + dayResetTick}
                      onSettle={(i) => setDraft((d) => ({ ...d, day: i + 1 }))} />
                    <WheelColumn options={monthOptions} selectedIndex={draft.month} flex={1.3} scrollKey={resetTick}
                      onSettle={setMonth} />
                    <WheelColumn options={yearOptions} selectedIndex={draft.year - yearStart} scrollKey={resetTick}
                      onSettle={setYear} />
                  </div>
                </div>
              )}
            </div>

            {/* Time field */}
            <div className="bg-gray-50 border border-gray-100 rounded-[18px] overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenField((f) => (f === 'time' ? null : 'time'))}
                className="w-full flex items-center justify-between px-4 py-4 text-left"
              >
                <span className="text-xs font-bold text-gray-400">เวลา</span>
                <span className="flex-1 text-right mr-2 font-bold text-[#1D324B]">{pad2(draft.hour)}:{pad2(draft.minute)}</span>
                <ChevronDown size={16} className={`text-gray-300 transition-transform ${openField === 'time' ? 'rotate-180 text-blue-400' : ''}`} />
              </button>
              {openField === 'time' && (
                <div className="px-3 pb-4">
                  <div className="relative flex gap-1.5 bg-white rounded-2xl border border-gray-100 py-2.5">
                    <div className="pointer-events-none absolute left-2.5 right-2.5 top-1/2 -translate-y-1/2 h-[34px] rounded-lg bg-blue-50 border border-blue-100" />
                    <WheelColumn options={hourOptions} selectedIndex={draft.hour} scrollKey={resetTick}
                      onSettle={(i) => setDraft((d) => ({ ...d, hour: i }))} />
                    <WheelColumn options={minuteOptions} selectedIndex={Math.round(draft.minute / 5)} scrollKey={resetTick}
                      onSettle={(i) => setDraft((d) => ({ ...d, minute: i * 5 }))} />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[16px] px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
              <p className="font-bold text-[#1D324B] text-sm">{formatThai(draft)}</p>
            </div>

            {error && <p className="text-red-500 text-sm font-bold -mt-1">{error}</p>}

            <div className="flex gap-3 mt-1">
              <button type="button" onClick={() => setOpen(false)}
                className="flex-1 py-3 rounded-2xl text-gray-500 font-bold hover:bg-gray-100 transition-colors">
                ยกเลิก
              </button>
              <button type="button" onClick={handleConfirm}
                className="flex-1 py-3 rounded-2xl font-bold text-white bg-[#1D324B] hover:opacity-90 transition-all active:scale-95">
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}