"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SystemLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  prefix?: string;
  dotColor?: "primary" | "accent" | "danger" | "warning";
  showDot?: boolean;
}

/**
 * SystemLabel
 *
 * Compact tactical metadata label styled in monospace uppercase font
 * for command center diagnostics, system IDs, and section headers.
 *
 * @param {SystemLabelProps} props - Prefix, indicator dot options, and HTML span attributes.
 * @returns {JSX.Element} Rendered tactical label.
 */
export function SystemLabel({
  prefix = "//",
  dotColor = "primary",
  showDot = false,
  className,
  children,
  ...props
}: SystemLabelProps) {
  const dotColorMap = {
    primary: "bg-[#00F5D4]",
    accent: "bg-[#00E1FF]",
    danger: "bg-[#FF0055]",
    warning: "bg-[#FFB800]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-400 select-none",
        className
      )}
      {...props}
    >
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColorMap[dotColor])} />
      )}
      {prefix && <span className="text-cyan-400/80 font-bold">{prefix}</span>}
      <span className="text-slate-300 font-semibold">{children}</span>
    </span>
  );
}
