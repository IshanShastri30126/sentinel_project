"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface GlitchTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  triggerOnHover?: boolean;
  intervalMs?: number;
  chars?: string;
}

const DEFAULT_CHARS = "0123456789ABCDEF!@#$%^&*()_+<>:{}[]";

/**
 * GlitchText
 *
 * Scrambles and resolves text characters randomly to create an authentic
 * cyber decryption / cryptographic glitch sequence.
 *
 * @param {GlitchTextProps} props - Target text, trigger modes, and glyph characters.
 * @returns {JSX.Element} Decrypting glitch text element.
 */
export function GlitchText({
  text,
  triggerOnHover = true,
  intervalMs,
  chars = DEFAULT_CHARS,
  className,
  ...props
}: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);

  const runGlitch = useCallback(() => {
    if (isGlitching) return;
    setIsGlitching(true);

    let iteration = 0;
    const totalSteps = text.length * 3;

    const interval = setInterval(() => {
      setDisplayText(() =>
        text
          .split("")
          .map((letter, index) => {
            if (index < iteration / 3) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= totalSteps) {
        clearInterval(interval);
        setDisplayText(text);
        setIsGlitching(false);
      }

      iteration += 1;
    }, 30);
  }, [text, isGlitching, chars]);

  useEffect(() => {
    if (!intervalMs) return;
    const timer = setInterval(() => {
      runGlitch();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, runGlitch]);

  return (
    <span
      onMouseEnter={triggerOnHover ? runGlitch : undefined}
      className={cn(
        "inline-block font-mono tracking-wider transition-colors cursor-default select-none",
        isGlitching && "text-[#00F5D4] drop-shadow-[0_0_8px_rgba(0,245,212,0.8)]",
        className
      )}
      {...props}
    >
      {displayText}
    </span>
  );
}
