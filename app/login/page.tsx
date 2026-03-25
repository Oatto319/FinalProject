'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = () => {
    setError('');
    if (!gmail.trim() || !password.trim()) {
      setError('กรุณากรอก Gmail และรหัสผ่าน');
      return;
    }
    if (!gmail.toLowerCase().endsWith('@gmail.com')) {
      setError('กรุณากรอก Gmail ที่ถูกต้อง');
      return;
    }

    const usersRaw = localStorage.getItem('users');
    const users: { name: string; gender: string; gmail: string; password: string; avatarSeed: number }[] = usersRaw
      ? JSON.parse(usersRaw)
      : [];

    const found = users.find(
      (u) => u.gmail?.toLowerCase() === gmail.trim().toLowerCase() && u.password === password
    );

    if (!found) {
      setError('Gmail หรือรหัสผ่านไม่ถูกต้อง');
      return;
    }

    localStorage.setItem('currentUser', JSON.stringify(found));
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#1E293B] flex items-center justify-center p-4 font-sans">
      {/* Main White Container */}
      <div className="bg-white w-full max-w-[500px] rounded-[40px] overflow-hidden shadow-2xl flex flex-col items-center p-8 md:p-12">

        {/* Top Illustration */}
        <div className="w-full flex justify-center -mt-12 mb-4">
          <img
            src="/img/team.png"
            alt="Team Illustration"
            className="w-full max-w-[360px] h-auto object-contain drop-shadow-lg"
            onError={(e) => {
              e.currentTarget.src =
                'https://img.freepik.com/free-vector/team-holding-jigsaw-puzzle-pieces_74855-6962.jpg';
            }}
          />
        </div>

        {/* Title */}
        <h1 className="text-[#2D3142] text-xl font-bold mb-8">เข้าสู่ระบบ</h1>

        {/* Login Form Gray Box */}
        <div className="w-full bg-[#D1D5DB] rounded-[30px] p-8 mb-6 flex flex-col gap-4 shadow-inner">
          <div className="flex flex-col gap-2">
            <label className="text-[#4A4E69] font-bold text-lg ml-2">Gmail</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={gmail}
              onChange={(e) => setGmail(e.target.value)}
              className="w-full bg-white rounded-full py-4 px-6 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all placeholder:text-gray-300"
            />
          </div>

          <div className="flex flex-col gap-2 relative">
            <input
              type="password"
              placeholder="กรอกรหัสผ่าน......"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
              className="w-full bg-white rounded-full py-4 px-6 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all placeholder:text-gray-300 mt-4"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center font-medium">{error}</p>
          )}

          {/* Register Button */}
          <div className="flex justify-end mt-2">
            <button
              onClick={() => router.push('/login/register')}
              className="bg-[#64748B] text-white px-8 py-2 rounded-full hover:bg-[#475569] transition-colors text-sm font-medium"
            >
              Register
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleSignIn}
            className="w-full bg-[#607D8B] text-white py-4 rounded-[20px] font-bold text-lg hover:brightness-95 transition-all shadow-md active:scale-95"
          >
            Sign in
          </button>

        </div>
      </div>
    </div>
  );
}
