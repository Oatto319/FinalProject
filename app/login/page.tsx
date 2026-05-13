'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError('');
    if (!gmail.trim() || !password.trim()) { setError('กรุณากรอก Gmail และรหัสผ่าน'); return; }
    if (!gmail.toLowerCase().endsWith('@gmail.com')) { setError('กรุณากรอก Gmail ที่ถูกต้อง'); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/users?gmail=${encodeURIComponent(gmail.trim())}&password=${encodeURIComponent(password)}`);
      const data = await res.json();
      if (!data.user) { setError('Gmail หรือรหัสผ่านไม่ถูกต้อง'); return; }
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      router.push('/');
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1D324B] flex items-center justify-center p-4 font-sans" style={{ fontFamily: 'var(--font-geologica), sans-serif' }}>
      <div className="bg-white w-full max-w-[500px] rounded-[24px] overflow-hidden shadow-2xl flex flex-col items-center px-8 pb-8 pt-4 md:px-12 md:pb-12 md:pt-4">
        <div className="w-full flex justify-center -mt-24 mb-2">
          <img src="/img/team.png" alt="Team Illustration" className="w-full max-w-[420px] h-auto object-contain drop-shadow-lg"
            onError={(e) => { e.currentTarget.src = 'https://img.freepik.com/free-vector/team-holding-jigsaw-puzzle-pieces_74855-6962.jpg'; }} />
        </div>
        <h1 className="text-[#2D3142] text-xl font-bold mb-8">เข้าสู่ระบบ</h1>
        <div className="w-full bg-[#D1D5DB] rounded-[20px] p-8 mb-6 flex flex-col gap-4 shadow-inner">
          <div className="flex flex-col gap-2">
            <label className="text-[#4A4E69] font-bold text-lg ml-2">Username</label>
            <input type="email" placeholder="example@gmail.com" value={gmail}
              onChange={(e) => setGmail(e.target.value)}
              className="w-full bg-white rounded-full py-4 px-6 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all placeholder:text-gray-300" />
          </div>
          <div className="flex flex-col gap-2 relative mt-4">
            <input type={showPassword ? 'text' : 'password'} placeholder="กรอกรหัสผ่าน......"
              value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
              className="w-full bg-white rounded-full py-4 px-6 pr-14 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all placeholder:text-gray-300" />
            <button type="button" onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
          <div className="flex justify-end mt-2">
            <button onClick={() => router.push('/login/register')}
              className="bg-[#5679A3] text-white px-8 py-2 rounded-full hover:bg-[#4A6A8E] transition-colors text-sm font-medium">
              Register
            </button>
          </div>
        </div>
        <div className="w-full flex flex-col gap-3">
          <button onClick={handleSignIn} disabled={loading}
            className="w-full bg-[#5679A3] text-white py-4 rounded-[20px] font-bold text-lg hover:brightness-95 transition-all shadow-md active:scale-95 disabled:opacity-60">
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
