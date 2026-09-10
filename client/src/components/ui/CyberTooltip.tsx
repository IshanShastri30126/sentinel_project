"use client";

import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const CyberTooltipProvider = TooltipPrimitive.Provider;
export const CyberTooltip = TooltipPrimitive.Root;
export const CyberTooltipTrigger = TooltipPrimitive.Trigger;

/**
 * CyberTooltipContent
 *
 * Floating tactical tooltip panel with monospace font, subtle glow,
 * and high z-index elevation.
 */
export const CyberTooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded bg-[#09101B] px-3 py-1.5 font-mono text-[11px] text-slate-200 shadow-md",
      "border border-cyan-500/30 shadow-[0_4px_16px_rgba(0,0,0,0.8),0_0_12px_rgba(0,245,212,0.15)]",
      "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));
CyberTooltipContent.displayName = TooltipPrimitive.Content.displayName;
