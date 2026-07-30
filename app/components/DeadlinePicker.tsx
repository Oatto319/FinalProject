'use client';

import { useMemo, useState } from 'react';
import { CalendarClock, ChevronDown } from 'lucide-react';
import { dateStringToUtcDate, dateTimeStringToUtcDate, todayDateString, toDateString } from '@/lib/date';

const YEAR_COUNT = 6;

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

/** One of the tappable pills at the top of a picker group ("วันที่ 6", "เดือน ม.ค.", ...) — click to switch which grid is shown below. */
function StepPill({ label, value, active, onClick }: { label: string; value: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl px-3 py-2 text-center transition-colors ${
        active ? 'bg-[#1D324B] text-white' : 'bg-gray-50 text-[#1D324B] hover:bg-blue-50'
      }`}
    >
      <span className={`block text-[10px] font-bold ${active ? 'text-blue-200' : 'text-gray-400'}`}>{label}</span>
      <span className="block text-sm font-bold">{value}</span>
    </button>
  );
}

/** A grid of tappable options for whichever step is currently active. */
function OptionGrid({ options, selectedIndex, onSelect, columns }: {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  columns: number;
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((label, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={`rounded-lg py-2 text-sm font-bold tabular-nums transition-colors ${
            i === selectedIndex ? 'bg-[#1D324B] text-white' : 'bg-gray-50 text-[#1D324B] hover:bg-blue-50'
          }`}
        >
          {label}
        </button>
      ))}
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
  const [error, setError] = useState('');

  // Which sub-step ("วันที่ / เดือน / ปี" or "ชั่วโมง / นาที") is currently showing its grid.
  const [dateStep, setDateStep] = useState<'day' | 'month' | 'year'>('day');
  const [timeStep, setTimeStep] = useState<'hour' | 'minute'>('hour');

  const openPicker = () => {
    setDraft(parseValue(value) ?? defaultDraft());
    setOpenField('date');
    setDateStep('day');
    setTimeStep('hour');
    setError('');
    setOpen(true);
  };

  const maxDay = daysInMonth(draft.month, draft.year);
  const dayOptions = useMemo(() => Array.from({ length: maxDay }, (_, i) => String(i + 1)), [maxDay]);
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => monthLabel(i)), []);
  const yearStart = useMemo(() => Number(todayDateString().slice(0, 4)), []);
  const yearOptions = useMemo(() => Array.from({ length: YEAR_COUNT }, (_, i) => `${yearStart + i + 543}`), [yearStart]);
  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => pad2(i)), []);
  const minuteOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => pad2(i * 5)), []);

  // Tap a day -> auto-advance to month. Tap a month -> auto-advance to year. Tap a year -> done.
  const selectDay = (i: number) => {
    setDraft((d) => ({ ...d, day: i + 1 }));
    setDateStep('month');
  };
  const selectMonth = (i: number) => {
    setDraft((d) => ({ ...d, month: i, day: Math.min(d.day, daysInMonth(i, d.year)) }));
    setDateStep('year');
  };
  const selectYear = (i: number) => {
    setDraft((d) => ({ ...d, year: yearStart + i, day: Math.min(d.day, daysInMonth(d.month, yearStart + i)) }));
  };

  // Tap an hour -> auto-advance to minute.
  const selectHour = (i: number) => {
    setDraft((d) => ({ ...d, hour: i }));
    setTimeStep('minute');
  };
  const selectMinute = (i: number) => {
    setDraft((d) => ({ ...d, minute: i * 5 }));
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
          <div className="bg-white rounded-[24px] w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
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
                <div className="px-3 pb-4 flex flex-col gap-3">
                  <div className="flex gap-1.5">
                    <StepPill label="วันที่" value={String(draft.day)} active={dateStep === 'day'} onClick={() => setDateStep('day')} />
                    <StepPill label="เดือน" value={monthLabel(draft.month)} active={dateStep === 'month'} onClick={() => setDateStep('month')} />
                    <StepPill label="ปี" value={String(draft.year + 543)} active={dateStep === 'year'} onClick={() => setDateStep('year')} />
                  </div>
                  {dateStep === 'day' && (
                    <OptionGrid options={dayOptions} selectedIndex={draft.day - 1} onSelect={selectDay} columns={7} />
                  )}
                  {dateStep === 'month' && (
                    <OptionGrid options={monthOptions} selectedIndex={draft.month} onSelect={selectMonth} columns={4} />
                  )}
                  {dateStep === 'year' && (
                    <OptionGrid options={yearOptions} selectedIndex={draft.year - yearStart} onSelect={selectYear} columns={3} />
                  )}
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
                <div className="px-3 pb-4 flex flex-col gap-3">
                  <div className="flex gap-1.5">
                    <StepPill label="ชั่วโมง" value={pad2(draft.hour)} active={timeStep === 'hour'} onClick={() => setTimeStep('hour')} />
                    <StepPill label="นาที" value={pad2(draft.minute)} active={timeStep === 'minute'} onClick={() => setTimeStep('minute')} />
                  </div>
                  {timeStep === 'hour' && (
                    <OptionGrid options={hourOptions} selectedIndex={draft.hour} onSelect={selectHour} columns={6} />
                  )}
                  {timeStep === 'minute' && (
                    <OptionGrid options={minuteOptions} selectedIndex={Math.round(draft.minute / 5)} onSelect={selectMinute} columns={4} />
                  )}
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