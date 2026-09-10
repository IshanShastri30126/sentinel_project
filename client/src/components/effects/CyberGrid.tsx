"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CyberGridProps extends React.HTMLAttributes<HTMLDivElement> {
  gridSize?: number;
  glowColor?: string;
  fadeEdges?: boolean;
}

/**
 * CyberGrid
 *
 * Perspective background grid emulating 80s/90s cyber-grid vector horizon,
 * with subtle radial gradient falloff to maintain foreground text readability.
 *
 * @param {CyberGridProps} props - Grid dimensions, ambient glow tone, and fade masking.
 * @returns {JSX.Element} Rendered decorative cyber grid overlay.
 */
export function CyberGrid({
  gridSize = 40,
  glowColor = "rgba(0, 245, 212, 0.08)",
  fadeEdges = true,
  className,
  ...props
}: CyberGridProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden select-none",
        fadeEdges &&
          "[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_80%)]",
        className
      )}
      {...props}
    >
      <div
        style={{
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundImage: `
            linear-gradient(to right, ${glowColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${glowColor} 1px, transparent 1px)
          `,
        }}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
