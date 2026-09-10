"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CyberSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "pulse" | "shimmer";
}

/**
 * CyberSkeleton
 *
 * Content placeholder skeleton that renders a high-tech shimmering animation
 * for loading states without visual layout jarring.
 *
 * @param {CyberSkeletonProps} props - HTML div attributes with optional shimmer variant.
 * @returns {JSX.Element} Rendered skeleton element.
 */
export function CyberSkeleton({
  className,
  variant = "shimmer",
  ...props
}: CyberSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded bg-[#0B1320] relative overflow-hidden",
        variant === "pulse" && "animate-pulse",
        variant === "shimmer" &&
          "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.05] before:to-transparent",
        className
      )}
      {...props}
    />
  );
}
