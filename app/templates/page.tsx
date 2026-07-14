'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import Navbar from '../navbar/page';

// Mobile swipeable-stack tuning
const STACK_VISIBLE_DEPTH = 3;
const STACK_OFFSET_Y = 16;
const STACK_SCALE_STEP = 0.05;
const SWIPE_THRESHOLD = 60;
const TAP_MOVE_TOLERANCE = 6;

function TemplatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreateMode = searchParams.get('mode') === 'create';
  const [userTypes, setUserTypes] = useState<Record<string, unknown>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragXRef = useRef(0);
  const movedRef = useRef(false);

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
      shadowColor: 'rgba(79,67,123,0.4)',
      route: '/question/programming',
    },
    {
      id: 'service',
      title: 'CUSTOMER / SERVICE',
      description: 'จับกลุ่มงานที่ต้องติดต่อสื่อสารกับผู้คน เช่น HR, Sales, Customer Service ที่ต้องใช้ทักษะความเข้าใจผู้อื่นสูง',
      bgColor: 'bg-[#71EFB8]',
      innerColor: 'bg-[#5CC095]',
      textColor: 'text-[#FF4573]',
      shadowColor: 'rgba(255,69,115,0.4)',
      route: '/question/service',
    },
    {
      id: 'presentation',
      title: 'PRESENTATION',
      description: 'จับกลุ่มงานที่ต้องสื่อสารต่อหน้าคนอื่น ต้องการคนที่กล้าแสดงออกและจัดลำดับเนื้อหาได้ดี',
      bgColor: 'bg-[#EAFF48]',
      innerColor: 'bg-[#B2C334]',
      textColor: 'text-[#21871C]',
      shadowColor: 'rgba(33,135,28,0.4)',
      route: '/question/presentation',
    },
    {
      id: 'design',
      title: 'DESIGN / CREATIVE',
      description: 'จับกลุ่มงานที่ต้องใช้ความคิดสร้างสรรค์ เช่น ออกแบบ UI, โปสเตอร์ หรือคอนเทนต์',
      bgColor: 'bg-[#8C71EF]',
      innerColor: 'bg-[#6D58B9]',
      textColor: 'text-white',
      shadowColor: 'rgba(109,88,185,0.5)',
      route: '/question/design',
    },
  ];

  type Template = (typeof templates)[number];

  const selectTemplate = (item: Template) => {
    const comingSoon = !!(item as { comingSoon?: boolean }).comingSoon;
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
      router.push(item.route);
    }
  };

  const handleStackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragXRef.current = 0;
    movedRef.current = false;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleStackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const delta = e.clientX - dragStartXRef.current;
    dragXRef.current = delta;
    if (Math.abs(delta) > TAP_MOVE_TOLERANCE) movedRef.current = true;
    setDragX(delta);
  };

  const handleStackPointerEnd = (item: Template) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    setDragX(0);
    if (!movedRef.current) {
      selectTemplate(item);
      return;
    }
    const delta = dragXRef.current;
    if (delta <= -SWIPE_THRESHOLD) {
      // swiped card loops to the back of the stack instead of disappearing
      setActiveIndex((idx) => (idx + 1) % templates.length);
    } else if (delta >= SWIPE_THRESHOLD) {
      setActiveIndex((idx) => (idx - 1 + templates.length) % templates.length);
    }
  };

  const renderCardBody = (item: Template, done: boolean, comingSoon: boolean) => (
    <>
      {comingSoon && !isCreateMode && (
        <div className="absolute top-3 right-3 bg-black/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-widest uppercase">
          Soon
        </div>
      )}

      {done && !comingSoon && !isCreateMode && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 text-green-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
          <CheckCircle2 size={11} strokeWidth={2.5} />
          Done
        </div>
      )}

      {/* Title Section */}
      <h2 className={`text-xl sm:text-2xl md:text-3xl font-black mt-4 mb-3 tracking-wider ${item.textColor} text-center uppercase`}
        style={{ textShadow: `0 3px 0 ${item.shadowColor}` }}>
        {item.title}
      </h2>

      {/* Description Box Section */}
      <div className={`${item.innerColor} rounded-[22px] p-4 mx-2 mb-0 mt-5 flex-grow w-full flex items-center justify-center`}>
        <p className="text-white text-base md:text-lg leading-relaxed text-center font-medium">
          {item.description}
        </p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      <Navbar />
      {/* Main Content */}
      <main className="w-full max-w-5xl mt-4 px-4 pb-12">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-3">

        <div className="order-1 md:order-2 w-full md:flex-1 bg-white rounded-[24px] px-4 pt-3 pb-6 sm:px-8 md:px-10 sm:pb-8 md:pb-10 shadow-sm flex flex-col items-center">

          <p className="text-sm text-[#2D3142] mb-0 text-center" style={{ fontFamily: 'var(--font-geologica)' }}>
            &ldquo;Choose Templates&rdquo;
          </p>

          {/* Templates — desktop/tablet grid */}
          <div className="hidden md:grid md:grid-cols-2 gap-6 md:gap-8 w-full mt-6">
            {templates.map((item) => {
              const done = !!userTypes[item.id];
              const comingSoon = !!(item as { comingSoon?: boolean }).comingSoon;
              return (
                <div
                  key={item.id}
                  onClick={() => selectTemplate(item)}
                  className={`${item.bgColor} rounded-[22px] p-2 flex flex-col items-center transition-transform duration-300 shadow-md min-h-[280px] relative md:mx-6 ${!isCreateMode && comingSoon ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-[1.02]'}`}
                >
                  {renderCardBody(item, done, comingSoon)}
                </div>
              );
            })}
          </div>

          {/* Templates — mobile swipeable stack */}
          <div className="md:hidden w-full mt-6">
            <div className="relative h-[400px]" style={{ touchAction: 'none' }}>
              {templates.map((item, index) => {
                const done = !!userTypes[item.id];
                const comingSoon = !!(item as { comingSoon?: boolean }).comingSoon;
                // circular position relative to the front card — a swiped-away card
                // loops around to the back of the stack instead of disappearing
                const i = ((index - activeIndex) % templates.length + templates.length) % templates.length;
                const isFront = i === 0;
                const hiddenBehind = i > STACK_VISIBLE_DEPTH;
                const clampedI = Math.min(i, STACK_VISIBLE_DEPTH);
                const translateY = clampedI * STACK_OFFSET_Y;
                const translateX = isFront ? dragX : 0;
                const scale = 1 - clampedI * STACK_SCALE_STEP;
                const opacity = hiddenBehind ? 0 : 1;
                return (
                  <div
                    key={item.id}
                    onPointerDown={isFront ? handleStackPointerDown : undefined}
                    onPointerMove={isFront ? handleStackPointerMove : undefined}
                    onPointerUp={isFront ? () => handleStackPointerEnd(item) : undefined}
                    onPointerCancel={isFront ? () => handleStackPointerEnd(item) : undefined}
                    className={`${item.bgColor} absolute inset-x-0 top-0 rounded-[22px] p-2 flex flex-col items-center shadow-md min-h-[280px] ${
                      isFront ? (isDragging ? '' : 'transition-transform duration-300 ease-out') : 'transition-all duration-300 ease-out'
                    } ${isFront ? (!isCreateMode && comingSoon ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing') : 'pointer-events-none'}`}
                    style={{ transform: `translateY(${translateY}px) translateX(${translateX}px) scale(${scale})`, zIndex: templates.length - clampedI, opacity }}
                  >
                    {renderCardBody(item, done, comingSoon)}
                  </div>
                );
              })}
            </div>
            <div className="relative flex items-center justify-center mt-4">
              <button
                onClick={() => router.push('/')}
                className="absolute left-6 w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 active:scale-95 transition-all">
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>
              <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                <ArrowLeftRight size={12} strokeWidth={2.5} />
                Swipe to choose
              </span>
            </div>
            <div className="flex justify-center gap-1.5 mt-2">
              {templates.map((item, idx) => (
                <span
                  key={item.id}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === activeIndex ? 'bg-[#2D3142]' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </div>

        </div>

          <button
            onClick={() => router.push('/')}
            className="order-2 md:order-1 flex-shrink-0 md:mt-2 w-12 h-12 bg-gray-200 rounded-full hidden md:flex items-center justify-center text-gray-500 shadow-[0_5px_0_0_#d1d5db] hover:shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] transition-all">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
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