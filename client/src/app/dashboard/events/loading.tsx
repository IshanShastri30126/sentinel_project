import React from "react";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto font-mono select-none animate-pulse">
      {/* Priority 2: Events Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#121F3D] pb-5">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-[#00F5D4]/20 rounded-md" />
          <div className="h-7 w-72 bg-slate-800 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-36 bg-slate-900 border border-[#121F3D] rounded-xl" />
          <div className="h-10 w-28 bg-[#00F5D4]/20 rounded-xl" />
        </div>
      </div>

      {/* Priority 2: Event Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-[#080E24] border border-[#121F3D] p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 w-16 bg-[#00F5D4]/30 rounded-full" />
                <div className="h-3 w-20 bg-slate-800 rounded-full" />
              </div>
              <div className="h-6 w-3/4 bg-slate-700 rounded-lg" />
              <div className="h-3.5 w-full bg-slate-800 rounded" />
              <div className="h-3.5 w-2/3 bg-slate-800/80 rounded" />
            </div>

            <div className="flex justify-between items-center border-t border-[#121F3D] pt-3">
              <div className="h-3 w-24 bg-slate-800 rounded" />
              <div className="h-4 w-4 bg-[#00F5D4]/40 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
