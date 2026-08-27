"use client";

import React from "react";
import { motion } from "framer-motion";

export interface SentinalLogoProps {
  className?: string;
  collapsed?: boolean;
  showText?: boolean;
  animateDrawing?: boolean;
}

export const SentinalLogo: React.FC<SentinalLogoProps> = ({
  className = "",
  collapsed = false,
  showText = true,
  animateDrawing = true
}) => {
  // Parent variants to propagate hover state
  const containerVariants = {
    initial: { 
      scale: 1,
      filter: "drop-shadow(0 0 0px rgba(255, 215, 0, 0)) drop-shadow(0 0 0px rgba(0, 245, 212, 0))"
    },
    hover: {
      scale: 1.08,
      filter: "drop-shadow(0 0 18px rgba(255, 215, 0, 0.5)) drop-shadow(0 0 10px rgba(0, 245, 212, 0.4))",
      transition: { type: "spring" as const, stiffness: 400, damping: 15 }
    }
  } as const;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Chakravyuh Concentric Ring Emblem */}
      <motion.div
        className="relative shrink-0 flex items-center justify-center w-12 h-12"
        initial="initial"
        whileHover="hover"
        variants={containerVariants}
      >
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            {/* Energetic Green Aura Gradient */}
            <linearGradient id="goldAura" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#66FF99" />
              <stop offset="50%" stopColor="#00FF66" />
              <stop offset="100%" stopColor="#00CC52" />
            </linearGradient>

            {/* Electric Blue Power Energy Gradient */}
            <linearGradient id="cyanPower" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E1FF" />
              <stop offset="50%" stopColor="#00B3FF" />
              <stop offset="100%" stopColor="#0088FF" />
            </linearGradient>

            {/* Golden glow filter */}
            <filter id="glow-gold" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Cyan glow filter */}
            <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Chakravyuh Tier 1 (Golden Ring with notch breaks) */}
          <motion.circle
            cx="16"
            cy="16"
            r="14.5"
            stroke="url(#goldAura)"
            strokeWidth="1.2"
            strokeDasharray="18 4 12 4 22 4"
            filter="url(#glow-gold)"
            variants={{
              hover: {
                rotate: 360,
                transition: { repeat: Infinity, duration: 8, ease: "linear" }
              }
            }}
          />

          {/* Tier 2 (Cyan Power Energy Counter-Rotating Ring) */}
          <motion.circle
            cx="16"
            cy="16"
            r="12"
            stroke="url(#cyanPower)"
            strokeWidth="1"
            strokeDasharray="10 3 14 3"
            filter="url(#glow-cyan)"
            variants={{
              hover: {
                rotate: -360,
                transition: { repeat: Infinity, duration: 6, ease: "linear" }
              }
            }}
          />

          {/* Tier 3 (Golden Inner Defense Ring) */}
          <motion.circle
            cx="16"
            cy="16"
            r="9.5"
            stroke="url(#goldAura)"
            strokeWidth="0.8"
            strokeDasharray="6 2"
            opacity="0.8"
          />

          {/* Tier 4 (Cyan Pulse Ring) */}
          <motion.circle
            cx="16"
            cy="16"
            r="7"
            stroke="#00F5D4"
            strokeWidth="0.75"
            strokeDasharray="4 4"
            opacity="0.9"
          />

          {/* Central Invincible Core (Triangular Energy Spear / Shield Node) */}
          <motion.path
            d="M16 8L22 19H10L16 8Z"
            fill="url(#goldAura)"
            filter="url(#glow-gold)"
            opacity="0.95"
            initial={animateDrawing ? { scale: 0.8, opacity: 0 } : { scale: 1, opacity: 0.95 }}
            animate={{ scale: 1, opacity: 0.95 }}
            transition={{ duration: 0.6 }}
          />

          {/* Inner Power Core Eye */}
          <circle cx="16" cy="16" r="2" fill="#00F5D4" filter="url(#glow-cyan)" />
        </svg>
      </motion.div>

      {/* Text Area */}
      {showText && !collapsed && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline font-bold font-mono tracking-widest text-lg uppercase leading-none">
            <motion.span
              className="text-white"
              initial={animateDrawing ? { x: -10, opacity: 0 } : { x: 0, opacity: 1 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              SENTI
            </motion.span>
            <motion.span
              className="text-[#00FF66]"
              initial={animateDrawing ? { x: 10, opacity: 0 } : { x: 0, opacity: 1 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{ textShadow: "0 0 12px rgba(0,255,102,0.6)" }}
            >
              NAL
            </motion.span>
          </div>
          <motion.span
            className="text-[7.5px] tracking-[0.25em] font-mono uppercase text-[#00E1FF] mt-1 whitespace-nowrap opacity-90"
            initial={animateDrawing ? { opacity: 0, y: 5 } : { opacity: 0.9, y: 0 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Club • Strategic Defense
          </motion.span>
        </div>
      )}
    </div>
  );
};

export const CyberKavachLogo = SentinalLogo;
export type CyberKavachLogoProps = SentinalLogoProps;
export default SentinalLogo;
