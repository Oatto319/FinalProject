'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LucideMessageCircle } from 'lucide-react';

interface User {
  name: string;
  gender: string;
  avatarSeed: number;
  role?: string;
}

interface NavbarProps {
  subtitle?: string; // ถ้าไม่ระบุ จะใช้ user.gender
}

const avatars = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 101}`,
}));

export default function Navbar({ subtitle }: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [renameError, setRenameError] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(1);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      router.replace('/login');
    } else {
      const u = JSON.parse(raw);
      setUser(u);
      setSelectedAvatar(u.avatarSeed || 1);
    }
  }, [router]);

  useEffect(() => {
    if (!showMenu) return;
    const handleClick = () => setShowMenu(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showMenu]);

  const saveUserToStorage = (updated: User) => {
    localStorage.setItem('currentUser', JSON.stringify(updated));
    const usersRaw = localStorage.getItem('users');
    if (usersRaw) {
      const users = JSON.parse(usersRaw);
      const idx = users.findIndex(
        (u: User & { password: string }) =>
          u.name.toLowerCase() === user!.name.toLowerCase()
      );
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...updated };
        localStorage.setItem('users', JSON.stringify(users));
      }
    }
    setUser(updated);
  };

  const handleRename = () => {
    setRenameError('');
    if (!newName.trim()) { setRenameError('กรุณากรอกชื่อ'); return; }
    saveUserToStorage({ ...user!, name: newName.trim() });
    setShowRenameModal(false);
    setNewName('');
  };

  const handleAvatarSave = () => {
    saveUserToStorage({ ...user!, avatarSeed: selectedAvatar });
    setShowAvatarModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  if (!user) return null;

  const avatarUrl = user.avatarSeed === 0
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatarSeed + 100}`;

  const displaySubtitle = subtitle ?? user.role ?? user.gender;

  return (
    <>
      <header className="w-full flex items-center justify-between bg-white p-6 shadow-sm">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <div className="relative flex items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
              className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden bg-orange-100 border-2 border-orange-200">
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-2xl text-gray-800 leading-tight">{user.name}</h2>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  displaySubtitle === 'host'
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-orange-100 text-orange-500'
                }`}>
                  {displaySubtitle}
                </span>
              </div>
            </button>

            {showMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-20 left-0 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[200px]"
              >
                <button
                  onClick={() => { setNewName(user.name); setShowRenameModal(true); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-6 py-4 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  เปลี่ยนชื่อ
                </button>
                <div className="border-t border-gray-100" />
                <button
                  onClick={() => { setSelectedAvatar(user.avatarSeed || 1); setShowAvatarModal(true); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-6 py-4 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                  เปลี่ยนโปรไฟล์
                </button>
                <div className="border-t border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-6 py-4 text-red-500 font-bold hover:bg-red-50 transition-colors text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>

          <button className="bg-green-500 p-4 rounded-full text-white shadow-lg hover:scale-105 transition-transform active:scale-95">
            <LucideMessageCircle fill="currentColor" size={32} />
          </button>
        </div>
      </header>

      {/* Modal เปลี่ยนชื่อ */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[30px] p-8 w-full max-w-md shadow-2xl flex flex-col gap-6">
            <h2 className="text-2xl font-black text-[#2D3E50]">เปลี่ยนชื่อ</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              placeholder="กรอกชื่อใหม่..."
              className="w-full border-2 border-gray-200 rounded-2xl py-4 px-6 text-[#2D3E50] font-bold text-lg focus:outline-none focus:border-blue-400 transition-colors"
              autoFocus
            />
            {renameError && <p className="text-red-500 text-sm font-medium -mt-3">{renameError}</p>}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowRenameModal(false); setRenameError(''); }}
                className="px-6 py-3 rounded-2xl text-gray-500 font-bold hover:bg-gray-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleRename}
                className="px-8 py-3 bg-[#2D3E50] text-white rounded-2xl font-bold hover:bg-[#1E293B] transition-colors"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal เปลี่ยนโปรไฟล์ */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[30px] p-8 w-full max-w-2xl shadow-2xl flex flex-col gap-6">
            <h2 className="text-2xl font-black text-[#2D3E50]">เลือก Avatar ใหม่</h2>
            <div className="grid grid-cols-5 gap-4 justify-items-center">
              {avatars.map((avatar) => (
                <div
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`w-16 h-16 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 ${
                    selectedAvatar === avatar.id ? 'scale-105' : 'grayscale-[20%]'
                  }`}
                >
                  <div className={`w-full h-full rounded-full overflow-hidden bg-gray-50 border-4 transition-colors ${
                    selectedAvatar === avatar.id ? 'border-blue-500 shadow-lg' : 'border-transparent'
                  }`}>
                    <img src={avatar.url} alt={`Avatar ${avatar.id}`} className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAvatarModal(false)}
                className="px-6 py-3 rounded-2xl text-gray-500 font-bold hover:bg-gray-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAvatarSave}
                className="px-8 py-3 bg-[#2D3E50] text-white rounded-2xl font-bold hover:bg-[#1E293B] transition-colors"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
