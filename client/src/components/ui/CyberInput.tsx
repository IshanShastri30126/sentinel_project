"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CyberInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isMobileInput?: boolean;
}

/**
 * CyberInput
 *
 * Form input component designed with cybersecurity terminal aesthetics.
 * Supports leading/trailing icons, error alerts, and built-in mobile validation
 * restricting input strictly to 10 integer digits per security guidelines.
 *
 * @param {CyberInputProps} props - Field attributes, icons, validation, and labels.
 * @returns {JSX.Element} Rendered input group.
 */
export const CyberInput = forwardRef<HTMLInputElement, CyberInputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isMobileInput = false,
      onChange,
      ...props
    },
    ref
  ) => {
    /**
     * handleInputChange
     *
     * Intercepts input changes when mobile validation is active, stripping non-digit characters
     * and bounding input to exactly 10 numeric characters.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} event - Synthetic change event from input.
     */
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (isMobileInput) {
        // Enforce strict 10-digit integer constraint
        const rawValue = event.target.value;
        const sanitized = rawValue.replace(/\D/g, "").slice(0, 10);
        event.target.value = sanitized;
      }
      if (onChange) {
        onChange(event);
      }
    };

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block font-mono text-xs font-medium uppercase tracking-wider text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            onChange={handleInputChange}
            maxLength={isMobileInput ? 10 : props.maxLength}
            className={cn(
              "w-full h-10 rounded-md bg-[#070D16] border border-white/[0.12] px-3.5 text-sm font-sans text-slate-100 placeholder:text-slate-500 transition-all duration-200",
              "focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4]/40 focus:shadow-[0_0_15px_rgba(0,245,212,0.15)]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-900/50",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-[#FF0055] focus:border-[#FF0055] focus:ring-[#FF0055]/30 focus:shadow-[0_0_15px_rgba(255,0,85,0.2)]",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="font-mono text-xs text-[#FF0055] tracking-wide flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-[#FF0055]" />
            {error}
          </p>
        ) : helperText ? (
          <p className="font-mono text-xs text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

CyberInput.displayName = "CyberInput";
