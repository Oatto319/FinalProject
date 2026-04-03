'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Users, BookOpen, AlignLeft } from 'lucide-react';

interface CurrentUser {
  name: string;
  gender: string;
  avatarSeed: number;
}

export default function CreateRoomPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', totalMembers: '', groupSize: '' });
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

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      <main className="w-full max-w-5xl mt-12 px-4 pb-12">
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm flex flex-col items-center min-h-[600px] relative">
          <button onClick={() => router.push('/')}
            className="absolute left-8 top-8 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-all active:scale-90">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>
          <div className="w-full max-w-2xl bg-[#2D3E50] rounded-[40px] p-10 shadow-2xl space-y-8 mt-4">
            <h1 className="text-white text-3xl font-black italic text-center mb-8 tracking-wide">&ldquo;Create your room&rdquo;</h1>
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><BookOpen size={24} /></div>
                <input type="text" name="title" placeholder="ชื่อกิจกรรม" value={formData.title} onChange={handleChange}
                  className="w-full bg-white rounded-2xl py-5 pl-14 pr-6 text-[#2D3E50] font-bold text-xl focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all placeholder:text-gray-300" />
              </div>
              <div className="relative">
                <div className="absolute left-4 top-6 text-gray-400"><AlignLeft size={24} /></div>
                <textarea name="description" placeholder="รายละเอียดกิจกรรม / รายละเอียดห้อง" value={formData.description} onChange={handleChange} rows={3}
                  className="w-full bg-white rounded-2xl py-5 pl-14 pr-6 text-[#2D3E50] font-bold text-xl focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all placeholder:text-gray-300 resize-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Users size={24} /></div>
                  <input type="number" name="totalMembers" placeholder="จำนวนนักเรียนทั้งหมด" value={formData.totalMembers} onChange={handleChange} min={1}
                    className="w-full bg-white rounded-2xl py-5 pl-14 pr-6 text-[#2D3E50] font-bold text-xl focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all placeholder:text-gray-300" />
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Users size={24} /></div>
                  <input type="number" name="groupSize" placeholder="จำนวนกลุ่มละกี่คน" value={formData.groupSize} onChange={handleChange} min={1}
                    className="w-full bg-white rounded-2xl py-5 pl-14 pr-6 text-[#2D3E50] font-bold text-xl focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all placeholder:text-gray-300" />
                </div>
              </div>
              {sizeWarning && (
                <p className={`text-sm font-bold px-2 ${sizeWarning.startsWith('✓') ? 'text-green-400' : 'text-yellow-300'}`}>{sizeWarning}</p>
              )}
            </div>
            <div className="pt-4">
              <button onClick={handleCreate} disabled={loading}
                className="w-full bg-[#7096D1] text-white py-6 rounded-[25px] font-black text-3xl shadow-[0_8px_0_0_#4A6FA5] hover:shadow-[0_4px_0_0_#4A6FA5] hover:translate-y-[4px] transition-all active:shadow-none active:translate-y-[8px] uppercase tracking-widest disabled:opacity-60">
                {loading ? 'กำลังสร้าง...' : 'CREATE'}
              </button>
            </div>
          </div>
          <div className="mt-8 text-sm font-medium italic">
            {showError
              ? <p className="text-red-500 font-bold opacity-90">⚠️ กรุณากรอกข้อมูลให้ครบทุกช่องก่อนกดสร้างห้อง</p>
              : <p className="text-gray-400 opacity-60">* ตรวจสอบข้อมูลให้ครบถ้วนก่อนกดสร้างห้อง</p>
            }
          </div>
        </div>
      </main>
    </div>
  );
}
