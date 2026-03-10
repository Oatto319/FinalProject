import React from 'react';
import { Brain, Settings, Lightbulb } from 'lucide-react';

// กำหนด Interface สำหรับข้อมูลสมาชิก
interface Member {
  name: string;
  role: string;
  isLeader: boolean;
  type: 'brain' | 'settings' | 'lightbulb';
}

// กำหนด Interface สำหรับข้อมูลกลุ่ม
interface Group {
  name: string;
  color: string;
  members: Member[];
}

const GroupResultPage = () => {
  const groups: Group[] = [
    {
      name: 'J.O.D',
      color: 'bg-orange-400',
      members: [
        { name: 'ชีวาน นาวาริน', role: 'นักเรียน', isLeader: true, type: 'brain' },
        { name: 'เรน โชติกาญจน์', role: 'นักเรียน', isLeader: false, type: 'settings' },
        { name: 'Wimolchai', role: 'นักเรียน', isLeader: false, type: 'lightbulb' },
      ],
    },
    {
      name: 'สามประสาน',
      color: 'bg-blue-600',
      members: [
        { name: 'Thanaphon', role: 'นักเรียน', isLeader: true, type: 'brain' },
        { name: 'Pathiphat', role: 'นักเรียน', isLeader: false, type: 'settings' },
        { name: 'Wimolchai', role: 'นักเรียน', isLeader: false, type: 'lightbulb' },
      ],
    },
  ];

  // แก้ไข Error โดยการระบุ type ให้กับพารามิเตอร์
  const renderTypeIcon = (type: Member['type']) => {
    switch (type) {
      case 'brain':
        return (
          <div className="w-8 h-8 rounded-full bg-[#4B3E7A] flex items-center justify-center text-pink-500">
            <Brain size={16} fill="currentColor" />
          </div>
        );
      case 'settings':
        return (
          <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white">
            <Settings size={16} />
          </div>
        );
      case 'lightbulb':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-yellow-300">
            <Lightbulb size={16} fill="currentColor" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#E5E7EB] p-4 md:p-8 font-sans flex flex-col items-center">
      {/* Top Bar */}
      <div className="w-full max-w-6xl flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Simon" alt="Host" className="w-full h-full bg-sky-300" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-sm">Simon14</h3>
          <p className="text-xs text-gray-400">อาจารย์</p>
        </div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Info & Notifications */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Programming Title Card */}
          <div className="bg-[#F8A4A4] rounded-[32px] p-8 flex items-center justify-center shadow-sm">
            <h1 className="text-[#4B3E7A] text-4xl font-black italic tracking-tighter uppercase">
              PROGRAMMING
            </h1>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="font-bold text-gray-700">จับกลุ่มวิชา Ai</p>
                <p className="text-sm text-gray-500">กำหนดส่ง 12 พ.ย. นี้</p>
                <p className="text-sm text-gray-500 italic">จำนวน 30 คน กลุ่มละ 3 คน</p>
              </div>
              <div className="text-right space-y-2">
                <p className="font-bold text-[#4B3E7A]">ID: 8993633</p>
                <div className="flex flex-col items-end">
                  <p className="text-xs text-gray-400">เข้าร่วมแล้ว:</p>
                  <p className="text-lg font-black text-gray-700">29/30</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Card */}
          <div className="bg-white rounded-[32px] p-12 shadow-sm flex items-center justify-center flex-1 min-h-[200px]">
            <p className="text-gray-400 font-medium">ไม่มีการแจ้งเตือนใหม่</p>
          </div>
        </div>

        {/* Right Column: Groups List */}
        <div className="lg:col-span-7 bg-white rounded-[40px] p-6 shadow-sm overflow-hidden flex flex-col gap-8">
          {groups.map((group, idx) => (
            <div key={idx} className="flex flex-col">
              {/* Group Header Label */}
              <div className={`inline-block self-start ${group.color} text-white px-8 py-2 rounded-t-2xl rounded-br-2xl font-black text-xl italic tracking-wider mb-2 ml-2 shadow-sm`}>
                {group.name}
              </div>
              
              {/* Group Members Container */}
              <div className="bg-gray-100/50 border-2 border-gray-100 rounded-[32px] p-4 flex flex-col gap-3">
                {group.members.map((member, mIdx) => (
                  <div key={mIdx} className="bg-white rounded-2xl p-3 flex items-center justify-between shadow-sm border-2 border-transparent hover:border-yellow-400 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-yellow-100 border border-gray-100">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} alt={member.name} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-700 text-sm leading-tight">{member.name}</h4>
                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{member.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {member.isLeader && (
                        <div className="text-yellow-400 drop-shadow-sm">
                          <span className="text-2xl" role="img" aria-label="leader">👑</span>
                        </div>
                      )}
                      {renderTypeIcon(member.type)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default GroupResultPage;