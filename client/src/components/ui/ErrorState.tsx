"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { CyberButton } from "./CyberButton";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  code?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * ErrorState
 *
 * Operational incident alert card displaying error codes, diagnostics,
 * and a tactical retry action for failed network or data transactions.
 *
 * @param {ErrorStateProps} props - Error details, failure code, and retry trigger.
 * @returns {JSX.Element} Rendered incident error container.
 */
export function ErrorState({
  title = "SECURITY TELEMETRY ALERT",
  message,
  code = "ERR_REQ_FAILURE",
  onRetry,
  retryLabel = "RETRY OPERATION",
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 md:p-8 text-center rounded-xl border border-[rgba(255,0,85,0.3)] bg-[#10070B]/80 backdrop-blur-sm shadow-[0_4px_24px_rgba(255,0,85,0.08)]",
        className
      )}
      {...props}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-[rgba(255,0,85,0.4)] bg-[rgba(255,0,85,0.1)] text-[#FF0055] shadow-[0_0_20px_rgba(255,0,85,0.2)]">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold text-[#FF0055] bg-[rgba(255,0,85,0.12)] mb-2">
        <span>INCIDENT CODE:</span>
        <span className="underline">{code}</span>
      </div>
      <h4 className="font-sans text-base font-semibold text-slate-100 mb-1">
        {title}
      </h4>
      <p className="max-w-md font-mono text-xs text-slate-400 mb-5">
        {message}
      </p>
      {onRetry && (
        <CyberButton
          variant="danger"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          {retryLabel}
        </CyberButton>
      )}
    </div>
  );
}
