"use client";

import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative rounded-lg border transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-[#0B1320]/90 border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.6)]",
        glass:
          "bg-[#060B12]/80 backdrop-blur-xl border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.7)]",
        interactive:
          "bg-[#0B1320]/90 border-white/[0.08] hover:border-[rgba(0,245,212,0.4)] hover:shadow-[0_0_24px_rgba(0,245,212,0.12),0_8px_32px_rgba(0,0,0,0.8)] cursor-pointer",
        hud:
          "bg-[#080D17]/95 border-cyan-500/20 hud-brackets shadow-[0_4px_24px_rgba(0,0,0,0.7)]",
        panel:
          "bg-[#060B12] border-white/[0.06] shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CyberCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  showAccentTop?: boolean;
  accentColor?: "primary" | "accent" | "danger" | "warning";
}

/**
 * CyberCard
 *
 * Primary container component for data panels, operational dashboards,
 * and event cards with customizable variants, HUD brackets, and glowing top accents.
 *
 * @param {CyberCardProps} props - Card variant, top accent line, and standard HTML div attributes.
 * @returns {JSX.Element} Rendered card container.
 */
export const CyberCard = forwardRef<HTMLDivElement, CyberCardProps>(
  (
    {
      className,
      variant,
      showAccentTop = false,
      accentColor = "primary",
      children,
      ...props
    },
    ref
  ) => {
    const accentBorderColor =
      accentColor === "primary"
        ? "from-[#00F5D4] via-[#00E1FF] to-transparent"
        : accentColor === "accent"
        ? "from-[#00E1FF] via-blue-500 to-transparent"
        : accentColor === "danger"
        ? "from-[#FF0055] via-rose-500 to-transparent"
        : "from-[#FFB800] via-amber-500 to-transparent";

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant }), className)}
        {...props}
      >
        {showAccentTop && (
          <div
            className={cn(
              "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r",
              accentBorderColor
            )}
          />
        )}
        {children}
      </div>
    );
  }
);

CyberCard.displayName = "CyberCard";

export function CyberCardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-5 border-b border-white/[0.06]", className)}
      {...props}
    />
  );
}

export function CyberCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-sans text-base font-semibold tracking-tight text-slate-100",
        className
      )}
      {...props}
    />
  );
}

export function CyberCardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("font-mono text-xs text-slate-400 tracking-wide", className)}
      {...props}
    />
  );
}

export function CyberCardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CyberCardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center p-5 pt-0 border-t border-white/[0.04] mt-auto", className)}
      {...props}
    />
  );
}
