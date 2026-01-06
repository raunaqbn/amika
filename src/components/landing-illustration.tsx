'use client';

import { useState, useEffect } from 'react';

export function LandingIllustration() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`relative transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Main illustration - Friends having coffee together */}
      <svg
        viewBox="0 0 400 350"
        className="w-72 h-64 md:w-96 md:h-80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background elements - soft shapes */}
        <ellipse cx="200" cy="300" rx="180" ry="30" fill="#A8C5A8" opacity="0.15" />

        {/* Cafe table */}
        <ellipse cx="200" cy="260" rx="90" ry="20" fill="#D4A5A5" opacity="0.3" />
        <rect x="190" y="260" width="20" height="60" fill="#C4958C" opacity="0.5" />

        {/* Coffee cups on table */}
        <g>
          {/* Cup 1 */}
          <path d="M155 245 L165 245 L162 255 L158 255 Z" fill="#8B5A3C" />
          <ellipse cx="160" cy="245" rx="6" ry="2" fill="#6B4226" />
          <path d="M165 248 Q172 248 172 252 Q172 256 165 256" stroke="#8B5A3C" strokeWidth="2" fill="none" />
          {/* Steam */}
          <path d="M160 240 Q158 235 160 230" stroke="#A8C5A8" strokeWidth="1.5" fill="none" opacity="0.5" className="animate-steam" />
        </g>

        <g>
          {/* Cup 2 */}
          <path d="M235 245 L245 245 L242 255 L238 255 Z" fill="#8B5A3C" />
          <ellipse cx="240" cy="245" rx="6" ry="2" fill="#6B4226" />
          <path d="M245 248 Q252 248 252 252 Q252 256 245 256" stroke="#8B5A3C" strokeWidth="2" fill="none" />
          {/* Steam */}
          <path d="M240 240 Q242 235 240 230" stroke="#D4A5A5" strokeWidth="1.5" fill="none" opacity="0.5" className="animate-steam-delayed" />
        </g>

        {/* Person 1 - Left, warm and friendly */}
        <g className="animate-gentle-bounce">
          {/* Body - cozy sweater */}
          <path d="M100 260 Q100 200 120 180 L150 180 Q170 200 170 260 Z" fill="#A8C5A8" />
          {/* Sweater detail */}
          <path d="M110 220 L160 220" stroke="#97B497" strokeWidth="2" opacity="0.5" />
          <path d="M108 235 L162 235" stroke="#97B497" strokeWidth="2" opacity="0.5" />

          {/* Arms */}
          <path d="M100 200 Q80 210 85 240 Q90 250 100 245" fill="#FFDAB9" />
          <path d="M170 200 Q185 220 175 245" fill="#FFDAB9" />

          {/* Head */}
          <circle cx="135" cy="140" r="40" fill="#FFDAB9" />

          {/* Hair - friendly wavy */}
          <path d="M95 130 Q95 90 135 85 Q175 90 175 130 Q175 120 165 115 Q145 105 125 115 Q105 120 95 130" fill="#5D4037" />

          {/* Face - warm smile */}
          <circle cx="120" cy="140" r="4" fill="#4A3728" /> {/* Left eye */}
          <circle cx="150" cy="140" r="4" fill="#4A3728" /> {/* Right eye */}
          <path d="M122 158 Q135 172 148 158" stroke="#4A3728" strokeWidth="3" strokeLinecap="round" fill="none" /> {/* Smile */}

          {/* Rosy cheeks */}
          <circle cx="110" cy="150" r="8" fill="#D4A5A5" opacity="0.4" />
          <circle cx="160" cy="150" r="8" fill="#D4A5A5" opacity="0.4" />
        </g>

        {/* Person 2 - Right, warm and friendly */}
        <g className="animate-gentle-bounce-delayed">
          {/* Body - cozy cardigan */}
          <path d="M230 260 Q230 200 250 180 L280 180 Q300 200 300 260 Z" fill="#D4A5A5" />
          {/* Cardigan details */}
          <path d="M265 180 L265 260" stroke="#C49494" strokeWidth="2" />
          <circle cx="265" cy="200" r="3" fill="#C49494" />
          <circle cx="265" cy="220" r="3" fill="#C49494" />

          {/* Arms */}
          <path d="M230 200 Q215 220 225 245" fill="#F5DEB3" />
          <path d="M300 200 Q320 210 315 240 Q310 250 300 245" fill="#F5DEB3" />

          {/* Head */}
          <circle cx="265" cy="140" r="40" fill="#F5DEB3" />

          {/* Hair - curly and friendly */}
          <path d="M225 125 Q220 85 265 80 Q310 85 305 125" fill="#8D6E63" />
          <circle cx="230" cy="110" r="10" fill="#8D6E63" />
          <circle cx="250" cy="95" r="10" fill="#8D6E63" />
          <circle cx="275" cy="95" r="10" fill="#8D6E63" />
          <circle cx="295" cy="110" r="10" fill="#8D6E63" />

          {/* Face - warm smile */}
          <circle cx="250" cy="140" r="4" fill="#4A3728" /> {/* Left eye */}
          <circle cx="280" cy="140" r="4" fill="#4A3728" /> {/* Right eye */}
          <path d="M252 158 Q265 172 278 158" stroke="#4A3728" strokeWidth="3" strokeLinecap="round" fill="none" /> {/* Smile */}

          {/* Rosy cheeks */}
          <circle cx="240" cy="150" r="8" fill="#D4A5A5" opacity="0.4" />
          <circle cx="290" cy="150" r="8" fill="#D4A5A5" opacity="0.4" />
        </g>

        {/* Decorative elements */}
        {/* Heart floating */}
        <g className="animate-float">
          <path d="M200 80 Q195 70 200 65 Q205 60 205 68 Q205 60 210 65 Q215 70 210 80 L205 90 Z" fill="#D4A5A5" opacity="0.8" />
        </g>

        {/* Small plant on table */}
        <g>
          <rect x="195" y="230" width="10" height="15" rx="2" fill="#C49494" opacity="0.6" />
          <ellipse cx="200" cy="225" rx="8" ry="6" fill="#A8C5A8" />
          <ellipse cx="196" cy="222" rx="5" ry="4" fill="#97B497" />
          <ellipse cx="204" cy="220" rx="5" ry="4" fill="#B8D4B8" />
        </g>

        {/* Sparkles */}
        <g className="animate-twinkle">
          <path d="M80 100 L82 105 L87 107 L82 109 L80 114 L78 109 L73 107 L78 105 Z" fill="#A8C5A8" opacity="0.6" />
        </g>
        <g className="animate-twinkle-delayed">
          <path d="M320 120 L322 125 L327 127 L322 129 L320 134 L318 129 L313 127 L318 125 Z" fill="#D4A5A5" opacity="0.6" />
        </g>
        <g className="animate-twinkle">
          <path d="M50 180 L51 183 L54 184 L51 185 L50 188 L49 185 L46 184 L49 183 Z" fill="#D4A5A5" opacity="0.5" />
        </g>
        <g className="animate-twinkle-delayed">
          <path d="M350 170 L351 173 L354 174 L351 175 L350 178 L349 175 L346 174 L349 173 Z" fill="#A8C5A8" opacity="0.5" />
        </g>
      </svg>

      {/* Tagline below illustration */}
      <p className="text-center text-gray-500 text-sm mt-4 max-w-xs mx-auto">
        Keep your friendships warm with meaningful connections
      </p>

      <style jsx>{`
        @keyframes gentle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.1); }
        }
        @keyframes steam {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.6; transform: translateY(-5px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        .animate-gentle-bounce {
          animation: gentle-bounce 3s ease-in-out infinite;
        }
        .animate-gentle-bounce-delayed {
          animation: gentle-bounce 3s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        .animate-float {
          animation: float 2.5s ease-in-out infinite;
        }
        .animate-steam {
          animation: steam 2s ease-in-out infinite;
        }
        .animate-steam-delayed {
          animation: steam 2s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        .animate-twinkle-delayed {
          animation: twinkle 2s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
