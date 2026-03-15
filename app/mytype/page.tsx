'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, Pencil, Brain, Lightbulb, Settings } from 'lucide-react';

const MyTypePage = () => {
  const router = useRouter();
  const types = [
    {
      id: 'programming',
      title: 'PROGRAMMING',
      subtitle: 'ผู้ปฏิบัติ',
      color: 'bg-[#F8A4A4]',
      textColor: 'text-[#4B3E7A]',
      icon: <Pencil className="text-white w-10 h-10" fill="currentColor" />,
      iconBg: 'bg-[#FF5A5A]',
      features: [
        'ลงมือทำจริง ทำงานเร็ว',
        'ไม่พูดเยอะ แต่ทำได้จริง',
        'ทำงานหนักได้',
        'ชอบให้เห็นผลลัพธ์เป็นรูปธรรม'
      ]
    },
    {
      id: 'service',
      title: 'CUSTOMER / SERVICE',
      subtitle: 'นักวิเคราะห์',
      color: 'bg-[#A7F3D0]',
      textColor: 'text-[#FF4D8D]',
      icon: <Brain className="text-[#FF4D8D] w-10 h-10" fill="currentColor" />,
      iconBg: 'bg-[#4B3E7A]',
      features: [
        'คิดเป็นระบบ มีเหตุผล',
        'มองรายละเอียดรอบคอบ',
        'เก่งการวิเคราะห์ข้อมูล/ปัญหา',
        'ตัดสินใจจากหลักฐาน ไม่ใช่ความรู้สึก'
      ]
    },
    {
      id: 'presentation',
      title: 'PRESENTATION',
      subtitle: 'นักสร้างสรรค์',
      color: 'bg-[#E2F37C]',
      textColor: 'text-[#22C55E]',
      icon: <Lightbulb className="text-yellow-300 w-10 h-10" fill="currentColor" />,
      iconBg: 'bg-[#0369A1]',
      features: [
        'ชอบคิดไอเดียใหม่ ๆ',
        'คิดนอกกรอบ ชอบทดลอง',
        'เห็นความเป็นไปได้ที่คนอื่นมองไม่เห็น',
        'สามารถแก้ปัญหาแบบไม่จำกัดวิธี'
      ]
    },
    {
      id: 'design',
      title: 'DESIGN / CREATIVE',
      subtitle: 'ผู้ประสานงาน',
      color: 'bg-[#C7D2FE]',
      textColor: 'text-[#818CF8]',
      icon: <Settings className="text-white w-10 h-10" />,
      iconBg: 'bg-[#0284C7]',
      features: [
        'สื่อสารเก่ง ฟังคนอื่น',
        'ทำให้บรรยากาศในทีมดี',
        'ไกล่เกลี่ยปัญหา',
        'ช่วยให้เพื่อนทำงานร่วมกันได้ง่ายขึ้น'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#E5E7EB] p-4 md:p-8 font-sans flex flex-col items-center">
      {/* Top Bar */}
      <div className="w-full max-w-6xl flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Wimolchai"
            alt="User Profile"
            className="w-full h-full bg-yellow-100"
          />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-sm">Wimolchai</h3>
          <p className="text-xs text-gray-400">นักเรียน</p>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-6xl bg-white rounded-[40px] shadow-xl overflow-hidden flex flex-col relative border-b-8 border-gray-300">

        {/* Header Label */}
        <div className="flex justify-between items-center p-6 pb-0">
          <div className="bg-[#A7F3D0] px-10 py-3 rounded-tl-3xl rounded-br-3xl shadow-sm">
            <h1 className="text-[#4B3E7A] text-4xl font-black italic tracking-tighter">MY TYPE</h1>
          </div>
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full border-2 border-gray-800 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X size={24} strokeWidth={3} className="text-gray-800" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {types.map((item) => (
            <div key={item.id} className="flex flex-col rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
              {/* Type Title Header */}
              <div className={`${item.color} py-3 px-6 text-center`}>
                <h2 className={`${item.textColor} text-xl font-black tracking-tight uppercase`}>
                  {item.title}
                </h2>
              </div>

              {/* Type Details Body */}
              <div className="bg-white p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                  <div className={`w-24 h-24 rounded-full ${item.iconBg} flex items-center justify-center shadow-lg`}>
                    {item.icon}
                  </div>
                  <p className="font-bold text-gray-600 text-sm">{item.subtitle}</p>
                </div>

                <div className="flex-1">
                  <h4 className="font-bold text-gray-700 mb-2">ลักษณะเด่น:</h4>
                  <ul className="space-y-1">
                    {item.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 font-medium">
                        <span className="text-gray-400 mt-1.5">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyTypePage;