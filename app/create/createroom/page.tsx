'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ArrowRight, ChevronDown } from 'lucide-react';

interface CurrentUser {
  name: string;
  gender: string;
  avatarSeed: number;
  role?: string;
}

export default function CreateRoomPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', totalMembers: '', groupSize: '' });
  const [step, setStep] = useState(1);
  const [showError, setShowError] = useState(false);
  const [sizeWarning, setSizeWarning] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    const total = parseInt(name === 'totalMembers' ? value : updated.totalMembers);
    const size  = parseInt(name === 'groupSize'    ? value : updated.groupSize);
    if (total > 0 && size > 0) {
      if (size > total) setSizeWarning('⚠️ จำนวนกลุ่มละกี่คน มากกว่าจำนวนนักเรียนทั้งหมด');
      else if (total % size !== 0) setSizeWarning(`⚠️ จำนวนไม่ลงตัว — จะได้ ${Math.floor(total / size)} กลุ่มเต็ม และเหลือ ${total % size} คน`);
      else setSizeWarning(`✓ ได้ ${total / size} กลุ่ม กลุ่มละ ${size} คน`);
    } else setSizeWarning('');
  };

  const handleCreate = async () => {
    const { title, description, totalMembers, groupSize } = formData;
    if (!title || !description || !totalMembers || !groupSize) { setShowError(true); return; }
    setShowError(false);
    setLoading(true);

    try {
      const roomId = Math.floor(1000000 + Math.random() * 9000000).toString();
      const pendingRaw = localStorage.getItem('pendingRoom');
      const template = pendingRaw ? (JSON.parse(pendingRaw).template ?? 'programming') : 'programming';

      const roomData = {
        roomId,
        title,
        description,
        totalMembers: parseInt(totalMembers),
        groupSize: parseInt(groupSize),
        template,
        hostName: user?.name ?? '',
        hostAvatarSeed: user?.avatarSeed ?? 0,
        hostRole: user?.role ?? 'host',
        members: [],
      };

      await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData),
      });

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

  return (
    <div className="min-h-screen bg-[#1D324B] font-sans flex flex-col items-center justify-center px-4 py-12">

      <h1 className="text-white font-black uppercase tracking-widest text-6xl mb-8">CREATE</h1>

      <div className="w-full max-w-lg bg-[#f0f2f8] rounded-[24px] p-6 shadow-2xl">

        {step === 1 ? (
          <>
            <div className="flex flex-col gap-4">
              {/* Room Name */}
              <div className="bg-[#1D324B] rounded-[20px] p-5">
                <p className="text-white font-bold text-base mb-3">&ldquo;To name the room&rdquo;</p>
                <input
                  type="text" name="title" value={formData.title} onChange={handleChange}
                  placeholder="ชื่อกิจกรรม"
                  className="w-full bg-white rounded-xl py-4 px-5 text-[#1D324B] font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-300 transition-all"
                />
              </div>

              {/* Description */}
              <div className="bg-[#1D324B] rounded-[20px] p-5">
                <p className="text-white font-bold text-base mb-3">&ldquo;Describe the activity&rdquo;</p>
                <textarea
                  name="description" value={formData.description} onChange={handleChange}
                  placeholder="รายละเอียดกิจกรรม / กำหนดส่งงาน" rows={2}
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
                <ChevronLeft size={28} strokeWidth={2.5} />
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
                    placeholder="30" min={1}
                    className="w-full bg-white rounded-xl py-4 pl-5 pr-14 text-[#1D324B] font-semibold text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-300 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 pointer-events-none">
                    <ChevronDown size={20} strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              {/* Group Size */}
              <div className="bg-[#1D324B] rounded-[20px] p-5">
                <p className="text-white font-bold text-base mb-3">&ldquo;How many people per group?&rdquo;</p>
                <div className="relative">
                  <input
                    type="number" name="groupSize" value={formData.groupSize} onChange={handleChange}
                    placeholder="3" min={1}
                    className="w-full bg-white rounded-xl py-4 pl-5 pr-14 text-[#1D324B] font-semibold text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-300 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 pointer-events-none">
                    <ChevronDown size={20} strokeWidth={2.5} />
                  </div>
                </div>
                {sizeWarning && (
                  <p className={`text-sm font-bold mt-3 ${sizeWarning.startsWith('✓') ? 'text-green-400' : 'text-yellow-300'}`}>
                    {sizeWarning}
                  </p>
                )}
              </div>
            </div>

            {showError && (
              <p className="text-red-500 font-bold text-sm mt-4 px-1">⚠️ กรุณากรอกจำนวนให้ครบ</p>
            )}

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => { setStep(1); setShowError(false); }}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all"
              >
                <ChevronLeft size={28} strokeWidth={2.5} />
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
  );
}
