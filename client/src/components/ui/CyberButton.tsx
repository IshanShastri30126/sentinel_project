"use client";

import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { SentinalLoader } from "./SentinalLoader";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-[#00F5D4] to-[#00E1FF] text-black shadow-[0_0_18px_rgba(0,245,212,0.35)] hover:shadow-[0_0_26px_rgba(0,245,212,0.55)] hover:brightness-105 border-0",
        secondary:
          "bg-[rgba(0,245,212,0.06)] text-[#00F5D4] border border-[rgba(0,245,212,0.3)] hover:bg-[rgba(0,245,212,0.14)] hover:border-[#00F5D4] hover:shadow-[0_0_16px_rgba(0,245,212,0.25)]",
        outline:
          "bg-transparent text-slate-200 border border-slate-700/80 hover:border-slate-500 hover:bg-slate-800/40 hover:text-white",
        ghost:
          "bg-transparent text-slate-400 hover:text-white hover:bg-white/[0.05] border-0",
        danger:
          "bg-transparent text-[#FF0055] border border-[rgba(255,0,85,0.4)] hover:bg-[rgba(255,0,85,0.12)] hover:border-[#FF0055] hover:shadow-[0_0_18px_rgba(255,0,85,0.35)]",
        warning:
          "bg-transparent text-[#FFB800] border border-[rgba(255,184,0,0.4)] hover:bg-[rgba(255,184,0,0.12)] hover:border-[#FFB800] hover:shadow-[0_0_18px_rgba(255,184,0,0.3)]",
        tactical:
          "bg-[#0B1320] text-[#00F5D4] border border-cyan-500/30 hover:border-[#00F5D4] hover:bg-[#111C2E] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
      },
      size: {
        sm: "h-8 px-3 text-[11px] rounded-sm",
        md: "h-10 px-4 text-xs rounded-md",
        lg: "h-12 px-6 text-sm rounded-md",
        icon: "h-9 w-9 p-0 rounded-md",
      },
      glow: {
        none: "",
        primary: "shadow-[0_0_20px_rgba(0,245,212,0.4)]",
        accent: "shadow-[0_0_20px_rgba(0,225,255,0.4)]",
        danger: "shadow-[0_0_20px_rgba(255,0,85,0.4)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      glow: "none",
    },
  }
);

export interface CyberButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showBrackets?: boolean;
}

/**
 * CyberButton
 *
 * Renders an accessible, themed interactive button for the cybersecurity platform.
 * Supports multiple tactical variants, loading spinner states, HUD brackets, and custom icons.
 *
 * @param {CyberButtonProps} props - Properties including variant, size, glow, loading, and icons.
 * @returns {JSX.Element} Rendered button element.
 */
export const CyberButton = forwardRef<HTMLButtonElement, CyberButtonProps>(
  (
    {
      className,
      variant,
      size,
      glow,
      isLoading = false,
      leftIcon,
      rightIcon,
      showBrackets = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          buttonVariants({ variant, size, glow }),
          showBrackets && "hud-brackets",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <SentinalLoader variant="inline" size="sm" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

CyberButton.displayName = "CyberButton";
