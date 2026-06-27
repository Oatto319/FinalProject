'use client';

import { useState, useEffect, Suspense } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function ProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromEdit = searchParams.get('from') === 'edit';
  const [selectedAvatar, setSelectedAvatar] = useState(7);
  const [loading, setLoading] = useState(false);

  const avatars = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    url: `/img/p${i + 1}.PNG`,
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
        <div className="grid grid-cols-5 gap-4 md:gap-6 justify-items-center">
          {avatars.map((avatar) => (
            <div key={avatar.id} onClick={() => setSelectedAvatar(avatar.id)}
              className={`relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 ${selectedAvatar === avatar.id ? 'scale-105' : 'grayscale-[20%] hover:grayscale-0'}`}>
              <div className={`w-full h-full rounded-full overflow-hidden transition-all ${selectedAvatar === avatar.id ? 'ring-4 ring-blue-500 shadow-lg' : ''}`}>
                <img src={avatar.url} alt={`Avatar ${avatar.id}`} className="w-full h-full object-cover" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-12">
          <button onClick={() => router.back()} className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 transition-all active:scale-95">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className={`px-12 py-4 rounded-[20px] font-bold text-xl transition-all ${loading ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-[0_8px_0_0_#b0b0b0]' : 'bg-[#2D3E50] text-white shadow-[0_8px_0_0_#111c27] hover:shadow-[0_4px_0_0_#111c27] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px]'}`}>
            {loading ? 'กำลังบันทึกผล...' : 'Confirm'}
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
