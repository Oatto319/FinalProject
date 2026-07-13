'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList } from 'lucide-react';

// หน้าที่เป็น "จุดเริ่มสร้าง/เข้าร่วมห้องใหม่" เท่านั้นที่บล็อก — หน้าที่ใช้งานห้องที่จับกลุ่มแล้วอยู่ (myteam, chat, group ฯลฯ)
// ต้องเข้าถึงได้ตามปกติเสมอ ตามที่ต้องการ
const GATED_PATHS = ['/', '/templates', '/join/roomid', '/create/createroom', '/join/check'];

export default function PendingEvaluationGate() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem('currentUser')) return;

    const check = () => {
      fetch('/api/evaluations')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => { if (data) setPendingCount((data.pending ?? []).length); })
        .catch(() => {});
    };

    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  const isGatedPath = GATED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (pendingCount === 0 || !isGatedPath) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] px-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
          <ClipboardList size={32} />
        </div>
        <h2 className="text-xl font-black text-gray-800">มีแบบประเมินเพื่อนร่วมทีมค้างอยู่</h2>
        <p className="text-gray-500 text-sm">
          กรุณาประเมินเพื่อนร่วมทีมของกิจกรรมที่จบแล้วให้ครบ ({pendingCount} ห้อง) ก่อนสร้างหรือเข้าร่วมห้องใหม่
        </p>
        <button
          onClick={() => router.push('/evaluation')}
          className="w-full bg-[#2D3E50] text-white py-3 rounded-2xl font-bold hover:bg-slate-700 transition-all active:scale-95"
        >
          ไปทำแบบประเมิน
        </button>
        <button
          onClick={() => router.push('/join/myprojects')}
          className="text-gray-400 text-xs font-semibold hover:underline"
        >
          ดูทีมที่จับกลุ่มแล้ว
        </button>
      </div>
    </div>
  );
}
