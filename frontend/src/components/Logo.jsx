import React from 'react';

export default function Logo({ size = 44, showText = true, dark = false }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        {/* S - light blue */}
        <path
          d="M 18 24 C 18 12 28 4 42 4 L 68 4 C 73 4 76 7 76 12 C 76 17 73 20 68 20 L 42 20 C 34 20 28 24 28 32 C 28 40 34 44 42 44 L 60 44 C 65 44 68 47 68 52 C 68 57 65 60 60 60 L 42 60 C 28 60 12 52 12 34 C 12 16 26 4 42 4"
          fill="#0A5BFF"
          stroke="#0A5BFF"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* H + lower S - dark navy, intertwined */}
        <path
          d="M 30 46 C 30 38 36 34 44 34 L 52 34 C 62 34 72 40 72 58 C 72 76 62 84 44 84 L 22 84 C 16 84 13 81 13 76 C 13 71 16 68 22 68 L 44 68 C 52 68 58 64 58 56 C 58 48 52 44 44 44 L 36 44 C 32 44 30 42 30 38 Z"
          fill="#0A1E4A"
        />
        <rect x="69" y="20" width="18" height="68" rx="9" fill="#0A1E4A" />
        <rect x="45" y="48" width="28" height="12" rx="4" fill="#0A1E4A" />
      </svg>
      {showText && (
        <div className="leading-none">
          <div className="font-extrabold tracking-tight text-[26px] flex">
            <span className="text-[#0A5BFF]">Social</span>
            <span className={dark ? 'text-white' : 'text-[#0A1E4A]'}>Hub</span>
          </div>
          <div className={`text-[11px] tracking-widest font-medium -mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Manage. Connect. Grow.</div>
        </div>
      )}
    </div>
  );
}
