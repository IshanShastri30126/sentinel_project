"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface CountUpProps extends React.HTMLAttributes<HTMLSpanElement> {
  end: number;
  start?: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
}

/**
 * CountUp
 *
 * Smoothly interpolates and animates numeric increments from a base value
 * to a target value using requestAnimationFrame for performance.
 *
 * @param {CountUpProps} props - Target number, initial value, duration, prefix/suffix.
 * @returns {JSX.Element} Animated numeric counter.
 */
export function CountUp({
  end,
  start = 0,
  durationMs = 1500,
  prefix = "",
  suffix = "",
  separator = ",",
  className,
  ...props
}: CountUpProps) {
  const [count, setCount] = useState(start);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      // Ease out cubic
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.floor(start + (end - start) * easeOutProgress);
      setCount(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [end, start, durationMs]);

  const formatted = count
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  return (
    <span className={cn("font-mono font-bold tracking-tight", className)} {...props}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
