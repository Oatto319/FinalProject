'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../navbar/page';
import { resolveAvatar } from '@/lib/avatar';

const CRITERIA = [
  { id: 'contribution',   label: 'การมีส่วนร่วมและลงมือทำงานจริง' },
  { id: 'responsibility', label: 'ความรับผิดชอบและตรงต่อเวลา' },
  { id: 'communication',  label: 'การสื่อสารและรับฟังความคิดเห็น' },
  { id: 'problemSolving', label: 'การแก้ไขปัญหาเมื่อเกิดอุปสรรค' },
  { id: 'cooperation',    label: 'ความร่วมมือและช่วยเหลือเพื่อนในทีม' },
  { id: 'creativity',     label: 'ความคิดสร้างสรรค์ในการทำงาน' },
  { id: 'initiative',     label: 'ความคิดริเริ่มและความเป็นผู้นำ' },
  { id: 'timeManagement', label: 'การบริหารจัดการเวลาและวางแผนงาน' },
  { id: 'adaptability',   label: 'ความยืดหยุ่นและปรับตัวเมื่อสถานการณ์เปลี่ยน' },
  { id: 'qualityOfWork',  label: 'คุณภาพของผลงานที่ทำออกมา' },
] as const;

const RATING_LABELS = ['ปรับปรุง', 'พอใช้', 'ปานกลาง', 'ดี', 'ดีมาก'];

// Swipeable-stack tuning
const STACK_VISIBLE_DEPTH = 3;
const STACK_OFFSET_Y = 16;
const STACK_OFFSET_X = 22;
const STACK_SCALE_STEP = 0.05;
const SWIPE_THRESHOLD = 60;
const TAP_MOVE_TOLERANCE = 6;

interface Teammate { name: string; gmail: string; avatarSeed: number; avatarImage?: string | null; }
interface PendingRoom { roomId: string; roomTitle: string; groupId: number; teammates: Teammate[]; }
interface QueueItem { roomId: string; roomTitle: string; groupId: number; teammate: Teammate; }

// คีย์เฉพาะของ "การประเมินคนคนนี้ในกลุ่มนี้" — ใช้แยกคะแนนของแต่ละคนออกจากกัน
const keyFor = (item: Pick<QueueItem, 'roomId' | 'groupId' | 'teammate'>) =>
  `${item.roomId}:${item.groupId}:${item.teammate.gmail}`;

