"use client";

import React from "react";
import { cn } from "@/lib/utils";

export const CyberTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-lg border border-white/[0.08] bg-[#070D16]">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm text-slate-200", className)}
      {...props}
    />
  </div>
));
CyberTable.displayName = "CyberTable";

export const CyberTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "border-b border-white/[0.08] bg-[#0B1320] text-xs font-mono uppercase tracking-wider text-slate-400",
      className
    )}
    {...props}
  />
));
CyberTableHeader.displayName = "CyberTableHeader";

export const CyberTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
CyberTableBody.displayName = "CyberTableBody";

export const CyberTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-white/[0.05] transition-colors hover:bg-cyan-500/[0.04] data-[state=selected]:bg-cyan-500/[0.08]",
      className
    )}
    {...props}
  />
));
CyberTableRow.displayName = "CyberTableRow";

export const CyberTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-4 text-left align-middle font-mono font-semibold text-slate-300 [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
CyberTableHead.displayName = "CyberTableHead";

export const CyberTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
CyberTableCell.displayName = "CyberTableCell";
