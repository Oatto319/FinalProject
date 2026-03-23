'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [selectedAvatar, setSelectedAvatar] = useState(7);

  const avatars = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 101}`,
  }));

  const handleConfirm = () => {
    const pendingRaw = localStorage.getItem('pendingRegistration');
    if (!pendingRaw) {
      router.push('/login/register');
      return;
    }

    const pending = JSON.parse(pendingRaw);
    const newUser = { ...pending, avatarSeed: selectedAvatar };

    // เพิ่ม user เข้า users array
    const usersRaw = localStorage.getItem('users');
    const users: typeof newUser[] = usersRaw ? JSON.parse(usersRaw) : [];
    // ถ้ามีชื่อซ้ำ ให้อัปเดต
    const existingIndex = users.findIndex(
      (u) => u.name.toLowerCase() === newUser.name.toLowerCase()
    );
    if (existingIndex >= 0) {
      users[existingIndex] = newUser;
    } else {
      users.push(newUser);
    }

    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    localStorage.removeItem('pendingRegistration');

    router.push('/login/welcome');
  };

  return (
    <div className="min-h-screen bg-[#E5E7EB] flex flex-col items-center justify-center p-4 font-sans">

      {/* Header Text */}
      <div className="text-center mb-6">
        <h1 className="text-[#2D3E50] text-2xl font-bold">
          &quot;Choose your avatar&quot;
        </h1>
      </div>

      {/* Main Container */}
      <div className="bg-white w-full max-w-[900px] rounded-[40px] p-8 md:p-12 shadow-sm border border-gray-100">

        {/* Avatar Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6 md:gap-10 justify-items-center">
          {avatars.map((avatar) => (
            <div
              key={avatar.id}
              onClick={() => setSelectedAvatar(avatar.id)}
              className={`
                relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full cursor-pointer
                transition-all duration-300 hover:scale-110
                ${selectedAvatar === avatar.id
                  ? 'scale-105'
                  : 'grayscale-[20%] hover:grayscale-0'}
              `}
            >
              <div className={`w-full h-full rounded-full overflow-hidden bg-gray-50 border-4 transition-colors ${selectedAvatar === avatar.id ? 'border-blue-500 shadow-lg' : 'border-transparent shadow-sm'}`}>
                <img
                  src={avatar.url}
                  alt={`Avatar ${avatar.id}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-12">
          <button
            onClick={() => router.push('/login/register')}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium"
          >
            ← กลับ
          </button>
          <button
            onClick={handleConfirm}
            className="bg-[#2D3E50] text-white px-12 py-4 rounded-2xl font-bold text-xl hover:bg-[#1E293B] transition-all active:scale-95 shadow-lg"
          >
            Confirm
          </button>
        </div>

      </div>
    </div>
  );
}
