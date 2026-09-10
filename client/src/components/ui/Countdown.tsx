"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface CountdownProps extends React.HTMLAttributes<HTMLDivElement> {
  targetDate: string | Date;
  onComplete?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  completed: boolean;
}

/**
 * calculateTimeLeft
 *
 * Computes remaining duration broken into days, hours, minutes, and seconds.
 *
 * @param {string | Date} target - Target ISO string or Date object.
 * @returns {TimeLeft} Remaining time units and completion status.
 */
function calculateTimeLeft(target: string | Date): TimeLeft {
  const difference = new Date(target).getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, completed: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    completed: false,
  };
}

/**
 * Countdown
 *
 * Tactical event countdown timer displaying days, hours, minutes, and seconds
 * inside glowing monospace numeric pods with cybersecurity HUD styling.
 *
 * @param {CountdownProps} props - Target completion date, optional callback, and div attributes.
 * @returns {JSX.Element} Rendered countdown timer component.
 */
export function Countdown({
  targetDate,
  onComplete,
  className,
  ...props
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(targetDate)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = calculateTimeLeft(targetDate);
      setTimeLeft(updated);

      if (updated.completed) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const units = [
    { label: "DAYS", value: timeLeft.days },
    { label: "HOURS", value: timeLeft.hours },
    { label: "MINS", value: timeLeft.minutes },
    { label: "SECS", value: timeLeft.seconds },
  ];

  return (
    <div
      className={cn("grid grid-cols-4 gap-2 sm:gap-3 max-w-sm select-none", className)}
      {...props}
    >
      {units.map((unit) => (
        <div
          key={unit.label}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg bg-[#070E1A] border border-cyan-500/25 shadow-[0_4px_16px_rgba(0,0,0,0.7)]"
        >
          <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-[#00F5D4] drop-shadow-[0_0_8px_rgba(0,245,212,0.4)]">
            {String(unit.value).padStart(2, "0")}
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] font-semibold text-slate-400 tracking-wider mt-0.5">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
