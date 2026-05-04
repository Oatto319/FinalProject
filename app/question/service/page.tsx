'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, ArrowLeft } from 'lucide-react';
import Navbar from '../../navbar/page';

const ServiceQuestionnaire = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatarSeed: number } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  const questions = [
    { id: 1,  text: 'ฉันชอบพูดคุยและสร้างความสัมพันธ์กับลูกค้ามากกว่าทำงานคนเดียวอยู่เบื้องหลัง', dimension: 'EI' },
    { id: 2,  text: 'ฉันให้ความสำคัญกับรายละเอียดคำร้องของลูกค้ามากกว่าภาพรวมของปัญหา', dimension: 'SN' },
    { id: 3,  text: 'เมื่อแก้ปัญหาให้ลูกค้า ฉันใช้ขั้นตอนและกฎระเบียบมากกว่าพิจารณาความรู้สึกของเขา', dimension: 'TF' },
    { id: 4,  text: 'ฉันชอบมีแนวทางการรับมือลูกค้าที่ชัดเจนก่อนเริ่มงาน', dimension: 'JP' },
    { id: 5,  text: 'ฉันสบายใจที่จะรับสายหรือพูดคุยกับลูกค้าที่ไม่พอใจโดยตรง', dimension: 'EI_lead' },
    { id: 6,  text: 'ฉันให้ความสำคัญกับความรู้สึกของลูกค้ามากกว่าการปฏิบัติตามกฎขององค์กรอย่างเคร่งครัด', dimension: 'TF_user' },
    { id: 7,  text: 'ฉันชอบคิดหาวิธีแก้ปัญหาใหม่ๆ ให้ลูกค้ามากกว่าใช้วิธีเดิมที่เคยได้ผล', dimension: 'SN2' },
    { id: 8,  text: 'ฉันปรับตัวได้ดีเมื่อลูกค้าเปลี่ยนความต้องการกะทันหัน', dimension: 'JP2' },
    { id: 9,  text: 'การพูดคุยกับลูกค้าหลายคนต่อวันทำให้ฉันรู้สึกมีพลังงาน', dimension: 'EI2' },
    { id: 10, text: 'ฉันสามารถบอกปฏิเสธหรือแจ้งข่าวร้ายกับลูกค้าได้โดยไม่รู้สึกกังวลมาก', dimension: 'TF2' },
    { id: 11, text: 'ฉันชอบมีขั้นตอนการทำงานกับลูกค้าที่เป็นระบบและทำซ้ำได้', dimension: 'SN3' },
    { id: 12, text: 'เมื่อลูกค้าโกรธ ฉันมุ่งแก้ปัญหาเชิงข้อเท็จจริงมากกว่าประคับประคองอารมณ์', dimension: 'TF3' },
    { id: 13, text: 'ฉันชอบติดตาม case ลูกค้าให้เสร็จล่วงหน้ามากกว่าปล่อยค้างไว้จนถึง deadline', dimension: 'JP3' },
    { id: 14, text: 'ฉันชอบระดมความคิดกับทีมเพื่อปรับปรุงการบริการมากกว่าคิดคนเดียว', dimension: 'EI3' },
    { id: 15, text: 'ฉันให้ความสำคัญกับบรรยากาศทีมที่ดีมากกว่าประสิทธิภาพในการปิด case', dimension: 'TF4' },
    { id: 16, text: 'ฉันเชื่อมั่นในวิธีการให้บริการที่พิสูจน์แล้วมากกว่าลองวิธีใหม่', dimension: 'SN4' },
    { id: 17, text: 'ฉันทำงานได้ดีแม้ไม่มีคู่มือหรือขั้นตอนชัดเจน', dimension: 'JP4' },
    { id: 18, text: 'หลังจากรับมือลูกค้าหนักๆ มาทั้งวัน ฉันต้องการเวลาส่วนตัวเพื่อฟื้นพลังงาน', dimension: 'EI4' },
    { id: 19, text: 'เมื่อประเมินคุณภาพบริการ ฉันให้น้ำหนักกับตัวเลขและข้อมูลมากกว่าความพึงพอใจเชิงอารมณ์', dimension: 'TF5' },
    { id: 20, text: 'ฉันสนใจแนวโน้มและทิศทางการพัฒนาการบริการในระยะยาวมากกว่าปัญหาที่เกิดขึ้นวันนี้', dimension: 'SN5' },
  ];

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showPopup, setShowPopup] = useState(false);
  const [jobResult, setJobResult] = useState<{
    title: string;
    description: string;
    jobs: string[];
    icon: string;
    typeScores: { title: string; icon: string; score: number }[];
  } | null>(null);

  const handleSelect = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const allAnswered = questions.every((q) => answers[q.id] !== undefined);
    if (!allAnswered) { alert('กรุณาตอบให้ครบทุกข้อก่อนนะครับ'); return; }

    const pole = (val: number) => val <= 3 ? 1 : val >= 5 ? -1 : 0;
    const EI_score = pole(answers[1]) + pole(answers[5]) + pole(answers[9]) + pole(answers[14]) + (-1 * pole(answers[18]));
    const SN_score = pole(answers[2]) + (-1 * pole(answers[7])) + pole(answers[11]) + pole(answers[16]) + (-1 * pole(answers[20]));
    const TF_score = pole(answers[3]) + (-1 * pole(answers[6])) + pole(answers[10]) + pole(answers[12]) + (-1 * pole(answers[15])) + pole(answers[19]);
    const JP_score = pole(answers[4]) + (-1 * pole(answers[8])) + pole(answers[13]) + (-1 * pole(answers[17]));

    const T = TF_score >= 0, S = SN_score >= 0;

    const T_comp = Math.max(0, TF_score);
    const F_comp = Math.max(0, -TF_score);
    const S_comp = Math.max(0, SN_score);
    const N_comp = Math.max(0, -SN_score);
    const typeScores = [
      { title: 'นักสื่อสาร',    icon: '/img/make.png',   score: F_comp + N_comp },
      { title: 'นักแก้ปัญหา',  icon: '/img/brain.png',  score: T_comp + N_comp },
      { title: 'ผู้ฟัง',        icon: '/img/idea.png',   score: F_comp + S_comp },
      { title: 'ผู้ปฏิบัติการ', icon: '/img/pencil.png', score: T_comp + S_comp },
    ];

    let title: string, desc: string, jobs: string[], icon: string;
    if (!T && !S) {
      title = 'นักสื่อสาร';
      desc = 'คุณมีทักษะการสื่อสารที่โดดเด่น เข้าใจอารมณ์และความต้องการของผู้คนได้อย่างลึกซึ้ง สร้างความสัมพันธ์ที่ดีกับลูกค้าได้อย่างเป็นธรรมชาติ';
      jobs = ['Customer Success Manager', 'Account Manager', 'Sales Representative', 'PR Specialist', 'Community Manager'];
      icon = '/img/make.png';
    } else if (T && !S) {
      title = 'นักแก้ปัญหา';
      desc = 'คุณเชี่ยวชาญการวิเคราะห์ปัญหาและหาทางออกที่ตรงจุด คิดนอกกรอบเพื่อแก้ไขสถานการณ์ที่ซับซ้อน ลูกค้าไว้วางใจในความสามารถของคุณ';
      jobs = ['Technical Support Specialist', 'Customer Experience Analyst', 'Service Innovation Lead', 'Escalation Specialist'];
      icon = '/img/brain.png';
    } else if (!T && S) {
      title = 'ผู้ฟัง';
      desc = 'คุณมีความอดทนและเห็นอกเห็นใจผู้อื่นสูง รับฟังลูกค้าอย่างตั้งใจและสร้างความไว้วางใจได้ดี เป็นที่พึ่งพาของลูกค้าในยามที่ต้องการความช่วยเหลือ';
      jobs = ['Customer Support Representative', 'Help Desk Specialist', 'Care Coordinator', 'Client Relations Officer'];
      icon = '/img/idea.png';
    } else {
      title = 'ผู้ปฏิบัติการ';
      desc = 'คุณทำงานได้อย่างมีประสิทธิภาพ แม่นยำ และเชื่อถือได้ ปฏิบัติตามขั้นตอนได้อย่างดีเยี่ยม ลูกค้าและทีมพึ่งพาคุณได้เสมอ';
      jobs = ['Service Desk Analyst', 'Operations Support', 'Quality Assurance', 'Service Coordinator', 'Back Office Support'];
      icon = '/img/pencil.png';
    }

    setJobResult({ title, description: desc, jobs, icon, typeScores });
    setShowPopup(true);
  };

  const handlePopupClose = async () => {
    if (jobResult) {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const currentUser = JSON.parse(raw);
        const newTypes = {
          ...currentUser.types,
          service: {
            title: jobResult.title,
            description: jobResult.description,
            jobs: jobResult.jobs,
            icon: jobResult.icon,
            typeScores: jobResult.typeScores,
            completedAt: new Date().toISOString(),
          }
        };
        const updatedUser = { ...currentUser, types: newTypes };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        try {
          await fetch('/api/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gmail: currentUser.gmail, types: newTypes }),
          });
        } catch (e) {
          console.error('Failed to save MBTI result to DB:', e);
        }
      }
    }
    setShowPopup(false);
    router.push('/templates');
  };

  return (
    <div className="min-h-screen bg-[#E5E7EB] font-sans flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-5xl flex items-center justify-between px-4 md:px-8 mt-6 mb-6">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} strokeWidth={2.5} className="text-gray-600" />
        </button>
        <div className="bg-[#A7F3D0] px-8 py-3 rounded-2xl shadow-sm">
          <h2 className="text-[#FF4D8D] font-black italic tracking-tight uppercase">CUSTOMER / SERVICE</h2>
        </div>
      </div>

      <div className="w-full max-w-5xl bg-white rounded-[24px] shadow-xl p-8 md:p-16 flex flex-col gap-12 border-b-8 border-gray-300">
        {questions.map((q, idx) => (
          <div key={q.id} className="flex flex-col items-center gap-8">
            <h3 className="text-[#1A2E44] text-xl md:text-2xl font-black text-center leading-relaxed">"{q.text}"</h3>
            <div className="w-full flex items-center justify-between max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="text-[#22C55E] font-black text-lg md:text-xl">เห็นด้วย</span>
                <div className="w-10 h-10 rounded-full border-2 border-[#22C55E] flex items-center justify-center text-[#22C55E] bg-white"><Plus size={24} strokeWidth={4} /></div>
              </div>
              <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center px-4">
                {[1, 2, 3, 4, 5, 6, 7].map((val) => {
                  const isSelected = answers[q.id] === val;
                  const sizeClass = val === 4 ? 'w-6 h-6' : (val === 3 || val === 5) ? 'w-8 h-8' : (val === 2 || val === 6) ? 'w-10 h-10' : 'w-12 h-12';
                  const borderColor = val < 4 ? 'border-[#22C55E]' : val > 4 ? 'border-[#A7F3D0]' : 'border-gray-400';
                  return (
                    <button key={val} onClick={() => handleSelect(q.id, val)}
                      className={`${sizeClass} rounded-full border-2 transition-all duration-200 ${borderColor} ${isSelected ? (val < 4 ? 'bg-[#22C55E]' : val > 4 ? 'bg-[#A7F3D0]' : 'bg-gray-400') : 'bg-transparent'} hover:scale-110`} />
                  );
                })}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#A7F3D0] flex items-center justify-center text-[#A7F3D0] bg-white"><Minus size={24} strokeWidth={4} /></div>
                <span className="text-[#A7F3D0] font-black text-lg md:text-xl whitespace-nowrap">ไม่เห็นด้วย</span>
              </div>
            </div>
            {idx !== questions.length - 1 && <div className="w-full h-[2px] bg-gray-100 mt-4" />}
          </div>
        ))}
        <div className="flex justify-center mt-8">
          <button onClick={handleSubmit} className="bg-[#4B3E7A] text-white px-12 py-4 rounded-2xl font-black text-xl hover:bg-[#3b3161] transition-colors shadow-lg">ถัดไป</button>
        </div>
      </div>

      {showPopup && jobResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] p-8 flex flex-col items-center gap-5 shadow-2xl w-full max-w-md">
            <img src={jobResult.icon} alt={jobResult.title} className="w-24 h-24 object-contain" />
            <div className="text-center w-full">
              <h2 className="text-2xl font-black text-[#1A2E44] mb-1">เสร็จแล้ว!</h2>
              <p className="text-xs text-gray-400 font-medium mb-3">ประเภทบุคลิกภาพการทำงานของคุณ</p>
              <p className="text-2xl font-black text-[#4B3E7A] mb-3">{jobResult.title}</p>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{jobResult.description}</p>
              <div className="text-left">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">ตำแหน่งงานที่เหมาะสม</p>
                <div className="flex flex-wrap gap-2">
                  {jobResult.jobs.map((job) => (
                    <span key={job} className="bg-[#EDE9FF] text-[#4B3E7A] text-xs font-bold px-3 py-1.5 rounded-full">{job}</span>
                  ))}
                </div>
              </div>
              <div className="text-left w-full mt-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">คะแนนแต่ละประเภท</p>
                <div className="flex flex-col gap-3">
                  {jobResult.typeScores.map((t) => (
                    <div key={t.title} className="flex items-center gap-3">
                      <img src={t.icon} alt={t.title} className="w-8 h-8 object-contain flex-shrink-0" />
                      <span className="text-sm font-bold text-[#1A2E44] w-28 flex-shrink-0">{t.title}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div className="bg-[#4B3E7A] h-2.5 rounded-full transition-all duration-500" style={{ width: `${(t.score / 11) * 100}%` }} />
                      </div>
                      <span className="text-sm font-black text-[#4B3E7A] w-10 text-right flex-shrink-0">{t.score}/11</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handlePopupClose} className="w-full bg-[#4B3E7A] text-white py-4 rounded-2xl font-black text-lg hover:bg-[#3b3161] transition-colors shadow-lg">Finished</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceQuestionnaire;
