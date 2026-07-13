'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../navbar/page';
import { resolveAvatar } from '@/lib/avatar';

const CRITERIA = [
  { id: 'decision',       label: 'ความรวดเร็วในการตัดสินใจ' },
  { id: 'creative',       label: 'ความคิดสร้างสรรค์' },
  { id: 'emotion',        label: 'การควบคุมอารมณ์' },
  { id: 'teamwork',       label: 'การทำงานเป็นทีม' },
  { id: 'responsibility', label: 'ความรับผิดชอบ' },
] as const;

const RATING_LABELS = ['ปรับปรุง', 'พอใช้', 'ปานกลาง', 'ดี', 'ดีมาก'];

interface Teammate { name: string; gmail: string; avatarSeed: number; avatarImage?: string | null; }
interface PendingRoom { roomId: string; roomTitle: string; groupId: number; teammates: Teammate[]; }
interface QueueItem { roomId: string; roomTitle: string; groupId: number; teammate: Teammate; }

export default function EvaluationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [extra, setExtra] = useState<{ roomId: string; leaderId?: string; types: Record<string, { code: string }> } | null>(null);

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

  useEffect(() => {
    setRatings({});
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

  const allAnswered = useMemo(() => CRITERIA.every((c) => ratings[c.id] !== undefined), [ratings]);

  const handleSubmit = async () => {
    if (!current || !allAnswered || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: current.roomId, toGmail: current.teammate.gmail, scores: ratings }),
      });
      if (!res.ok) { setSubmitting(false); return; }
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

  const person = current.teammate;
  const mbtiType = extra?.types[person.name]?.code;
  const isLeader = extra?.leaderId === person.name;

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#1D324B' }}>
      <Navbar bgColor="#122031" nameColor="white" />

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-6">
        <p className="text-white/60 font-bold text-sm mb-3">
          ประเมินเพื่อนร่วมทีม · {current.roomTitle} ({index + 1}/{queue.length})
        </p>
        <div className="w-full max-w-2xl rounded-3xl overflow-hidden">
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
              disabled={!allAnswered || submitting}
              onClick={handleSubmit}
              className="w-full py-3.5 rounded-2xl font-black text-white text-base transition-all active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: '#2D3E50' }}
            >
              {submitting ? 'กำลังส่ง...' : 'ส่งการประเมิน'}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
