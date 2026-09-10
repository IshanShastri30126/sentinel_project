"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type SystemStatusType =
  | "operational"
  | "standby"
  | "warning"
  | "critical"
  | "offline";

export interface CyberStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  status: SystemStatusType;
  label?: string;
  pingMs?: number;
  showPing?: boolean;
}

/**
 * CyberStatus
 *
 * Visual telemetry status pill displaying operational health,
 * live radar pulse dot, and optional round-trip ping latency.
 *
 * @param {CyberStatusProps} props - Status level, display label, and ping telemetry.
 * @returns {JSX.Element} Rendered status indicator.
 */
export function CyberStatus({
  status = "operational",
  label,
  pingMs,
  showPing = false,
  className,
  ...props
}: CyberStatusProps) {
  const statusConfig = {
    operational: {
      color: "bg-[#00F5D4]",
      border: "border-[rgba(0,245,212,0.3)]",
      text: "text-[#00F5D4]",
      bg: "bg-[rgba(0,245,212,0.06)]",
      defaultLabel: "SYSTEM NOMINAL",
    },
    standby: {
      color: "bg-[#00E1FF]",
      border: "border-[rgba(0,225,255,0.3)]",
      text: "text-[#00E1FF]",
      bg: "bg-[rgba(0,225,255,0.06)]",
      defaultLabel: "STANDBY",
    },
    warning: {
      color: "bg-[#FFB800]",
      border: "border-[rgba(255,184,0,0.3)]",
      text: "text-[#FFB800]",
      bg: "bg-[rgba(255,184,0,0.06)]",
      defaultLabel: "ELEVATED",
    },
    critical: {
      color: "bg-[#FF0055]",
      border: "border-[rgba(255,0,85,0.4)]",
      text: "text-[#FF0055]",
      bg: "bg-[rgba(255,0,85,0.08)]",
      defaultLabel: "CRITICAL ALERT",
    },
    offline: {
      color: "bg-slate-500",
      border: "border-slate-700",
      text: "text-slate-400",
      bg: "bg-slate-800/40",
      defaultLabel: "OFFLINE",
    },
  };

  const current = statusConfig[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full font-mono text-[11px] uppercase tracking-wider border",
        current.bg,
        current.border,
        current.text,
        className
      )}
      {...props}
    >
      <span className="relative flex h-2 w-2 items-center justify-center">
        {status !== "offline" && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              current.color
            )}
          />
        )}
        <span
          className={cn("relative inline-flex h-2 w-2 rounded-full", current.color)}
        />
      </span>
      <span className="font-semibold">{label || current.defaultLabel}</span>
      {showPing && pingMs !== undefined && (
        <span className="text-[10px] text-slate-400 pl-1 border-l border-white/10">
          {pingMs}ms
        </span>
      )}
    </div>
  );
}
