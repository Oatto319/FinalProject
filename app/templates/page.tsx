'use client';

import React from 'react';
import { LucideMessageCircle } from 'lucide-react';

export default function TemplatesPage() {
  const templates = [
    {
      title: 'PROGRAMMING',
      description: 'จับกลุ่มคนทำงานสายเทคนิคที่ต้องทำงานร่วมกันจริงจัง เช่น Dev ทีมโปรเจกต์ เพื่อให้สไตล์การคิดและการแก้ปัญหาเข้ากันได้',
      bgColor: 'bg-[#FF9B9B]', // สีชมพูอ่อน
      innerColor: 'bg-[#E37A7A]', // สีชมพูเข้มด้านใน
      textColor: 'text-[#4A4E69]'
    },
    {
      title: 'CUSTOMER / SERVICE',
      description: 'จับกลุ่มงานที่ต้องติดต่อสื่อสารกับผู้คน เช่น HR, Sales, Customer Service ที่ต้องใช้ทักษะความเข้าใจผู้อื่นสูง',
      bgColor: 'bg-[#76EAD7]', // สีเขียวมินต์
      innerColor: 'bg-[#58C9B9]', // สีเขียวเข้มด้านใน
      textColor: 'text-[#FF4D8D]' // สีชมพูเข้มสำหรับหัวข้อ
    },
    {
      title: 'PRESENTATION',
      description: 'จับกลุ่มงานที่ต้องสื่อสารต่อหน้าคนอื่น ต้องการคนที่กล้าแสดงออกและจัดลำดับเนื้อหาได้ดี',
      bgColor: 'bg-[#D4E24D]', // สีเขียวตองอ่อน
      innerColor: 'bg-[#B4C13D]', // สีเขียวเข้มด้านใน
      textColor: 'text-[#2D6A4F]'
    },
    {
      title: 'DESIGN / CREATIVE',
      description: 'จับกลุ่มงานที่ต้องใช้ความคิดสร้างสรรค์ เช่น ออกแบบ UI, โปสเตอร์ หรือคอนเทนต์',
      bgColor: 'bg-[#9D8BFF]', // สีม่วงอ่อน
      innerColor: 'bg-[#7B6AD4]', // สีม่วงเข้มด้านใน
      textColor: 'text-white'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col items-center">
      {/* Header Section - ปรับให้ชนขอบจอสุด (Full Width) */}
      <header className="w-full flex items-center justify-between bg-white p-6 shadow-sm">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-orange-100 border-2 border-orange-200">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Wimolchai" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-bold text-2xl text-gray-800 leading-tight">Wimolchai</h2>
              <p className="text-sm text-gray-500 font-medium">นักเรียน</p>
            </div>
          </div>
          <button className="bg-green-500 p-4 rounded-full text-white shadow-lg hover:scale-105 transition-transform active:scale-95">
            <LucideMessageCircle fill="currentColor" size={32} />
          </button>
        </div>
      </header>

      {/* Main Content - เลื่อนระยะลงมาจาก App Bar ด้วย mt-8 */}
      <main className="w-full max-w-5xl mt-8 px-4 pb-12">
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm flex flex-col items-center">
          
          <h1 className="text-2xl md:text-3xl font-bold text-[#2D3142] mb-10 text-center">
            “Choose Templates”
          </h1>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {templates.map((item, index) => (
              <div 
                key={index} 
                className={`${item.bgColor} rounded-[35px] p-6 flex flex-col items-center cursor-pointer hover:scale-[1.02] transition-transform duration-300 shadow-md min-h-[280px]`}
              >
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
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}