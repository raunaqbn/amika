'use client';

import { useState, useEffect } from 'react';

export function LandingIllustration() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main illustration container */}
      <div className={`relative transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {/* Floating elements */}
        <div className="absolute -top-8 -left-8 animate-float-slow">
          <div className="bg-[#A8C5A8]/20 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
            <span className="text-2xl">💚</span>
          </div>
        </div>

        <div className="absolute -top-4 right-12 animate-float-medium">
          <div className="bg-[#D4A5A5]/20 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
            <span className="text-2xl">✨</span>
          </div>
        </div>

        <div className="absolute bottom-20 -left-12 animate-float-fast">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
            <span className="text-2xl">🎂</span>
          </div>
        </div>

        <div className="absolute bottom-8 right-0 animate-float-slow">
          <div className="bg-[#A8C5A8]/20 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
            <span className="text-2xl">📅</span>
          </div>
        </div>

        {/* Main SVG Illustration - Friends connecting */}
        <svg
          viewBox="0 0 400 400"
          className="w-80 h-80 md:w-96 md:h-96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle */}
          <circle cx="200" cy="200" r="180" fill="url(#bgGradient)" opacity="0.1" />

          {/* Connection lines */}
          <path
            d="M120 180 Q200 120 280 180"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
            className="animate-dash"
          />
          <path
            d="M100 240 Q200 300 300 240"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
            className="animate-dash-reverse"
          />

          {/* Person 1 - Left */}
          <g className="animate-float-slow">
            {/* Body */}
            <ellipse cx="100" cy="280" rx="35" ry="45" fill="#A8C5A8" opacity="0.9" />
            {/* Head */}
            <circle cx="100" cy="200" r="35" fill="#FFDAB9" />
            {/* Hair */}
            <path
              d="M65 195 Q70 160 100 155 Q130 160 135 195"
              fill="#5D4E37"
            />
            {/* Eyes */}
            <circle cx="88" cy="200" r="4" fill="#333" />
            <circle cx="112" cy="200" r="4" fill="#333" />
            {/* Smile */}
            <path
              d="M90 215 Q100 225 110 215"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Waving hand */}
            <ellipse cx="145" cy="240" rx="12" ry="15" fill="#FFDAB9" className="animate-wave origin-[145px_255px]" />
          </g>

          {/* Person 2 - Right */}
          <g className="animate-float-medium">
            {/* Body */}
            <ellipse cx="300" cy="280" rx="35" ry="45" fill="#D4A5A5" opacity="0.9" />
            {/* Head */}
            <circle cx="300" cy="200" r="35" fill="#F5DEB3" />
            {/* Hair */}
            <path
              d="M265 200 Q265 155 300 150 Q335 155 340 185 L340 210 Q335 200 300 195 Q270 198 265 200"
              fill="#8B4513"
            />
            {/* Eyes */}
            <circle cx="288" cy="200" r="4" fill="#333" />
            <circle cx="312" cy="200" r="4" fill="#333" />
            {/* Smile */}
            <path
              d="M290 215 Q300 225 310 215"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Heart on shirt */}
            <path
              d="M295 270 Q290 263 295 260 Q300 257 300 263 Q300 257 305 260 Q310 263 305 270 L300 278 Z"
              fill="white"
              opacity="0.5"
            />
          </g>

          {/* Person 3 - Center top */}
          <g className="animate-float-fast">
            {/* Body */}
            <ellipse cx="200" cy="150" rx="30" ry="40" fill="#98B4D4" opacity="0.9" />
            {/* Head */}
            <circle cx="200" cy="85" r="30" fill="#DEB887" />
            {/* Hair */}
            <ellipse cx="200" cy="70" rx="32" ry="20" fill="#2F1E0F" />
            {/* Eyes */}
            <circle cx="190" cy="85" r="3" fill="#333" />
            <circle cx="210" cy="85" r="3" fill="#333" />
            {/* Smile */}
            <path
              d="M193 98 Q200 105 207 98"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Heart particles */}
          <g className="animate-pulse">
            <path d="M170 160 Q165 153 170 150 Q175 147 175 153 Q175 147 180 150 Q185 153 180 160 L175 168 Z" fill="#D4A5A5" opacity="0.8" />
            <path d="M230 160 Q225 153 230 150 Q235 147 235 153 Q235 147 240 150 Q245 153 240 160 L235 168 Z" fill="#A8C5A8" opacity="0.8" />
            <path d="M200 340 Q195 333 200 330 Q205 327 205 333 Q205 327 210 330 Q215 333 210 340 L205 348 Z" fill="#D4A5A5" opacity="0.6" />
          </g>

          {/* Chat bubbles */}
          <g className="animate-float-slow">
            <rect x="140" y="110" width="50" height="30" rx="10" fill="white" opacity="0.9" />
            <polygon points="155,140 165,140 155,150" fill="white" opacity="0.9" />
            <text x="152" y="130" fontSize="14" fill="#A8C5A8">Hi! 👋</text>
          </g>

          <g className="animate-float-medium">
            <rect x="250" y="130" width="45" height="25" rx="8" fill="white" opacity="0.9" />
            <polygon points="270,155 280,155 285,165" fill="white" opacity="0.9" />
            <text x="260" y="147" fontSize="12" fill="#D4A5A5">Hey! 💕</text>
          </g>

          {/* Gradients */}
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A8C5A8" />
              <stop offset="100%" stopColor="#D4A5A5" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A8C5A8" />
              <stop offset="100%" stopColor="#D4A5A5" />
            </linearGradient>
          </defs>
        </svg>

        {/* Phone mockup with app preview */}
        <div className="absolute -right-4 bottom-4 w-32 h-56 bg-gray-800 rounded-3xl p-1 shadow-2xl transform rotate-6 animate-float-medium">
          <div className="w-full h-full bg-[#1a1a2e] rounded-2xl overflow-hidden">
            {/* Phone screen content */}
            <div className="p-2">
              <div className="text-[#A8C5A8] text-[8px] font-semibold mb-1">amika</div>
              <div className="space-y-1">
                <div className="bg-white/10 rounded p-1">
                  <div className="text-white text-[6px]">Birthday reminder</div>
                  <div className="text-gray-400 text-[5px]">Sarah&apos;s birthday tomorrow!</div>
                </div>
                <div className="bg-[#A8C5A8]/20 rounded p-1">
                  <div className="text-white text-[6px]">Coffee meetup</div>
                  <div className="text-gray-400 text-[5px]">with Alex - Today 3pm</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-10deg); }
        }
        @keyframes dash {
          0% { stroke-dashoffset: 200; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 3s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: float-fast 2.5s ease-in-out infinite;
        }
        .animate-wave {
          animation: wave 1s ease-in-out infinite;
        }
        .animate-dash {
          stroke-dasharray: 200;
          animation: dash 3s linear infinite;
        }
        .animate-dash-reverse {
          stroke-dasharray: 200;
          animation: dash 3s linear infinite reverse;
        }
      `}</style>
    </div>
  );
}
