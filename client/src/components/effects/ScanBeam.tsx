"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ScanBeamProps extends React.HTMLAttributes<HTMLDivElement> {
  speedSeconds?: number;
  beamColor?: string;
}

/**
 * ScanBeam
 *
 * Horizontal scanner light ray that travels vertically across cards or hero elements
 * mimicking security radar/diagnostic sweepers.
 *
 * @param {ScanBeamProps} props - Scan speed, custom laser color, and container attributes.
 * @returns {JSX.Element} Animated scan beam.
 */
export function ScanBeam({
  speedSeconds = 4,
  beamColor = "#00F5D4",
  className,
  ...props
}: ScanBeamProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      {...props}
    >
      <div
        style={{
          animationDuration: `${speedSeconds}s`,
          background: `linear-gradient(to bottom, transparent, ${beamColor}26, transparent)`,
          boxShadow: `0 0 15px ${beamColor}66`,
        }}
        className="absolute left-0 right-0 h-16 w-full -translate-y-full animate-[scan-beam_infinite_linear]"
      />
    </div>
  );
}
