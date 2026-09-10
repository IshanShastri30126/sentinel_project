"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider uppercase transition-colors rounded-sm",
  {
    variants: {
      variant: {
        normal:
          "bg-[rgba(0,245,212,0.1)] text-[#00F5D4] border border-[rgba(0,245,212,0.35)] shadow-[0_0_10px_rgba(0,245,212,0.15)]",
        info:
          "bg-[rgba(0,225,255,0.1)] text-[#00E1FF] border border-[rgba(0,225,255,0.35)] shadow-[0_0_10px_rgba(0,225,255,0.15)]",
        warning:
          "bg-[rgba(255,184,0,0.1)] text-[#FFB800] border border-[rgba(255,184,0,0.35)] shadow-[0_0_10px_rgba(255,184,0,0.15)]",
        danger:
          "bg-[rgba(255,0,85,0.1)] text-[#FF0055] border border-[rgba(255,0,85,0.35)] shadow-[0_0_10px_rgba(255,0,85,0.15)]",
        critical:
          "bg-[rgba(255,0,51,0.15)] text-[#FF0033] border border-[#FF0033] shadow-[0_0_15px_rgba(255,0,51,0.3)] animate-pulse",
        muted:
          "bg-slate-800/60 text-slate-300 border border-slate-700/60",
        purple:
          "bg-purple-950/40 text-purple-400 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]",
      },
      size: {
        sm: "text-[10px] px-2 py-0.2",
        md: "text-[11px] px-2.5 py-0.5",
        lg: "text-xs px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "normal",
      size: "md",
    },
  }
);

export interface CyberBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulseDot?: boolean;
}

/**
 * CyberBadge
 *
 * Visual status indicator badge with security classifications,
 * optional pulsing activity dot, and high-contrast monospace typography.
 *
 * @param {CyberBadgeProps} props - Badge styling, status tier, and indicator options.
 * @returns {JSX.Element} Rendered badge element.
 */
export function CyberBadge({
  className,
  variant = "normal",
  size,
  dot = false,
  pulseDot = false,
  children,
  ...props
}: CyberBadgeProps) {
  const dotColorClass =
    variant === "normal"
      ? "bg-[#00F5D4]"
      : variant === "info"
      ? "bg-[#00E1FF]"
      : variant === "warning"
      ? "bg-[#FFB800]"
      : variant === "danger" || variant === "critical"
      ? "bg-[#FF0055]"
      : variant === "purple"
      ? "bg-purple-400"
      : "bg-slate-400";

  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5 items-center justify-center">
          {pulseDot && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                dotColorClass
              )}
            />
          )}
          <span
            className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", dotColorClass)}
          />
        </span>
      )}
      {children}
    </span>
  );
}
