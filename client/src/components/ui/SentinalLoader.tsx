"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SentinalLoaderProps {
  /**
   * Layout mode:
   * - 'inline': Compact three dots for inside buttons, table cells, or badges
   * - 'card': Centered inside a card or section container
   * - 'modal': Centered with a dark backdrop overlay for modal dialogs
   * - 'fullscreen': Full-viewport overlay with cyber command-center backdrop
   */
  variant?: "inline" | "card" | "modal" | "fullscreen";

  /**
   * Size of the loader dots:
   * - 'sm': 4px dots (for buttons / small badges)
   * - 'md': 8px dots (standard card / section loader)
   * - 'lg': 12px dots (modal / prominent loader)
   * - 'xl': 16px dots (full page / bootloader)
   */
  size?: "sm" | "md" | "lg" | "xl";

  /**
   * Optional authoritative status text describing the actual operation.
   * Prohibited: fake telemetry, fake progress percentages, fake logs.
   * Example: "AUTHENTICATING OPERATIVE...", "SYNCING EVENT REGISTRY..."
   */
  text?: string;

  /**
   * Accessible screen reader announcement. Defaults to "Processing operational request..."
   */
  accessibleLabel?: string;

  /**
   * Optional custom className for container
   */
  className?: string;
}

/**
 * SentinalLoader
 *
 * Canonical unified loading component for the SENTINAL defense ecosystem.
 * Implements the command-center three-dot morphing animation with dark cyan/teal
 * palette, subtle glow aesthetics, keyboard safety, and prefers-reduced-motion support.
 */
export function SentinalLoader({
  variant = "card",
  size = "md",
  text,
  accessibleLabel = "Processing operational request...",
  className,
}: SentinalLoaderProps) {
  // Dot dimensions based on size
  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2.5 h-2.5",
    lg: "w-3.5 h-3.5",
    xl: "w-4 h-4",
  };

  const textSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
    xl: "text-base",
  };

  const dotClass = dotSizes[size];
  const textSizeClass = textSizes[size];

  // Core three-dot animated node
  const dotsNode = (
    <div
      className="flex items-center gap-2 select-none"
      aria-hidden="true"
    >
      <span
        className={cn(
          "rounded-full bg-[#00F5D4] shadow-[0_0_10px_rgba(0,245,212,0.6)] motion-safe:animate-[sentinalPulse_1.4s_infinite_ease-in-out_both] motion-reduce:opacity-80",
          dotClass
        )}
        style={{ animationDelay: "-0.32s" }}
      />
      <span
        className={cn(
          "rounded-full bg-[#00E1FF] shadow-[0_0_10px_rgba(0,225,255,0.6)] motion-safe:animate-[sentinalPulse_1.4s_infinite_ease-in-out_both] motion-reduce:opacity-80",
          dotClass
        )}
        style={{ animationDelay: "-0.16s" }}
      />
      <span
        className={cn(
          "rounded-full bg-[#00F5D4] shadow-[0_0_10px_rgba(0,245,212,0.6)] motion-safe:animate-[sentinalPulse_1.4s_infinite_ease-in-out_both] motion-reduce:opacity-80",
          dotClass
        )}
      />
    </div>
  );

  // Status text node
  const statusNode = text ? (
    <span
      className={cn(
        "font-mono font-bold tracking-widest text-cyan-400 uppercase",
        textSizeClass
      )}
    >
      {text}
    </span>
  ) : null;

  // Inline variant
  if (variant === "inline") {
    return (
      <span
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={cn("inline-flex items-center gap-2 align-middle", className)}
      >
        <span className="sr-only">{accessibleLabel}</span>
        {dotsNode}
        {statusNode}
      </span>
    );
  }

  // Card variant
  if (variant === "card") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={cn(
          "flex flex-col items-center justify-center p-8 gap-3 min-h-[140px] rounded-xl bg-[#050A14]/60 border border-white/[0.06] backdrop-blur-sm",
          className
        )}
      >
        <span className="sr-only">{accessibleLabel}</span>
        {dotsNode}
        {statusNode}
      </div>
    );
  }

  // Modal variant
  if (variant === "modal") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={cn(
          "absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/75 backdrop-blur-md rounded-xl",
          className
        )}
      >
        <span className="sr-only">{accessibleLabel}</span>
        <div className="p-6 rounded-2xl bg-[#050A14]/90 border border-cyan-500/30 shadow-[0_0_30px_rgba(0,245,212,0.15)] flex flex-col items-center gap-3">
          {dotsNode}
          {statusNode}
        </div>
      </div>
    );
  }

  // Fullscreen variant
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#02050B] text-slate-100 font-mono select-none",
        className
      )}
    >
      <span className="sr-only">{accessibleLabel}</span>
      {/* Subtle command-center grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,245,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,245,212,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-4 p-8 rounded-2xl bg-[#050A14]/90 border border-cyan-500/30 shadow-[0_0_50px_rgba(0,245,212,0.2)]">
        {dotsNode}
        {statusNode}
        <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
          SENTINEL DEFENSE GATEWAY // COMMAND INTERFACE
        </div>
      </div>
    </div>
  );
}
