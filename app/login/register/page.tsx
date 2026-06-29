'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ArrowRightCircle } from 'lucide-react';
import { isValidPassword, PASSWORD_HINT } from '@/lib/validation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setError('');
    if (!name.trim()) { setError('กรุณากรอกชื่อ'); return; }
    if (!gmail.trim() || !gmail.toLowerCase().endsWith('@gmail.com')) {
      setError('กรุณากรอก Gmail ที่ถูกต้อง (ต้องลงท้ายด้วย @gmail.com)'); return;
    }
    if (!isValidPassword(password)) {
      setError(PASSWORD_HINT); return;
    }

    setLoading(true);
    try {
      // เช็ค duplicate gmail
      const checkRes = await fetch(`/api/users?gmail=${encodeURIComponent(gmail.trim())}`);
      const checkData = await checkRes.json();
      if (checkData.user) { setError('Gmail นี้ถูกใช้งานแล้ว'); return; }

      localStorage.setItem('pendingRegistration', JSON.stringify({
        name: name.trim(), gender, gmail: gmail.trim().toLowerCase(), password,
      }));
      router.push('/login/profile');
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1D324B] flex flex-col items-center justify-center p-4 font-sans">
      <div className="text-center mb-8">
        <h1 className="text-white text-5xl md:text-6xl font-black tracking-tighter uppercase mb-2" style={{ textShadow: '0 4px 0 rgba(0,0,0,0.3)' }}>WHO ARE YOU?</h1>
        <p className="text-gray-400 text-sm">เลือกประเภทผู้ใช้งานเพื่อเข้าสู่ระบบ</p>
      </div>
      <div className="bg-white w-full max-w-[600px] rounded-[24px] p-8 md:p-12 shadow-2xl flex flex-col gap-6" style={{ fontFamily: 'var(--font-geologica), sans-serif' }}>
        <div className="bg-[#1D324B] rounded-[25px] p-6 flex flex-col gap-4">
          <label className="text-white text-xl">&quot;What&apos;s your name?&quot;</label>
          <input type="text" placeholder="กรอกชื่อของคุณ..." value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-white rounded-xl py-4 px-6 text-[#1D324B] font-bold text-lg focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all" />
        </div>
        <div className="bg-[#1D324B] rounded-[25px] p-6 flex flex-col gap-4">
          <label className="text-white text-xl">&quot;What is your gender?&quot;</label>
          <div className="relative group">
            <select value={gender} onChange={(e) => setGender(e.target.value)}
              className="w-full bg-white rounded-xl py-4 px-6 text-[#1D324B] font-bold text-lg appearance-none focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all cursor-pointer">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <div className="absolute right-0 top-0 h-full w-14 bg-[#D1D5DB] rounded-r-xl flex items-center justify-center pointer-events-none border-l border-gray-300">
              <ChevronDown className="text-[#1D324B]" size={28} strokeWidth={3} />
            </div>
          </div>
        </div>
        <div className="bg-[#1D324B] rounded-[25px] p-6 flex flex-col gap-4">
          <label className="text-white text-xl">&quot;What&apos;s your Gmail?&quot;</label>
          <input type="email" placeholder="example@gmail.com" value={gmail} onChange={(e) => setGmail(e.target.value)}
            className="w-full bg-white rounded-xl py-4 px-6 text-[#1D324B] font-bold text-lg focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all" />
        </div>
        <div className="bg-[#1D324B] rounded-[25px] p-6 flex flex-col gap-4">
          <label className="text-white text-xl">&quot;Create a password&quot;</label>
          <input type="password" placeholder="อย่างน้อย 8 ตัวอักษร มีทั้งตัวอักษรและตัวเลข..." value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white rounded-xl py-4 px-6 text-[#1D324B] font-bold text-lg focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all" />
        </div>
        {error && <p className="text-red-500 text-sm text-center font-medium -mt-2">{error}</p>}
        <div className="flex justify-between items-center mt-4">
          <button onClick={() => router.push('/login')} className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium">← กลับ</button>
          <button onClick={handleNext} disabled={loading}
            className="bg-[#1D324B] text-white flex items-center gap-3 px-8 py-3 rounded-2xl hover:bg-[#1D324B] transition-all active:scale-95 shadow-lg group disabled:opacity-60">
            <span className="font-bold text-lg">{loading ? 'กำลังตรวจสอบ...' : 'Next'}</span>
            <ArrowRightCircle className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
