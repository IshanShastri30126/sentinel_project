"use client";
import React from "react";
import { SentinalLoader } from "@/components/ui/SentinalLoader";

/**
 * Loading boundary for the users route segment.
 * Displayed by Next.js during server-component data fetching transitions.
 * Uses the canonical SentinalLoader (fullscreen variant) for visual consistency
 * across all SENTINAL dashboard sections.
 */
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] w-full">
      <SentinalLoader variant="card" size="lg" text="LOADING IDENTITY REGISTRY..." />
    </div>
  );
}
