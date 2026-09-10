"use client";

import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const CyberDialog = DialogPrimitive.Root;
export const CyberDialogTrigger = DialogPrimitive.Trigger;
export const CyberDialogPortal = DialogPrimitive.Portal;
export const CyberDialogClose = DialogPrimitive.Close;

/**
 * CyberDialogOverlay
 *
 * Translucent, backdrop-blurred dim layer behind the tactical dialog window.
 */
export const CyberDialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
CyberDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * CyberDialogContent
 *
 * Tactical command modal container with corner brackets, subtle cyber border,
 * close button, and high-performance entry transition.
 */
export const CyberDialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showBrackets?: boolean;
  }
>(({ className, children, showBrackets = true, ...props }, ref) => (
  <CyberDialogPortal>
    <CyberDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4",
        "bg-[#090F19] border border-cyan-500/25 p-6 shadow-[0_16px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,245,212,0.1)] rounded-xl duration-200",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        showBrackets && "hud-brackets",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm p-1 text-slate-400 opacity-70 transition-opacity hover:opacity-100 hover:text-white focus:outline-none focus:ring-1 focus:ring-[#00F5D4] disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </CyberDialogPortal>
));
CyberDialogContent.displayName = DialogPrimitive.Content.displayName;

export function CyberDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left border-b border-white/[0.06] pb-3", className)}
      {...props}
    />
  );
}

export function CyberDialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "font-sans text-lg font-semibold tracking-tight text-slate-100",
        className
      )}
      {...props}
    />
  );
}

export function CyberDialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <DialogPrimitive.Description
      className={cn("font-mono text-xs text-slate-400 tracking-wide", className)}
      {...props}
    />
  );
}

export function CyberDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-3 border-t border-white/[0.06]",
        className
      )}
      {...props}
    />
  );
}
