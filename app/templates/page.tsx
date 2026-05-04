'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import Navbar from '../navbar/page';

function TemplatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreateMode = searchParams.get('mode') === 'create';
  const [userTypes, setUserTypes] = useState<Record<string, unknown>>({});
  const [user, setUser] = useState<{ name: string; avatarSeed: number } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) {
      const parsed = JSON.parse(raw);
      setUser(parsed);
      setUserTypes(parsed.types ?? {});
    }
  }, []);

  const templates = [
    {
      id: 'programming',
      title: 'PROGRAMMING',
      description: 'จับกลุ่มคนทำงานสายเทคนิคที่ต้องทำงานร่วมกันจริงจัง เช่น Dev ทีมโปรเจกต์ เพื่อให้สไตล์การคิดและการแก้ปัญหาเข้ากันได้',
      bgColor: 'bg-[#FF9B9B]',
      innerColor: 'bg-[#E37A7A]',
      textColor: 'text-[#4A4E69]',
      route: '/question/programming',
    },
    {
      id: 'service',
      title: 'CUSTOMER / SERVICE',
      description: 'จับกลุ่มงานที่ต้องติดต่อสื่อสารกับผู้คน เช่น HR, Sales, Customer Service ที่ต้องใช้ทักษะความเข้าใจผู้อื่นสูง',
      bgColor: 'bg-[#76EAD7]',
      innerColor: 'bg-[#58C9B9]',
      textColor: 'text-[#FF4D8D]',
      route: '/question/service',
      comingSoon: true,
    },
    {
      id: 'presentation',
      title: 'PRESENTATION',
      description: 'จับกลุ่มงานที่ต้องสื่อสารต่อหน้าคนอื่น ต้องการคนที่กล้าแสดงออกและจัดลำดับเนื้อหาได้ดี',
      bgColor: 'bg-[#D4E24D]',
      innerColor: 'bg-[#B4C13D]',
      textColor: 'text-[#2D6A4F]',
      route: '/question/presentation',
      comingSoon: true,
    },
    {
      id: 'design',
      title: 'DESIGN / CREATIVE',
      description: 'จับกลุ่มงานที่ต้องใช้ความคิดสร้างสรรค์ เช่น ออกแบบ UI, โปสเตอร์ หรือคอนเทนต์',
      bgColor: 'bg-[#9D8BFF]',
      innerColor: 'bg-[#7B6AD4]',
      textColor: 'text-white',
      route: '/question/design',
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      <Navbar />
      {/* Main Content */}
      <main className="w-full max-w-5xl mt-8 px-4 pb-12">
        <div className="bg-white rounded-[24px] p-8 md:p-12 shadow-sm flex flex-col items-center">

          {/* --- เพิ่ม: ปุ่ม Back --- */}
          <div className="w-full flex items-center mb-6">
            <button
              onClick={() => router.push('/')}
              className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors active:scale-95">
              <ChevronLeft size={28} strokeWidth={2.5} />
            </button>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-[#2D3142] mb-10 text-center">
            "Choose Templates"
          </h1>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {templates.map((item, index) => {
              const done = !!userTypes[item.id];
              const comingSoon = !!(item as { comingSoon?: boolean }).comingSoon;
              return (
                <div
                  key={index}
                  onClick={() => {
                    if (!isCreateMode && comingSoon) return;
                    if (isCreateMode) {
                      const raw = localStorage.getItem('pendingRoom');
                      const room = raw ? JSON.parse(raw) : {};
                      localStorage.setItem('pendingRoom', JSON.stringify({
                        ...room,
                        template: item.id,
                        templateLabel: item.title,
                      }));
                      router.push('/create/createroom');
                    } else {
                      item.id === 'programming' && router.push(item.route);
                    }
                  }}
                  className={`${item.bgColor} rounded-[22px] p-6 flex flex-col items-center transition-transform duration-300 shadow-md min-h-[280px] relative ${!isCreateMode && comingSoon ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-[1.02]'}`}
                >
                  {/* Coming Soon Badge — ซ่อนใน create mode */}
                  {comingSoon && !isCreateMode && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm text-gray-600 text-xs font-black px-3 py-1.5 rounded-full shadow-sm">
                      🔒 Coming Soon
                    </div>
                  )}

                  {/* Done Badge — ซ่อนใน create mode */}
                  {done && !comingSoon && !isCreateMode && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm text-green-600 text-xs font-black px-3 py-1.5 rounded-full shadow-sm">
                      <CheckCircle2 size={14} strokeWidth={2.5} />
                      เสร็จแล้ว
                    </div>
                  )}

                  {/* Title Section */}
                  <h2 className={`text-2xl md:text-3xl font-black mb-6 tracking-wider ${item.textColor} text-center uppercase`}>
                    {item.title}
                  </h2>

                  {/* Description Box Section */}
                  <div className={`${item.innerColor} rounded-[25px] p-5 flex-grow flex items-center justify-center`}>
                    <p className="text-white text-base md:text-lg leading-relaxed text-center font-medium">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </main>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={null}>
      <TemplatesContent />
    </Suspense>
  );
}