import React from 'react';

export default function Logo({ size = 40, showText = true, textSize = 'xl' }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logo-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0A5BFF" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#2563EB" floodOpacity="0.35" />
            </filter>
          </defs>
          {/* Main rounded square */}
          <rect x="2" y="4" width="40" height="40" rx="12" fill="url(#logo-bg)" filter="url(#glow)" />
          {/* Second card behind for depth */}
          <rect x="8" y="2" width="40" height="40" rx="12" fill="#7C3AED" opacity="0.18" />
          {/* People group */}
          <circle cx="15.5" cy="22" r="4.5" fill="white" opacity="0.95" />
          <path d="M7 34.5C7 30.5 9.8 27.2 14 27.2H17C21.2 27.2 24 30.5 24 34.5V36H7V34.5Z" fill="white" opacity="0.95" />
          <circle cx="33.5" cy="22" r="4.5" fill="white" opacity="0.95" />
          <path d="M25 34.5C25 30.5 27.8 27.2 32 27.2H35C39.2 27.2 42 30.5 42 34.5V36H25V34.5Z" fill="white" opacity="0.95" />
          <circle cx="24" cy="18" r="6" fill="white" />
          <path d="M14 39.5C14 33.5 17.5 28.5 24 28.5C30.5 28.5 34 33.5 34 39.5V41H14V39.5Z" fill="white" />
          {/* Top badge */}
          <circle cx="38" cy="10" r="10" fill="white" />
          <rect x="29" y="12" width="4.5" height="6" rx="2" fill="#2563EB" />
          <rect x="35" y="8" width="4.5" height="10" rx="2" fill="#2563EB" />
          <rect x="41" y="5" width="4.5" height="13" rx="2" fill="#2563EB" />
        </svg>
      </div>
      {showText && (
        <div className="leading-tight">
          <div className={`font-extrabold tracking-tight text-${textSize} flex`}>
            <span className="text-[#0A5BFF]">Social</span>
            <span className="text-gray-900">Hub</span>
          </div>
          <div className="text-[11px] tracking-widest text-gray-400 font-medium -mt-1">Manage. Connect. Grow.</div>
        </div>
      )}
    </div>
  );
}