export default function EvaluationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [index, setIndex] = useState(0);
  // เก็บคะแนนแยกเป็นรายบุคคล (key = roomId:groupId:gmail) แทนที่จะใช้ตัวแปรเดียวรวมทุกคน
  // เดิมใช้ ratings ตัวเดียว แล้ว reset ด้วย useEffect ที่ผูกกับ roomId/groupId เท่านั้น
  // พอเปลี่ยนคนโดยห้อง/กลุ่มเดิม (กรณีปกติของการประเมินเพื่อนในทีมเดียวกัน) effect ไม่ทำงาน
  // คะแนนของคนแรกเลยค้างติดไปโชว์ที่การ์ดคนที่สอง — นี่คือสาเหตุของบัค "คะแนนถูกก็อปมา"
  const [ratingsMap, setRatingsMap] = useState<Record<string, Record<string, number>>>({});
  const [submittedKeys, setSubmittedKeys] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [extra, setExtra] = useState<{ roomId: string; leaderId?: string; types: Record<string, { code: string }> } | null>(null);

  // --- swipeable-stack state ---
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragXRef = useRef(0);
  const movedRef = useRef(false);

  const loadPending = async () => {
    const res = await fetch('/api/evaluations');
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    const rooms: PendingRoom[] = data.pending ?? [];
    const flat: QueueItem[] = rooms.flatMap((r) =>
      r.teammates.map((t) => ({ roomId: r.roomId, roomTitle: r.roomTitle, groupId: r.groupId, teammate: t }))
    );
    setQueue(flat);
    setIndex(0);
    setLoading(false);
  };

  useEffect(() => { loadPending(); }, []);

  const current = queue[index] ?? null;
  const currentKey = current ? keyFor(current) : null;
  const ratings = currentKey ? (ratingsMap[currentKey] ?? {}) : {};

  const setRating = (criterionId: string, value: number) => {
    if (!currentKey) return;
    setRatingsMap((prev) => ({ ...prev, [currentKey]: { ...(prev[currentKey] ?? {}), [criterionId]: value } }));
  };

  useEffect(() => {
    if (!current) { setExtra(null); return; }
    if (extra?.roomId === current.roomId) return;

    (async () => {
      const [roomRes, typesRes] = await Promise.all([
        fetch(`/api/rooms/${current.roomId}`),
        fetch(`/api/rooms/${current.roomId}/member-types?groupId=${current.groupId}`),
      ]);
      const roomData = roomRes.ok ? await roomRes.json() : null;
      const typesData = typesRes.ok ? await typesRes.json() : null;
      const group = (roomData?.room?.matchedGroups ?? []).find((g: { id: number }) => g.id === current.groupId);
      setExtra({ roomId: current.roomId, leaderId: group?.leaderId, types: typesData?.types ?? {} });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.roomId, current?.groupId]);

  const answeredCount = useMemo(() => CRITERIA.filter((c) => ratings[c.id] !== undefined).length, [ratings]);
  const allAnswered = answeredCount === CRITERIA.length;

  const handleSubmit = async () => {
    if (!current || !currentKey || !allAnswered || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: current.roomId, toGmail: current.teammate.gmail, scores: ratings }),
      });
      if (!res.ok) { setSubmitting(false); return; }
      setSubmittedKeys((prev) => new Set(prev).add(currentKey));
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 1400);
      if (index + 1 < queue.length) {
        setIndex(index + 1);
      } else {
        await loadPending();
        setFinished(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // --- swipe handlers (front card only): drag follows the finger, releasing past the
  // threshold advances/rewinds the queue (loops around); a swiped-away card simply
  // becomes non-front and its own transform transition carries it back into the stack ---
  const handleStackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (queue.length <= 1) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return; // don't hijack rating taps / submit button
    draggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragXRef.current = 0;
    movedRef.current = false;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleStackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const delta = e.clientX - dragStartXRef.current;
    dragXRef.current = delta;
    if (Math.abs(delta) > TAP_MOVE_TOLERANCE) movedRef.current = true;
    setDragX(delta);
  };

  const handleStackPointerEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    setDragX(0);
    const delta = dragXRef.current;
    if (queue.length > 1) {
      if (delta <= -SWIPE_THRESHOLD) {
        setIndex((idx) => (idx + 1) % queue.length);
      } else if (delta >= SWIPE_THRESHOLD) {
        setIndex((idx) => (idx - 1 + queue.length) % queue.length);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#1D324B' }}>
        <Navbar bgColor="#122031" nameColor="white" />
        <div className="flex-1 flex items-center justify-center text-white/60 font-bold">กำลังโหลด...</div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#1D324B' }}>
        <Navbar bgColor="#122031" nameColor="white" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-white text-2xl font-black">{finished ? 'ประเมินครบทุกคนแล้ว ขอบคุณครับ' : 'ไม่มีแบบประเมินที่ต้องทำ'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-white text-[#1D324B] px-8 py-3 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#1D324B' }}>
      <Navbar bgColor="#122031" nameColor="white" />

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-6">
        <p className="text-white/60 font-bold text-sm mb-1">
          ประเมินเพื่อนร่วมทีม · {current.roomTitle}
        </p>
        <p className="text-white/40 font-medium text-xs mb-3">
          คนที่ {index + 1} จาก {queue.length}
        </p>

        {/* Progress dots — ใครทำแล้ว / กำลังทำ / ยังไม่ทำ */}
        {queue.length > 1 && (
          <div className="flex items-center gap-1.5 mb-4">
            {queue.map((item, qIdx) => {
              const done = submittedKeys.has(keyFor(item));
              const isCurrent = qIdx === index;
              return (
                <div
                  key={`${item.roomId}-${item.teammate.gmail}`}
                  title={item.teammate.name}
                  className="rounded-full transition-all"
                  style={{
                    width: isCurrent ? 20 : 7,
                    height: 7,
                    backgroundColor: done ? '#4ADE80' : isCurrent ? '#ffffff' : 'rgba(255,255,255,0.25)',
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Swipeable stack */}
        <div
          className="relative w-full max-w-2xl"
          style={{
            touchAction: 'none',
            marginBottom: queue.length > 1 ? Math.min(queue.length - 1, STACK_VISIBLE_DEPTH) * STACK_OFFSET_Y : 0,
          }}
        >
          {queue.map((item, qIdx) => {
            // circular position relative to the front card — a swiped-away card
            // loops around to the back of the stack instead of disappearing
            const i = ((qIdx - index) % queue.length + queue.length) % queue.length;
            const isFront = i === 0;
            const clampedI = Math.min(i, STACK_VISIBLE_DEPTH);
            const translateY = clampedI * STACK_OFFSET_Y;
            const translateX = isFront ? dragX : clampedI * STACK_OFFSET_X;
            const scale = 1 - clampedI * STACK_SCALE_STEP;
            // cards beyond the visible depth stay pinned (and visible) at the back-most
            // slot instead of vanishing, so a just-swiped card visibly settles into place
            const opacity = 1;
            // เอียงเล็กน้อยตามความลึกในกอง (ไม่ผูกกับ index คงที่ของอาร์เรย์) เพื่อให้
            // ทิศทางเอียงสอดคล้องกับทิศที่เลื่อนออกไปทางขวาเสมอ ไม่ว่าใบไหนจะสลับมาอยู่ตำแหน่งนี้
            const rotate = isFront ? 0 : clampedI * 1.2;
            // เงาเข้มขึ้นตามความลึกของการ์ด ให้รู้สึกว่ามีแผ่นซ้อนอยู่ข้างหลัง
            const shadow = isFront
              ? '0 12px 24px rgba(0,0,0,0.18)'
              : `0 ${6 + clampedI * 5}px ${14 + clampedI * 8}px rgba(0,0,0,${0.16 + clampedI * 0.09})`;

            const person = item.teammate;
            const mbtiType = isFront ? extra?.types[person.name]?.code : undefined;
            const isLeader = isFront && extra?.leaderId === person.name;

            return (
              <div
                key={`${item.roomId}-${item.teammate.gmail}`}
                onPointerDown={isFront ? handleStackPointerDown : undefined}
                onPointerMove={isFront ? handleStackPointerMove : undefined}
                onPointerUp={isFront ? handleStackPointerEnd : undefined}
                onPointerCancel={isFront ? handleStackPointerEnd : undefined}
                className={`rounded-3xl overflow-hidden flex flex-col ${
                  isFront ? 'relative' : 'absolute inset-x-0 top-0 h-full'
                } ${
                  isFront ? (isDragging ? '' : 'transition-transform duration-300 ease-out') : 'transition-all duration-300 ease-out'
                } ${isFront ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
                style={{
                  transform: `translateY(${translateY}px) translateX(${translateX}px) rotate(${rotate}deg) scale(${scale})`,
                  zIndex: queue.length - clampedI,
                  opacity,
                  boxShadow: shadow,
                }}
              >
                {isFront ? (
                  <>
                    {/* Profile header */}
                    <div className="flex items-center gap-3 px-5 py-6" style={{ backgroundColor: '#CBD6E3' }}>
                      <img
                        src={resolveAvatar(person)}
                        alt={person.name}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base text-gray-800 truncate">{person.name}</p>
                        <p className="text-sm text-gray-500">นักเรียน</p>
                      </div>
                      {isLeader && (
                        <img src="/img/crown.PNG" alt="หัวหน้ากลุ่ม" className="w-14 h-14 object-contain flex-shrink-0" />
                      )}
                      {mbtiType && (
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                          style={{ backgroundColor: '#6B63B5' }}
                        >
                          {mbtiType}
                        </div>
                      )}
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
                                  onClick={() => setRating(criterion.id, n)}
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
                        disabled={!allAnswered || submitting}
                        onClick={handleSubmit}
                        className="w-full py-3.5 rounded-2xl font-black text-white text-base transition-all active:scale-95 disabled:opacity-40"
                        style={{ backgroundColor: '#2D3E50' }}
                      >
                        {submitting ? 'กำลังส่ง...' : 'ส่งการประเมิน'}
                      </button>
                      {!allAnswered && (
                        <p className="text-center text-xs font-medium text-gray-400 mt-2">
                          ให้คะแนนแล้ว {answeredCount}/{CRITERIA.length} ข้อ — เหลืออีก {CRITERIA.length - answeredCount} ข้อ
                        </p>
                      )}
                      {justSubmitted && (
                        <p className="text-center text-xs font-bold mt-2" style={{ color: '#22C55E' }}>
                          ✓ บันทึกคะแนนของ {current.teammate.name} แล้ว
                        </p>
                      )}
                    </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Simplified peek card — only a sliver of this ever shows behind the front card */}
                    <div className="flex items-center gap-3 px-5 py-6" style={{ backgroundColor: '#CBD6E3' }}>
                      <img
                        src={resolveAvatar(person)}
                        alt={person.name}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base text-gray-800 truncate">{person.name}</p>
                        <p className="text-sm text-gray-500">นักเรียน</p>
                      </div>
                      {submittedKeys.has(keyFor(item)) && (
                        <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-black">
                          ✓
                        </div>
                      )}
                    </div>
                    <div className="bg-white flex-1" />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}