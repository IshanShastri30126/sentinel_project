"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface HoloCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glareOpacity?: number;
  tiltAngle?: number;
}

/**
 * HoloCard
 *
 * Interactive card with subtle 3D rotational tilt and dynamic holographic
 * glare highlight tracking the user cursor.
 *
 * @param {HoloCardProps} props - Tilt intensity, glare reflection, and card attributes.
 * @returns {JSX.Element} Interactive 3D tilt card.
 */
export function HoloCard({
  children,
  glareOpacity = 0.15,
  tiltAngle = 10,
  className,
  ...props
}: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -tiltAngle;
    const rotateY = ((x - centerX) / centerX) * tiltAngle;

    setTransform(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
    );

    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: glareOpacity,
    });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: "transform 0.15s ease-out",
      }}
      className={cn(
        "relative rounded-xl border border-white/[0.08] bg-[#0A101C] overflow-hidden will-change-transform",
        className
      )}
      {...props}
    >
      {/* Glare spotlight overlay */}
      <div
        aria-hidden="true"
        style={{
          background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(0, 245, 212, ${glarePosition.opacity}), transparent 60%)`,
          transition: "opacity 0.2s ease-out",
        }}
        className="pointer-events-none absolute inset-0 z-10"
      />
      {children}
    </div>
  );
}
