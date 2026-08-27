import React from "react";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto font-mono select-none animate-pulse">
      {/* Priority 1: Overview Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#121F3D] pb-5">
        <div className="space-y-2">
          <div className="h-4 w-36 bg-[#00F5D4]/20 rounded-md" />
          <div className="h-7 w-64 bg-slate-800 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-slate-900 border border-[#121F3D] rounded-xl" />
          <div className="h-10 w-32 bg-[#00F5D4]/20 rounded-xl" />
        </div>
      </div>

      {/* Priority 1: Core Stat Tiles Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-[#080E24] border border-[#121F3D] p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-slate-700 rounded" />
              <div className="h-6 w-6 rounded-lg bg-[#00F5D4]/20" />
            </div>
            <div className="h-8 w-16 bg-[#00F5D4]/30 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Priority 2: Events & Operational Modules Loading Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 rounded-2xl bg-[#080E24] border border-[#121F3D] p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-[#121F3D] pb-3">
            <div className="h-4 w-40 bg-[#00E1FF]/20 rounded" />
            <div className="h-3 w-16 bg-slate-800 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((k) => (
              <div key={k} className="h-16 rounded-xl bg-slate-900/60 border border-white/5 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-36 bg-slate-700 rounded" />
                    <div className="h-2.5 w-24 bg-slate-800 rounded" />
                  </div>
                </div>
                <div className="h-6 w-16 rounded-md bg-[#00F5D4]/10" />
              </div>
            ))}
          </div>
        </div>

        <div className="h-80 rounded-2xl bg-[#080E24] border border-[#121F3D] p-6 space-y-4">
          <div className="h-4 w-32 bg-[#00F5D4]/20 rounded border-b border-[#121F3D] pb-3" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-10 rounded-lg bg-slate-900/40 border border-white/5" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
