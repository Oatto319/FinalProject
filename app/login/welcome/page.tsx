'use client';

import React, { useEffect, useState } from 'react';

export default function WelcomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Confetti Background Effect (Simulated with CSS) */}
      <div className="absolute inset-0 pointer-events-none">
        {mounted && Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce opacity-80"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 20}%`,
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              backgroundColor: ['#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93'][Math.floor(Math.random() * 5)],
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 2}s`
            }}
          />
        ))}
      </div>

      {/* Welcome Text */}
      <h1 className="text-[#2D3E50] text-7xl md:text-8xl font-black tracking-tighter mb-12 animate-fade-in-down">
        WELCOME
      </h1>

      {/* Profile Section with Party Popper */}
      <div className="relative mb-8">
        {/* Profile Circle */}
        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-gray-100 shadow-xl bg-orange-50">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Wimolchai" 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Party Popper SVG Icon */}
        <div className="absolute -right-4 bottom-4 w-16 h-16 md:w-20 md:h-20 drop-shadow-lg animate-bounce">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M20,80 L40,60 L60,80 Z" fill="#FFCA3A" />
            <rect x="35" y="45" width="10" height="20" fill="#6A4C93" transform="rotate(-45 40 55)" />
            <circle cx="70" cy="30" r="3" fill="#FF595E" />
            <circle cx="80" cy="50" r="3" fill="#8AC926" />
            <circle cx="60" cy="20" r="2" fill="#1982C4" />
            <path d="M40,55 Q50,30 80,20" fill="none" stroke="#FF595E" strokeWidth="2" strokeDasharray="4 2" />
            <path d="M40,55 Q60,50 90,60" fill="none" stroke="#8AC926" strokeWidth="2" strokeDasharray="4 2" />
          </svg>
        </div>
      </div>

      {/* User Info */}
      <div className="text-center z-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Wimolchai</h2>
        <p className="text-gray-500 font-medium">นักเรียน</p>
      </div>

      <style jsx global>{`
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}