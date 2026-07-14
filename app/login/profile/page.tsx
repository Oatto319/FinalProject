'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { ChevronLeft, Upload } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import AvatarCropModal from './AvatarCropModal';

const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024; // 5MB raw upload limit, before cropping

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function ProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromEdit = searchParams.get('from') === 'edit';
  const [selectedAvatar, setSelectedAvatar] = useState(7);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [useCustom, setUseCustom] = useState(false);
  const [importError, setImportError] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatars = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    url: `/img/p${i + 1}.PNG`,
  }));

  useEffect(() => {
    if (fromEdit) {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const u = JSON.parse(raw);
        if (u.avatarImage) { setCustomImage(u.avatarImage); setUseCustom(true); }
        else if (u.avatarSeed) setSelectedAvatar(u.avatarSeed);
      }
    }
  }, [fromEdit]);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportError('');
    if (!file.type.startsWith('image/')) { setImportError('กรุณาเลือกไฟล์รูปภาพ'); return; }
    if (file.size > MAX_IMPORT_FILE_BYTES) { setImportError('ไฟล์ใหญ่เกินไป (จำกัด 5MB)'); return; }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCropSrc(dataUrl);
    } catch {
      setImportError('เปิดไฟล์ไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  const handleCropApply = (dataUrl: string) => {
    setCustomImage(dataUrl);
    setUseCustom(true);
    setCropSrc(null);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const avatarImage = useCustom ? customImage : null;

      if (fromEdit) {
        const raw = localStorage.getItem('currentUser');
        if (!raw) { router.replace('/login'); return; }
        const currentUser = JSON.parse(raw);
        const updated = { ...currentUser, avatarSeed: selectedAvatar, avatarImage };

        await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gmail: currentUser.gmail, avatarSeed: selectedAvatar, avatarImage }),
        });

        localStorage.setItem('currentUser', JSON.stringify(updated));
        router.back();
        return;
      }

      const pendingRaw = localStorage.getItem('pendingRegistration');
      if (!pendingRaw) { router.push('/login/register'); return; }

      const pending = JSON.parse(pendingRaw);
      const newUser = { ...pending, avatarSeed: selectedAvatar, avatarImage };

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
      <div className="bg-white w-full max-w-[900px] rounded-[24px] p-4 sm:p-8 md:p-12 shadow-sm border border-gray-100">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 md:gap-6 justify-items-center">
          {customImage && (
            <div onClick={() => setUseCustom(true)}
              className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 ${useCustom ? 'scale-105' : 'grayscale-[20%] hover:grayscale-0'}`}>
              <div className={`w-full h-full rounded-full overflow-hidden transition-all ${useCustom ? 'ring-4 ring-blue-500 shadow-lg' : ''}`}>
                <img src={customImage} alt="รูปของคุณ" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
          {avatars.map((avatar) => (
            <div key={avatar.id} onClick={() => { setUseCustom(false); setSelectedAvatar(avatar.id); }}
              className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 ${!useCustom && selectedAvatar === avatar.id ? 'scale-105' : 'grayscale-[20%] hover:grayscale-0'}`}>
              <div className={`w-full h-full rounded-full overflow-hidden transition-all ${!useCustom && selectedAvatar === avatar.id ? 'ring-4 ring-blue-500 shadow-lg' : ''}`}>
                <img src={avatar.url} alt={`Avatar ${avatar.id}`} className="w-full h-full object-cover" />
              </div>
            </div>
          ))}
        </div>
        {importError && <p className="text-red-500 text-sm text-center font-medium mt-4">{importError}</p>}
        <div className="flex flex-wrap gap-3 justify-between items-center mt-8 sm:mt-12">
          <button onClick={() => router.back()} className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 transition-all active:scale-95">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <button onClick={handleImportClick} type="button"
              className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-[20px] font-bold text-sm sm:text-lg bg-white text-[#2D3E50] border-2 border-[#2D3E50] transition-all hover:bg-gray-50 active:scale-95">
              <Upload size={20} strokeWidth={2.5} />
              Import
            </button>
            <button onClick={handleConfirm} disabled={loading}
              className={`px-6 sm:px-12 py-3 sm:py-4 rounded-[20px] font-bold text-base sm:text-xl transition-all ${loading ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-[0_8px_0_0_#b0b0b0]' : 'bg-[#2D3E50] text-white shadow-[0_8px_0_0_#111c27] hover:shadow-[0_4px_0_0_#111c27] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px]'}`}>
              {loading ? 'กำลังบันทึก...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>

      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onCancel={() => setCropSrc(null)}
          onApply={handleCropApply}
        />
      )}
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
