'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface User {
  name: string;
  gender: string;
  avatarSeed: number;
  role?: string;
  password?: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'host'>('user');
  const [nameError, setNameError] = useState('');

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
  }, [router]);

  const handleSave = () => {
    if (!name.trim()) { setNameError('กรุณากรอกชื่อ'); return; }
    if (!user) return;

    const updated: User = { ...user, name: name.trim(), role };
    localStorage.setItem('currentUser', JSON.stringify(updated));

    const usersRaw = localStorage.getItem('users');
    if (usersRaw) {
      const users: User[] = JSON.parse(usersRaw);
      const idx = users.findIndex((u) => u.name.toLowerCase() === user.name.toLowerCase());
      if (idx >= 0) {
        users[idx] = { ...users[idx], name: updated.name, role: updated.role };
        localStorage.setItem('users', JSON.stringify(users));
      }
    }

    router.back();
  };

  if (!user) return null;

  const currentAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${(user.avatarSeed || 1) + 100}`;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center font-sans">
      {/* Header */}
      <div className="w-full bg-white shadow-sm px-6 py-5 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors active:scale-95"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <h1 className="text-xl font-black text-[#2D3E50]">แก้ไขโปรไฟล์</h1>
      </div>

      <div className="w-full max-w-lg px-4 mt-8 flex flex-col gap-6">

        {/* Preview */}
        <div className="bg-white rounded-[28px] p-6 flex items-center gap-5 shadow-sm">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-orange-100 border-4 border-orange-200 flex-shrink-0">
            <img src={currentAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-lg font-black text-[#2D3E50]">{name || user.name}</p>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${role === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>
              {role === 'host' ? 'host' : 'user'}
            </span>
          </div>
        </div>

        {/* Name Input */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm flex flex-col gap-3">
          <label className="text-sm font-black text-gray-500 uppercase tracking-wider">ชื่อ</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(''); }}
            placeholder="กรอกชื่อ..."
            className="w-full border-2 border-gray-200 rounded-2xl py-4 px-5 text-[#2D3E50] font-bold text-lg focus:outline-none focus:border-blue-400 transition-colors"
          />
          {nameError && <p className="text-red-500 text-sm font-medium">{nameError}</p>}
        </div>

        {/* Role */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-gray-500 uppercase tracking-wider mb-1">สถานะ</p>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${role === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>
              {role === 'host' ? 'อาจารย์ (Host)' : 'นักเรียน (User)'}
            </span>
          </div>
          <button
            onClick={() => router.push('/firstpage?from=edit')}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors active:scale-95"
          >
            เปลี่ยน
          </button>
        </div>

        {/* Avatar Selector */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-orange-100 border-4 border-orange-200">
              <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <p className="text-sm font-black text-gray-500 uppercase tracking-wider">Avatar</p>
          </div>
          <button
            onClick={() => router.push('/login/profile?from=edit')}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors active:scale-95"
          >
            แก้ไข
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={() => router.back()}
            className="flex-1 py-4 rounded-2xl text-gray-500 font-bold bg-white shadow-sm hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="flex-[2] py-4 rounded-2xl bg-[#2D3E50] text-white font-black text-lg shadow-md hover:bg-[#1E293B] transition-colors active:scale-95"
          >
            บันทึก
          </button>
        </div>

      </div>
    </div>
  );
}
