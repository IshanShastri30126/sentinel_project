"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Terminal } from "lucide-react";
import { CyberButton } from "./CyberButton";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * EmptyState
 *
 * Renders an empty data state interface with radar framing,
 * monospace diagnostics text, and an optional tactical CTA button.
 *
 * @param {EmptyStateProps} props - Icon, title, description, and action handlers.
 * @returns {JSX.Element} Rendered empty state container.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-xl border border-white/[0.08] bg-[#080E18]/60 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.1)]">
        {icon || <Terminal className="h-6 w-6" />}
      </div>
      <h4 className="font-sans text-base font-semibold text-slate-100 tracking-tight mb-1.5">
        {title}
      </h4>
      <p className="max-w-md font-mono text-xs text-slate-400 tracking-wide mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <CyberButton variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </CyberButton>
      )}
    </div>
  );
}
