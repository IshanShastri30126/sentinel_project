"use client";

import React, { useEffect, useRef } from "react";

interface NodeParticle {
  angle: number;
  radiusRatio: number;
  speed: number;
  size: number;
  isGreen: boolean;
}

interface PlexusBackgroundProps {
  className?: string;
  opacity?: number;
}

export default function PlexusBackground({ className = "", opacity = 1 }: PlexusBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Large background logo concentric tiers
    const tierRatios = [1.0, 0.84, 0.68, 0.52, 0.36, 0.22];

    const particles: NodeParticle[] = [];
    tierRatios.forEach((ratio, tierIdx) => {
      const count = 8 + tierIdx * 5;
      for (let i = 0; i < count; i++) {
        particles.push({
          angle: (i / count) * Math.PI * 2,
          radiusRatio: ratio,
          speed: (tierIdx % 2 === 0 ? 1 : -1) * (0.0025 + 0.001 * tierIdx),
          size: Math.random() * 2.5 + 2.0,
          isGreen: tierIdx % 2 === 0,
        });
      }
    });

    let globalRotation = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      // Increased max radius for large background logo presence
      const maxRadius = Math.max(Math.min(width, height) * 0.48, Math.max(width, height) * 0.38);

      globalRotation += 0.0025;

      // 1. Draw Radial Energy Rays / Spokes
      const numSpokes = 16;
      for (let s = 0; s < numSpokes; s++) {
        const spokeAngle = (s / numSpokes) * Math.PI * 2 + globalRotation * 0.3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(spokeAngle) * maxRadius,
          centerY + Math.sin(spokeAngle) * maxRadius
        );
        ctx.strokeStyle = "rgba(0, 225, 255, 0.07)";
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // 2. Draw Rotating Broken Lines (Long Dashes) with Bright Neon Glow (NO TRIANGLE IN CENTER)

      // Tier 1: Outer Green Rotating Broken Ring (Long Dashes)
      const r1 = maxRadius * tierRatios[0];
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(globalRotation * 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, r1, 0, Math.PI * 2);
      ctx.setLineDash([70, 22, 110, 22, 80, 22]); // Long broken line segments
      // Simulated glow (fast)
      ctx.strokeStyle = "rgba(0, 255, 102, 0.15)";
      ctx.lineWidth = 7.5;
      ctx.stroke();
      // Main ring
      ctx.strokeStyle = "rgba(0, 255, 102, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // Tier 2: Electric Blue Counter-Rotating Broken Ring (Long Dashes)
      const r2 = maxRadius * tierRatios[1];
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-globalRotation * 1.1);
      ctx.beginPath();
      ctx.arc(0, 0, r2, 0, Math.PI * 2);
      ctx.setLineDash([90, 25, 60, 25, 120, 25]); // Long broken line segments
      // Simulated glow (fast)
      ctx.strokeStyle = "rgba(0, 225, 255, 0.15)";
      ctx.lineWidth = 6.6;
      ctx.stroke();
      // Main ring
      ctx.strokeStyle = "rgba(0, 225, 255, 0.9)";
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();

      // Tier 3: Green Inner Rotating Broken Ring
      const r3 = maxRadius * tierRatios[2];
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(globalRotation * 0.6);
      ctx.beginPath();
      ctx.arc(0, 0, r3, 0, Math.PI * 2);
      ctx.setLineDash([55, 20, 85, 20]);
      // Simulated glow (fast)
      ctx.strokeStyle = "rgba(0, 255, 102, 0.15)";
      ctx.lineWidth = 6.0;
      ctx.stroke();
      // Main ring
      ctx.strokeStyle = "rgba(0, 255, 102, 0.85)";
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.restore();

      // Tier 4: Blue Inner Counter-Rotating Broken Ring
      const r4 = maxRadius * tierRatios[3];
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-globalRotation * 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, r4, 0, Math.PI * 2);
      ctx.setLineDash([80, 22, 45, 22, 100, 22]);
      // Simulated glow (fast)
      ctx.strokeStyle = "rgba(0, 225, 255, 0.15)";
      ctx.lineWidth = 5.4;
      ctx.stroke();
      // Main ring
      ctx.strokeStyle = "rgba(0, 225, 255, 0.85)";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();

      // Tier 5: Green Core Defense Broken Ring
      const r5 = maxRadius * tierRatios[4];
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(globalRotation * 1.3);
      ctx.beginPath();
      ctx.arc(0, 0, r5, 0, Math.PI * 2);
      ctx.setLineDash([60, 18, 90, 18]);
      // Simulated glow (fast)
      ctx.strokeStyle = "rgba(0, 255, 102, 0.15)";
      ctx.lineWidth = 6.0;
      ctx.stroke();
      // Main ring
      ctx.strokeStyle = "rgba(0, 255, 102, 0.85)";
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.restore();

      // Tier 6: Blue Center Eye Broken Ring
      const r6 = maxRadius * tierRatios[5];
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-globalRotation * 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, r6, 0, Math.PI * 2);
      ctx.setLineDash([40, 16, 75, 16]);
      // Simulated glow (fast)
      ctx.strokeStyle = "rgba(0, 225, 255, 0.15)";
      ctx.lineWidth = 6.6;
      ctx.stroke();
      // Main ring
      ctx.strokeStyle = "rgba(0, 225, 255, 0.9)";
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();

      // 3. Draw Orbiting Energetic Nodes along the rings
      particles.forEach((p) => {
        p.angle += p.speed;
        const currentRadius = maxRadius * p.radiusRatio;
        const x = centerX + Math.cos(p.angle) * currentRadius;
        const y = centerY + Math.sin(p.angle) * currentRadius;

        // Glow layer (fast)
        ctx.beginPath();
        ctx.arc(x, y, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = p.isGreen ? "rgba(0, 255, 102, 0.18)" : "rgba(0, 225, 255, 0.18)";
        ctx.fill();

        // Main core
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.isGreen ? "rgba(0, 255, 102, 0.95)" : "rgba(0, 225, 255, 0.95)";
        ctx.fill();
      });

      // 4. Central Core Eye with Intense Neon Glow
      // Large glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, 24, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 255, 102, 0.15)";
      ctx.fill();

      // Core green
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 255, 102, 0.95)";
      ctx.fill();

      // Inner blue glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 225, 255, 0.15)";
      ctx.fill();

      // Core blue
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#00E1FF";
      ctx.fill();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none block z-0 ${className}`}
      style={{ mixBlendMode: "screen", opacity }}
    />
  );
}
