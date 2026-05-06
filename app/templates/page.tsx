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

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) {
      const parsed = JSON.parse(raw);
      setUserTypes(parsed.types ?? {});
    }
  }, []);

  const templates = [
    {
      id: 'programming',
      title: 'PROGRAMMING',
      description: 'จับกลุ่มคนทำงานสายเทคนิคที่ต้องทำงานร่วมกันจริงจัง เช่น Dev ทีมโปรเจกต์ เพื่อให้สไตล์การคิดและการแก้ปัญหาเข้ากันได้',
      bgColor: 'bg-[#FFAAAA]',
      innerColor: 'bg-[#D87878]',
      textColor: 'text-[#4F437B]',
      route: '/question/programming',
    },
    {
      id: 'service',
      title: 'CUSTOMER / SERVICE',
      description: 'จับกลุ่มงานที่ต้องติดต่อสื่อสารกับผู้คน เช่น HR, Sales, Customer Service ที่ต้องใช้ทักษะความเข้าใจผู้อื่นสูง',
      bgColor: 'bg-[#71EFB8]',
      innerColor: 'bg-[#5CC095]',
      textColor: 'text-[#FF4573]',
      route: '/question/service',
      comingSoon: true,
    },
    {
      id: 'presentation',
      title: 'PRESENTATION',
      description: 'จับกลุ่มงานที่ต้องสื่อสารต่อหน้าคนอื่น ต้องการคนที่กล้าแสดงออกและจัดลำดับเนื้อหาได้ดี',
      bgColor: 'bg-[#EAFF48]',
      innerColor: 'bg-[#B2C334]',
      textColor: 'text-[#21871C]',
      route: '/question/presentation',
      comingSoon: true,
    },
    {
      id: 'design',
      title: 'DESIGN / CREATIVE',
      description: 'จับกลุ่มงานที่ต้องใช้ความคิดสร้างสรรค์ เช่น ออกแบบ UI, โปสเตอร์ หรือคอนเทนต์',
      bgColor: 'bg-[#8C71EF]',
      innerColor: 'bg-[#6D58B9]',
      textColor: 'text-white',
      route: '/question/design',
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      <Navbar />
      {/* Main Content */}
      <main className="w-full max-w-5xl mt-4 px-4 pb-12">
        <div className="flex items-start gap-3">

          <button
            onClick={() => router.push('/')}
            className="mt-2 flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>

        <div className="flex-1 bg-white rounded-[24px] px-8 pt-3 pb-8 md:px-10 md:pt-3 md:pb-10 shadow-sm flex flex-col items-center">

          <p className="text-sm font-bold text-[#2D3142] mb-0 text-center">
            &ldquo;Choose Templates&rdquo;
          </p>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-6">
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
                  className={`${item.bgColor} rounded-[22px] p-2 flex flex-col items-center transition-transform duration-300 shadow-md min-h-[280px] relative mx-6 ${!isCreateMode && comingSoon ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-[1.02]'}`}
                >
                  {/* Coming Soon Badge */}
                  {comingSoon && !isCreateMode && (
                    <div className="absolute top-3 right-3 bg-black/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-widest uppercase">
                      Soon
                    </div>
                  )}

                  {/* Done Badge */}
                  {done && !comingSoon && !isCreateMode && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 text-green-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      <CheckCircle2 size={11} strokeWidth={2.5} />
                      Done
                    </div>
                  )}

                  {/* Title Section */}
                  <h2 className={`text-2xl md:text-3xl font-black mt-4 mb-3 tracking-wider ${item.textColor} text-center uppercase`}>
                    {item.title}
                  </h2>

                  {/* Description Box Section */}
                  <div className={`${item.innerColor} rounded-[22px] p-4 mx-2 mb-0 mt-5 flex-grow w-full flex items-center justify-center`}>
                    <p className="text-white text-base md:text-lg leading-relaxed text-center font-medium">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

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