'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'programming',
    label: 'PROGRAMMING',
    description: 'สำหรับทีมพัฒนาซอฟต์แวร์ วิเคราะห์ระบบ และงานสายเทคนิค',
    bgColor: 'bg-[#FF9B9B]',
    textColor: 'text-[#4A4E69]',
    types: [
      { label: 'นักวิเคราะห์',    icon: '/img/brain.png' },
      { label: 'นักคิดสร้างสรรค์', icon: '/img/idea.png' },
      { label: 'ผู้ปฏิบัติการ',    icon: '/img/pencil.png' },
      { label: 'นักประสานงาน',     icon: '/img/make.png' },
    ],
  },
  {
    id: 'service',
    label: 'CUSTOMER / SERVICE',
    description: 'สำหรับทีมที่ต้องติดต่อสื่อสารและให้บริการลูกค้า',
    bgColor: 'bg-[#76EAD7]',
    textColor: 'text-[#FF4D8D]',
    types: [
      { label: 'นักสื่อสาร',   icon: '/img/make.png' },
      { label: 'นักแก้ปัญหา',  icon: '/img/brain.png' },
      { label: 'ผู้ฟัง',       icon: '/img/idea.png' },
      { label: 'ผู้ปฏิบัติการ', icon: '/img/pencil.png' },
    ],
  },
  {
    id: 'presentation',
    label: 'PRESENTATION',
    description: 'สำหรับทีมนำเสนองาน สื่อสารและโน้มน้าวผู้ฟัง',
    bgColor: 'bg-[#D4E24D]',
    textColor: 'text-[#2D6A4F]',
    types: [
      { label: 'นักพูด',        icon: '/img/idea.png' },
      { label: 'นักวิจัย',      icon: '/img/brain.png' },
      { label: 'นักออกแบบ',     icon: '/img/pencil.png' },
      { label: 'ผู้ประสานงาน',  icon: '/img/make.png' },
    ],
  },
  {
    id: 'design',
    label: 'DESIGN / CREATIVE',
    description: 'สำหรับทีมออกแบบ UI/UX คอนเทนต์ และงานสร้างสรรค์',
    bgColor: 'bg-[#9D8BFF]',
    textColor: 'text-white',
    types: [
      { label: 'นักสร้างสรรค์', icon: '/img/idea.png' },
      { label: 'นักวิเคราะห์',  icon: '/img/brain.png' },
      { label: 'ผู้ปฏิบัติ',    icon: '/img/pencil.png' },
      { label: 'ผู้ประสานงาน',  icon: '/img/make.png' },
    ],
  },
];

export default function SelectTemplatesPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedTemplate = TEMPLATES.find((t) => t.id === selected);

  const handleConfirm = () => {
    if (!selected) return;
    const raw = localStorage.getItem('pendingRoom');
    const room = raw ? JSON.parse(raw) : {};
    const template = TEMPLATES.find((t) => t.id === selected)!;
    localStorage.setItem('pendingRoom', JSON.stringify({
      ...room,
      template: selected,
      templateLabel: template.label,
      templateTypes: template.types.map((t) => t.label),
    }));

    // อัปเดต currentRoom ให้มี template ด้วย
    const currentRaw = localStorage.getItem('currentRoom');
    if (currentRaw) {
      const currentRoom = JSON.parse(currentRaw);
      currentRoom.template = template.label;
      localStorage.setItem('currentRoom', JSON.stringify(currentRoom));
      // อัปเดตใน rooms registry ด้วย
      const roomsRaw = localStorage.getItem('rooms');
      if (roomsRaw) {
        const rooms = JSON.parse(roomsRaw);
        if (rooms[currentRoom.id]) {
          rooms[currentRoom.id].template = template.label;
          localStorage.setItem('rooms', JSON.stringify(rooms));
        }
      }
    }

    router.push('/create/createroom');
  };

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      <main className="w-full max-w-5xl mt-8 px-4 pb-12">
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm flex flex-col items-center min-h-[600px] relative">

          {/* Back */}
          <button
            onClick={() => router.back()}
            className="absolute left-8 top-8 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-all active:scale-90"
          >
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>

          {/* Title */}
          <div className="text-center mt-4 mb-10">
            <h1 className="text-[#2D3E50] text-3xl font-black italic mb-2 tracking-wide uppercase">
              &ldquo;Select Template&rdquo;
            </h1>
            <p className="text-gray-500 font-bold">เลือก template ที่ใช้ในการวิเคราะห์และจับคู่ทีม</p>
          </div>

          {/* Templates Grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setSelected(tmpl.id)}
                className={`
                  rounded-[28px] p-6 flex flex-col gap-4 text-left shadow-md
                  transition-all duration-200 border-4 relative
                  ${tmpl.bgColor}
                  ${selected === tmpl.id
                    ? 'border-[#2D3E50] scale-[1.02] shadow-xl'
                    : 'border-transparent hover:border-gray-300'}
                `}
              >
                {selected === tmpl.id && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 size={24} className="text-[#2D3E50]" fill="#2D3E50" color="white" />
                  </div>
                )}

                <h2 className={`text-2xl font-black italic tracking-tight ${tmpl.textColor}`}>
                  {tmpl.label}
                </h2>
                <p className={`text-sm font-medium leading-relaxed ${tmpl.textColor} opacity-80`}>
                  {tmpl.description}
                </p>

                {/* Types */}
                <div className="flex gap-3 mt-1 flex-wrap">
                  {tmpl.types.map((type) => (
                    <div key={type.label} className="flex items-center gap-1.5 bg-white/50 rounded-full px-3 py-1">
                      <img src={type.icon} alt={type.label} className="w-4 h-4 object-contain" />
                      <span className="text-[11px] font-bold text-[#2D3E50]">{type.label}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Confirm */}
          <div className="w-full flex justify-center">
            <button
              disabled={!selected}
              onClick={handleConfirm}
              className={`
                w-full max-w-sm py-5 rounded-[25px] font-black text-2xl transition-all transform uppercase tracking-widest
                ${selected
                  ? 'bg-[#2D3E50] text-white shadow-[0_8px_0_0_#1E293B] hover:shadow-[0_4px_0_0_#1E293B] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              {selected ? `เลือก ${selectedTemplate?.label}` : 'เลือก Template'}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
