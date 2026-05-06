'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromEdit = searchParams.get('from') === 'edit';
  const [selectedAvatar, setSelectedAvatar] = useState(7);
  const [loading, setLoading] = useState(false);

  const avatars = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 101}`,
  }));

  useEffect(() => {
    if (fromEdit) {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const u = JSON.parse(raw);
        if (u.avatarSeed) setSelectedAvatar(u.avatarSeed);
      }
    }
  }, [fromEdit]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (fromEdit) {
        const raw = localStorage.getItem('currentUser');
        if (!raw) { router.replace('/login'); return; }
        const currentUser = JSON.parse(raw);
        const updated = { ...currentUser, avatarSeed: selectedAvatar };

        await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gmail: currentUser.gmail, avatarSeed: selectedAvatar }),
        });

        localStorage.setItem('currentUser', JSON.stringify(updated));
        router.back();
        return;
      }

      const pendingRaw = localStorage.getItem('pendingRegistration');
      if (!pendingRaw) { router.push('/login/register'); return; }

      const pending = JSON.parse(pendingRaw);
      const newUser = { ...pending, avatarSeed: selectedAvatar };

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? 'เกิดข้อผิดพลาด'); return; }

      localStorage.setItem('currentUser', JSON.stringify(data.user));
      localStorage.removeItem('pendingRegistration');
      router.push('/login/welcome');
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E5E7EB] flex flex-col items-center justify-center p-4 font-sans">
      <p className="text-[#2D3E50] text-sm font-medium text-center mb-4">
        {fromEdit ? '"เลือก Avatar ใหม่"' : '"Choose your avatar"'}
      </p>
      <div className="bg-white w-full max-w-[900px] rounded-[24px] p-8 md:p-12 shadow-sm border border-gray-100">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6 md:gap-10 justify-items-center">
          {avatars.map((avatar) => (
            <div key={avatar.id} onClick={() => setSelectedAvatar(avatar.id)}
              className={`relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 ${selectedAvatar === avatar.id ? 'scale-105' : 'grayscale-[20%] hover:grayscale-0'}`}>
              <div className={`w-full h-full rounded-full overflow-hidden bg-gray-50 border-4 transition-colors ${selectedAvatar === avatar.id ? 'border-blue-500 shadow-lg' : 'border-transparent shadow-sm'}`}>
                <img src={avatar.url} alt={`Avatar ${avatar.id}`} className="w-full h-full object-cover" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-12">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium">← กลับ</button>
          <button onClick={handleConfirm} disabled={loading}
            className="bg-[#2D3E50] text-white px-12 py-4 rounded-2xl font-bold text-xl hover:bg-[#1E293B] transition-all active:scale-95 shadow-lg disabled:opacity-60">
            {loading ? 'กำลังบันทึก...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfilePageInner />
    </Suspense>
  );
}
