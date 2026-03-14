'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Settings, Lightbulb, X } from 'lucide-react';

interface Member {
  name: string;
  role: string;
  isLeader: boolean;
  type: 'brain' | 'settings' | 'lightbulb';
}

interface Group {
  name: string;
  color: string;
  members: Member[];
}

interface TransferRequest {
  id: number;
  name: string;
  swapWith: string;
  fromGroup: string;
  toGroup: string;
  reason?: string;
}

const GroupResultPage = () => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<TransferRequest | null>(null);

  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([
    { id: 1, name: 'เรน โชติกาญจน์', swapWith: 'Pathiphat', fromGroup: 'J.O.D', toGroup: 'สามประสาน', reason: 'เพื่อนสนิทอยู่กลุ่มนั้นครับ' },
  ]);

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

  const handleOpen = (req: TransferRequest) => {
    setSelectedReq(req);
    setShowModal(true);
  };

  const handleRequest = (id: number, action: 'approve' | 'reject') => {
    setTransferRequests(prev => prev.filter(r => r.id !== id));
    setShowModal(false);
    setSelectedReq(null);
  };

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

        {/* Left Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Programming Title Card */}
          <div className="bg-[#F8A4A4] rounded-[32px] p-8 flex items-center justify-center shadow-sm">
            <h1 className="text-[#4B3E7A] text-4xl font-black italic tracking-tighter uppercase">
              PROGRAMMING
            </h1>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm">
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
          <div className="bg-white rounded-[32px] p-6 shadow-sm flex flex-col gap-3 flex-1 min-h-[200px]">
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-700 text-sm">การแจ้งเตือน</p>
              {transferRequests.length > 0 && (
                <span className="w-5 h-5 bg-rose-500 text-white text-xs font-black rounded-full flex items-center justify-center">
                  {transferRequests.length}
                </span>
              )}
            </div>

            {transferRequests.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400 font-medium">ไม่มีการแจ้งเตือนใหม่</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {transferRequests.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => handleOpen(req)}
                    className="w-full bg-gray-50 rounded-2xl border border-gray-100 p-3 flex items-center gap-3 hover:bg-gray-100 transition-all text-left"
                  >
                    {/* Avatar ซ้อนกัน */}
                    <div className="relative w-12 h-9 flex-shrink-0">
                      <div className="absolute left-0 top-0 w-9 h-9 rounded-full overflow-hidden bg-yellow-100 border-2 border-white">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${req.name}`} alt={req.name} />
                      </div>
                      <div className="absolute left-4 top-0 w-9 h-9 rounded-full overflow-hidden bg-yellow-100 border-2 border-white">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${req.swapWith}`} alt={req.swapWith} />
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="font-bold text-gray-700 text-sm leading-tight">
                        {req.name} & {req.swapWith}
                      </p>
                      <p className="text-xs text-gray-400">
                        ต้องการสลับกลุ่ม{' '}
                        <span className="text-orange-400 font-bold">{req.fromGroup}</span>
                        {' ⇄ '}
                        <span className="text-blue-500 font-bold">{req.toGroup}</span>
                      </p>
                    </div>

                    <div className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0"></div>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Groups List */}
        <div className="lg:col-span-7 bg-white rounded-[40px] p-6 shadow-sm overflow-hidden flex flex-col gap-8">
          {groups.map((group, idx) => (
            <div key={idx} className="flex flex-col">
              <div className={`inline-block self-start ${group.color} text-white px-8 py-2 rounded-t-2xl rounded-br-2xl font-black text-xl italic tracking-wider mb-2 ml-2 shadow-sm`}>
                {group.name}
              </div>
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
                        <span className="text-2xl" role="img" aria-label="leader">👑</span>
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

      {/* Modal */}
      {showModal && selectedReq && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden">

            {/* Header สีแดง */}
            <div className="bg-rose-500 px-6 py-4 flex items-center justify-between">
              <h2 className="font-black text-xl text-white">คำร้องขอย้ายกลุ่ม</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">

              {/* คนที่ 1 */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-yellow-100 flex-shrink-0">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedReq.name}`} alt={selectedReq.name} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-700 text-sm">{selectedReq.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase">นักเรียน</p>
                </div>
                <div className="bg-orange-400 text-white font-black text-sm px-4 py-1.5 rounded-xl">
                  {selectedReq.fromGroup}
                </div>
                <div className="w-9 h-9 bg-sky-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <Settings size={18} />
                </div>
              </div>

              {/* คนที่ 2 */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-yellow-100 flex-shrink-0">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedReq.swapWith}`} alt={selectedReq.swapWith} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-700 text-sm">{selectedReq.swapWith}</p>
                  <p className="text-[10px] text-gray-400 uppercase">นักเรียน</p>
                </div>
                <div className="bg-blue-500 text-white font-black text-sm px-4 py-1.5 rounded-xl">
                  {selectedReq.toGroup}
                </div>
                <div className="w-9 h-9 bg-sky-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <Settings size={18} />
                </div>
              </div>

              {/* ไอคอนสลับ */}
              <div className="flex justify-end pr-2">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-2xl">
                  ↻
                </div>
              </div>

              {/* เหตุผล */}
              {selectedReq.reason && (
                <p className="text-xs text-gray-500 italic bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                  "{selectedReq.reason}"
                </p>
              )}

              {/* ปุ่ม */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleRequest(selectedReq.id, 'reject')}
                  className="flex-1 bg-rose-300 hover:bg-rose-400 text-white font-black py-3 rounded-2xl transition-all active:scale-95"
                >
                  ปฏิเสธ
                </button>
                <button
                  onClick={() => handleRequest(selectedReq.id, 'approve')}
                  className="flex-1 bg-green-400 hover:bg-green-500 text-white font-black py-3 rounded-2xl transition-all active:scale-95"
                >
                  อนุมัติ
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GroupResultPage;