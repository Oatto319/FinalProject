'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, LogOut, Settings } from 'lucide-react';
import { resolveAvatar } from '@/lib/avatar';

interface User { name: string; gender: string; avatarSeed: number; avatarImage?: string | null; role?: string; password?: string; gmail?: string; }

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser]           = useState<User | null>(null);
  const [name, setName]           = useState('');
  const [role, setRole]           = useState<'user' | 'host'>('user');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading]     = useState(false);

  const loadUser = () => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) { router.replace('/login'); return; }
    const u: User = JSON.parse(raw);
    setUser(u);
    setName(u.name);
    setRole((u.role === 'host' ? 'host' : 'user') as 'user' | 'host');
  };

  useEffect(() => {
    loadUser();
    window.addEventListener('focus', loadUser);
    return () => window.removeEventListener('focus', loadUser);
  }, []);

  const handleLogout = () => {
    fetch('/api/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  const handleSave = async () => {
    if (!name.trim()) { setNameError('กรุณากรอกชื่อ'); return; }
    if (!user) return;
    setLoading(true);
    try {
      const updated: User = { ...user, name: name.trim(), role };
      // หมายเหตุ: PATCH /api/users จะ cascade อัปเดตชื่อในทุกห้อง (members/matchedGroups/hostName) ให้เองแล้ว
      await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmail: user.gmail, name: updated.name, role: updated.role }),
      });

      localStorage.setItem('currentUser', JSON.stringify(updated));
      router.back();
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const currentAvatarUrl = resolveAvatar(user);

  return (
    <div className="min-h-screen bg-gray-200 font-sans flex items-start justify-center p-6 pt-10">
      <div className="w-full max-w-4xl grid grid-cols-[320px_1fr] gap-4">

        {/* Left Card — Avatar + Name + Save */}
        <div className="bg-white rounded-[24px] p-8 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-56 h-56 rounded-full overflow-hidden bg-blue-100">
              <img src={currentAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => router.push('/login/profile?from=edit')}
              className="absolute bottom-2 right-2 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition-colors active:scale-95"
            >
              <Pencil size={16} className="text-gray-600" />
            </button>
          </div>

          <p className="text-lg text-gray-800">{name || user.name}</p>

          <button
            onClick={handleSave} disabled={loading}
            className="px-10 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'save'}
          </button>
        </div>

        {/* Right Card — Edit Fields */}
        <div className="bg-white rounded-[24px] p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Name</label>
            <input
              type="text" value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              placeholder="Your name"
              className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            />
            {nameError && <p className="text-red-500 text-xs">{nameError}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Role</label>
            <div className="flex items-center justify-between border border-gray-200 rounded-xl py-3 px-4 bg-white">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${role === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>
                {role === 'host' ? 'อาจารย์ (Host)' : 'นักเรียน (User)'}
              </span>
              <button onClick={() => router.push('/firstpage?from=edit')} className="text-sm text-blue-500 font-semibold hover:underline">
                Change
              </button>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between">
            <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Cancel
            </button>
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/settings')} className="flex items-center gap-2 text-sm text-gray-500 font-semibold hover:text-gray-700 transition-colors">
                <Settings size={16} />
                ตั้งค่า
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-500 font-semibold hover:text-red-700 transition-colors">
                <LogOut size={16} />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
