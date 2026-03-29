'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Pencil } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F6F8FA] font-sans">
      {/* Header */}
      <div className="w-full bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors active:scale-95"
        >
          <ChevronLeft size={22} strokeWidth={2} className="text-gray-600" />
        </button>
        <h1 className="text-base font-semibold text-gray-800">Edit profile</h1>
      </div>

      {/* GitHub-style two-column layout */}
      <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-8 items-start">

        {/* Left Column — Avatar */}
        <div className="flex flex-col items-center gap-3 md:w-[260px] flex-shrink-0">
          <div className="relative group">
            <div className="w-[220px] h-[220px] rounded-full overflow-hidden bg-orange-50 border-4 border-white shadow-md ring-1 ring-gray-200">
              <img src={currentAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => router.push('/login/profile?from=edit')}
              className="absolute bottom-3 right-3 w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors active:scale-95"
            >
              <Pencil size={16} className="text-gray-600" />
            </button>
          </div>
          <p className="text-base font-bold text-gray-800">{name || user.name}</p>
          <button
            onClick={() => router.push('/login/profile?from=edit')}
            className="text-sm text-[#0969DA] font-semibold hover:underline"
          >
            Edit avatar
          </button>
        </div>

        {/* Right Column — Form */}
        <div className="flex-1 flex flex-col gap-5 w-full">

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-800">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              placeholder="Your name"
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-800 text-sm focus:outline-none focus:border-[#0969DA] focus:ring-2 focus:ring-[#0969DA]/20 transition-all"
            />
            {nameError && <p className="text-red-500 text-xs">{nameError}</p>}
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-800">Role</label>
            <div className="flex items-center justify-between border border-gray-300 rounded-md py-2 px-3 bg-white">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${role === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>
                {role === 'host' ? 'อาจารย์ (Host)' : 'นักเรียน (User)'}
              </span>
              <button
                onClick={() => router.push('/firstpage?from=edit')}
                className="text-sm text-[#0969DA] font-semibold hover:underline"
              >
                Change
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-[#2DA44E] hover:bg-[#2C974B] active:bg-[#298E46] text-white font-semibold text-sm rounded-md transition-colors active:scale-95 shadow-sm"
            >
              Save profile
            </button>
            <button
              onClick={() => router.back()}
              className="px-5 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold text-sm rounded-md transition-colors active:scale-95"
            >
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
