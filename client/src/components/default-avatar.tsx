import React, { useState } from "react";

interface DefaultAvatarProps {
  className?: string;
  src?: string | null;
  alt?: string;
}

export function DefaultAvatar({ className = "w-10 h-10", src, alt = "Participant Avatar" }: DefaultAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // If a profile image URL is passed and valid, display the participant's custom image
  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${className} rounded-xl object-cover border border-[#00F5D4]/40 shadow-[0_0_12px_rgba(0,245,212,0.3)] shrink-0`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Default Cyberpunk Hooded Hacker Avatar with Green + Bluish Glow
  return (
    <div className={`relative inline-flex items-center justify-center rounded-xl bg-[#040814]/90 border border-[#00F5D4]/40 shadow-[0_0_14px_rgba(0,245,212,0.3)] overflow-hidden shrink-0 ${className}`}>
      <svg 
        className="w-full h-full p-1" 
        viewBox="0 0 120 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 0 6px rgba(0, 245, 212, 0.6)) drop-shadow(0 0 12px rgba(0, 225, 255, 0.4))" }}
      >
        <defs>
          <linearGradient id="hoodGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F5D4" />
            <stop offset="100%" stopColor="#00E1FF" />
          </linearGradient>
          <linearGradient id="maskFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0A1628" />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>
        </defs>

        {/* Cyber Binary Glitch Background Grid */}
        <g opacity="0.25">
          <text x="12" y="32" fill="#00F5D4" fontSize="9" fontFamily="monospace">0 1 0</text>
          <text x="12" y="46" fill="#00E1FF" fontSize="9" fontFamily="monospace">1 0 1</text>
          <text x="12" y="60" fill="#00F5D4" fontSize="9" fontFamily="monospace">1 1 0</text>
          <text x="86" y="32" fill="#00E1FF" fontSize="9" fontFamily="monospace">1 0 1</text>
          <text x="86" y="46" fill="#00F5D4" fontSize="9" fontFamily="monospace">1 1 0</text>
          <text x="86" y="60" fill="#00E1FF" fontSize="9" fontFamily="monospace">0 1 0</text>
        </g>

        {/* Shoulders & Outer Hood Base */}
        <path
          d="M20 108 C20 85 38 72 60 72 C82 72 100 85 100 108"
          fill="#060E1A"
          stroke="url(#hoodGlow)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Main Hood Outer Contour */}
        <path
          d="M60 12 C35 12 24 38 24 64 C24 82 34 94 40 98 C46 94 54 84 60 84 C66 84 74 94 80 98 C86 94 96 82 96 64 C96 38 85 12 60 12 Z"
          fill="url(#maskFill)"
          stroke="url(#hoodGlow)"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Inner Hood Dark Shadow */}
        <path
          d="M60 20 C42 20 34 38 34 58 C34 72 44 80 60 80 C76 80 86 72 86 58 C86 38 78 20 60 20 Z"
          fill="#02050D"
          stroke="#00F5D4"
          strokeWidth="1.2"
          opacity="0.9"
        />

        {/* Hacker Mask Face Shield */}
        <path
          d="M44 42 C44 42 52 38 60 38 C68 38 76 42 76 42 C76 42 80 58 76 68 C70 78 60 82 60 82 C60 82 50 78 44 68 C40 58 44 42 44 42 Z"
          fill="#071224"
          stroke="#00E1FF"
          strokeWidth="2"
        />

        {/* Glowing Green Slanted Cyber Eyes */}
        <path d="M47 48 L56 50 L54 56 L46 54 Z" fill="#00FF66" style={{ filter: "drop-shadow(0 0 6px #00FF66)" }} />
        <path d="M73 48 L64 50 L66 56 L74 54 Z" fill="#00FF66" style={{ filter: "drop-shadow(0 0 6px #00FF66)" }} />

        {/* Glowing Green Pixelated Hacker Mask Smile */}
        <path
          d="M50 64 H54 V67 H66 V64 H70 V68 H66 V71 H54 V68 H50 Z"
          fill="#00F5D4"
          style={{ filter: "drop-shadow(0 0 8px #00F5D4)" }}
        />
      </svg>
    </div>
  );
}
