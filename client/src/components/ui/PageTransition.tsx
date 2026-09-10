"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageTransition
 *
 * Smooth page-level view transition wrapper ensuring cohesive transitions
 * between routes without layout shifts or jarring jumps.
 *
 * @param {PageTransitionProps} props - Children elements and optional wrapper class names.
 * @returns {JSX.Element} Motion-wrapped container.
 */
export function PageTransition({
  children,
  className,
}: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={cn("w-full", className)}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
}
