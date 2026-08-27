"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, Users, Mail, Info, LogIn, Eye } from "lucide-react";
import { api, getFileUrl } from "@/lib/api";
import { SentinalLogo } from "@/components/SentinalLogo";

const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: '1em', height: '1em' }}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: '1em', height: '1em' }}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: "1em", height: "1em" }}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const WhatsappIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: "1em", height: "1em" }}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.452L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.906-6.99C16.558 1.876 14.077.845 11.442.845 6.008.845 1.585 5.26 1.581 10.697c-.001 1.716.452 3.39 1.312 4.869l-.993 3.629 3.71-.973zm11.567-7.25c-.314-.157-1.859-.917-2.128-1.015-.27-.099-.465-.147-.659.148-.195.295-.754.95-.923 1.147-.17.197-.339.221-.653.064-1.294-.648-2.14-1.127-2.99-2.585-.224-.384.224-.356.643-1.198.07-.141.035-.264-.018-.372-.054-.108-.465-1.118-.637-1.532-.167-.403-.35-.347-.481-.353-.125-.006-.27-.008-.415-.008-.146 0-.383.055-.584.275-.2.22-.765.75-.765 1.83 0 1.078.784 2.12.893 2.27.109.15 1.543 2.356 3.738 3.302.522.224.93.359 1.249.46.525.166 1.002.143 1.379.088.42-.062 1.859-.76 2.128-1.492.27-.731.27-1.357.19-1.492-.08-.135-.295-.221-.609-.378z" />
  </svg>
);

// =========================================================
// 3D CONNECTED MESH CONSTELLATION BACKGROUND
// =========================================================
function TeamBackground3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const fov = 400;
    const R = Math.min(width, height) * 0.38;

    // 1. Constellation Nodes setup
    interface TeamNode {
      x: number;
      y: number;
      z: number;
      origX: number;
      origY: number;
      origZ: number;
      vx: number;
      vy: number;
      vz: number;
      color: string;
      size: number;
    }

    const nodes: TeamNode[] = [];
    const numNodes = 65;
    for (let i = 0; i < numNodes; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const radius = R * (0.35 + Math.random() * 0.7);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      nodes.push({
        x, y, z,
        origX: x, origY: y, origZ: z,
        vx: 0, vy: 0, vz: 0,
        color: Math.random() > 0.45 ? "rgba(220, 38, 38, " : "rgba(249, 115, 22, ",
        size: 1.2 + Math.random() * 2.2
      });
    }

    // 2. Detonated Sparks system
    interface Spark {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      alpha: number;
      color: string;
      size: number;
    }
    const sparks: Spark[] = [];

    // Scanner laser
    let scanY = 0;
    const scanSpeed = 2.0;

    // Rotations & drag
    let mouseX = -1000;
    let mouseY = -1000;
    let rotationY = 0;
    let rotationX = 0.1;
    let targetRotY = 0;
    let targetRotX = 0.1;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetRotY += deltaX * 0.005;
        targetRotX += deltaY * 0.005;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const distToCenter = Math.sqrt(Math.pow(e.clientX - (width / 2), 2) + Math.pow(e.clientY - (height / 2), 2));
      if (distToCenter < R * 1.5) {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        const cx = e.clientX - width / 2;
        const cy = e.clientY - height / 2;
        
        for (let s = 0; s < 25; s++) {
          const sa = Math.random() * Math.PI * 2;
          const sp = Math.acos((Math.random() * 2) - 1);
          const speed = 2 + Math.random() * 5;
          sparks.push({
            x: cx, y: cy, z: 0,
            vx: Math.sin(sp) * Math.cos(sa) * speed,
            vy: Math.sin(sp) * Math.sin(sa) * speed,
            vz: Math.cos(sp) * speed,
            alpha: 1.0,
            color: "rgba(220, 38, 38, ",
            size: 1.5 + Math.random() * 2
          });
        }

        nodes.forEach((node) => {
          const dx = node.x - cx;
          const dy = node.y - cy;
          const dz = node.z;
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
          if (dist < 200) {
            const force = (1 - dist / 200) * 16;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
            node.vz += (dz / dist) * force;
          }
        });
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      rotationY += (targetRotY - rotationY) * 0.05;
      rotationX += (targetRotX - rotationX) * 0.05;
      targetRotY += 0.0012; // slow drift

      const cosY = Math.cos(rotationY), sinY = Math.sin(rotationY);
      const cosX = Math.cos(rotationX), sinX = Math.sin(rotationX);

      const centerX = width / 2;
      const centerY = height / 2;

      // Project Nodes
      const projectedNodes = nodes.map((node) => {
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;

        node.vx += (node.origX - node.x) * 0.04;
        node.vy += (node.origY - node.y) * 0.04;
        node.vz += (node.origZ - node.z) * 0.04;

        node.vx *= 0.85;
        node.vy *= 0.85;
        node.vz *= 0.85;

        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.x * sinY + node.z * cosY;
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX;

        const scale = fov / Math.max(10, fov + z2);
        const px = centerX + x1 * scale;
        const py = centerY + y2 * scale;

        return {
          node,
          px,
          py,
          z: z2,
          scale
        };
      });

      // Connections between close nodes
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const n1 = projectedNodes[i];
          const n2 = projectedNodes[j];
          const dx = n1.node.x - n2.node.x;
          const dy = n1.node.y - n2.node.y;
          const dz = n1.node.z - n2.node.z;
          const dist3D = Math.sqrt(dx*dx + dy*dy + dz*dz);

          if (dist3D < 160) {
            const alpha = (1 - dist3D / 160) * 0.15 * (n1.z > 0 && n2.z > 0 ? 0.3 : 1);
            ctx.strokeStyle = `rgba(220, 38, 38, ${alpha})`;
            ctx.lineWidth = (1 - dist3D / 160) * 0.8;
            ctx.beginPath();
            ctx.moveTo(n1.px, n1.py);
            ctx.lineTo(n2.px, n2.py);
            ctx.stroke();
          }
        }
      }

      // Draw scanner
      scanY += scanSpeed;
      if (scanY > height + 200) scanY = -200;
      ctx.strokeStyle = "rgba(220, 38, 38, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();

      // Draw Nodes
      projectedNodes.forEach((item) => {
        const alpha = Math.max(0.1, 0.85 * (1 - item.z / R));
        ctx.fillStyle = `${item.node.color}${alpha * 0.12})`;
        ctx.beginPath();
        ctx.arc(item.px, item.py, item.node.size * 2 * item.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `${item.node.color}${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(item.px, item.py, item.node.size * item.scale, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update and Draw Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.z += sp.vz;
        sp.alpha -= 0.025;

        if (sp.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        const x1 = sp.x * cosY - sp.z * sinY;
        const z1 = sp.x * sinY + sp.z * cosY;
        const y2 = sp.y * cosX - z1 * sinX;
        const z2 = sp.y * sinX + z1 * cosX;

        const scale = fov / Math.max(10, fov + z2);
        const px = centerX + x1 * scale;
        const py = centerY + y2 * scale;

        ctx.fillStyle = `${sp.color}${sp.alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, sp.size * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Interactive Cursor HUD Vector locking
      if (mouseX > 0 && mouseY > 0) {
        projectedNodes.forEach((item) => {
          const dx = item.px - mouseX;
          const dy = item.py - mouseY;
          const dist = Math.sqrt(dx*dx + dy*dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.6;
            ctx.strokeStyle = `rgba(220, 38, 38, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(item.px, item.py);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();

            // Bracket lock UI
            const boxSize = 6 * item.scale;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
            ctx.strokeRect(item.px - boxSize, item.py - boxSize, boxSize * 2, boxSize * 2);
          }
        });
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-5" />;
}

// Helper to determine security clearance descriptions
const getClearanceLevel = (role: string) => {
  switch (role) {
    case "FACULTY":
      return "LVL_5 // FACULTY_ADMIN";
    case "STUDENT_COORDINATOR":
      return "LVL_4 // STUDENT_DIRECTOR";
    case "TECH":
      return "LVL_3 // CORE_TECH_SYS";
    case "SOCIAL_MEDIA":
    case "CONTENT":
      return "LVL_2 // CREATIVE_INTEL";
    default:
      return "LVL_1 // SEC_MEMBER";
  }
};

interface TeamMemberItem {
  id: string;
  name: string;
  role: string;
  designation: string;
  avatarUrl?: string;
  imageUrl?: string;
  coverPosterUrl?: string;
  cyberAvatarUrl?: string;
  bio?: string;
  about?: string;
  linkedin?: string;
  instagram?: string;
  email?: string;
}

const ROLE_LABELS: Record<string, string> = {
  FACULTY: "Faculty Mentor",
  STUDENT_COORDINATOR: "Coordinator",
  TECH: "Technical Lead",
  SOCIAL_MEDIA: "Creative Team",
  CONTENT: "Creative Team"
};

const TeamGrid = ({ list, title, tag }: { list: TeamMemberItem[]; title: string; tag: string }) => {
  const router = useRouter();
  if (list.length === 0) return null;

  return (
    <div className="mb-24">
      {/* Section Header with Cyber Line */}
      <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-4">
        <div className="w-1.5 h-6 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
        <div>
          <h2 className="text-xl font-black font-mono tracking-widest text-white uppercase">{title}</h2>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{tag}</p>
        </div>
      </div>

      {/* Roster Cards with 3D Circular Rotation Effect */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
        {list.map((member, idx) => {
          const linkedInUrl = member.linkedin ? `https://linkedin.com/in/${member.linkedin.trim()}` : `https://linkedin.com/search/results/all/?keywords=${encodeURIComponent(member.name)}`;
          const instagramUrl = member.instagram ? `https://www.instagram.com/${member.instagram.trim()}/` : `https://www.instagram.com/chakravyuh.charusat/`;
          const emailUrl = member.email ? `mailto:${member.email}` : `mailto:support@chakravyuhclub.com`;
          
          const rawImg = member.imageUrl || member.avatarUrl || member.coverPosterUrl || member.cyberAvatarUrl;
          const avatarSrc = rawImg ? getFileUrl(rawImg) : null;

          return (
            <div key={member.id || idx} style={{ perspective: 1200 }} className="w-full">
              <motion.div
                initial={{ opacity: 0, rotateY: -180, scale: 0.8, y: 40 }}
                whileInView={{ opacity: 1, rotateY: 0, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.85, delay: (idx % 3) * 0.15, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.25 } }}
                onClick={() => router.push(`/team/${member.id}`)}
                style={{ transformStyle: "preserve-3d" }}
                className="bg-[#050505] border border-zinc-800/80 hover:border-red-600/60 rounded-2xl relative overflow-hidden group transition-all duration-300 flex flex-col justify-between shadow-2xl hover:shadow-[0_0_35px_rgba(220,38,38,0.25)] cursor-pointer"
              >
                {/* Full Card Cover Image Background with Synchronized 3D Rotation */}
                <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-zinc-950 flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
                  {avatarSrc ? (
                    <motion.img
                      initial={{ rotateY: -90, scale: 1.2 }}
                      whileInView={{ rotateY: 0, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: (idx % 3) * 0.15 + 0.1, ease: "easeOut" }}
                      src={avatarSrc}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex items-center justify-center relative">
                      <motion.div 
                        initial={{ rotateY: -180 }}
                        whileInView={{ rotateY: 0 }}
                        transition={{ duration: 0.85, delay: (idx % 3) * 0.15 }}
                        className="w-24 h-24 rounded-2xl bg-red-600/10 border-2 border-red-500/30 flex items-center justify-center text-red-500 font-mono text-4xl font-extrabold shadow-[0_0_30px_rgba(220,38,38,0.2)]"
                      >
                        {member.name.charAt(0)}
                      </motion.div>
                    </div>
                  )}

                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent pointer-events-none" />

                  {/* Clearance Tag at Top Right */}
                  <div className="absolute top-3 right-3 text-[9px] font-mono text-zinc-400 bg-black/80 border border-zinc-800 group-hover:border-red-500/50 group-hover:text-red-400 px-2.5 py-1 rounded-full uppercase tracking-widest font-bold backdrop-blur-md z-10 shadow-md transition-colors">
                    {getClearanceLevel(member.role)}
                  </div>
                </div>

                {/* Center Aligned Name & Designation */}
                <div className="p-5 text-center flex flex-col items-center justify-center space-y-1 bg-[#050505]">
                  <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors font-mono line-clamp-1 text-center">
                    {member.name}
                  </h3>
                  <p className="text-xs text-red-500 font-mono tracking-wider font-semibold uppercase text-center">
                    {member.designation}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase text-center mt-0.5">
                    {ROLE_LABELS[member.role] || member.role}
                  </p>
                </div>

                {/* Bottom Public Profile View Link & Social Icons */}
                <div className="px-5 pb-5 pt-3 border-t border-zinc-900/80 flex items-center justify-between bg-[#050505]">
                  {/* Public Profile View Link */}
                  <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 group-hover:text-red-400 transition-colors font-bold uppercase tracking-wider">
                    <Eye className="w-4 h-4 text-red-500" />
                    <span>View Profile</span>
                  </div>

                  {/* External Social Icons */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-red-500 hover:bg-red-500/10 hover:shadow-[0_0_10px_rgba(220,38,38,0.4)] transition-all"
                      title="LinkedIn Profile"
                    >
                      <LinkedinIcon className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-red-500 hover:bg-red-500/10 hover:shadow-[0_0_10px_rgba(220,38,38,0.4)] transition-all"
                      title="Instagram Profile"
                    >
                      <InstagramIcon className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={emailUrl}
                      className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-red-500 hover:bg-red-500/10 hover:shadow-[0_0_10px_rgba(220,38,38,0.4)] transition-all"
                      title="Secure Broadcast Mail"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMemberItem[]>([]);

  useEffect(() => {
    api<{ team: TeamMemberItem[] }>("/settings/landing-team").then((res) => {
      if (res.team) setTeam(res.team);
    }).catch(console.error);
  }, []);

  // Filter Categories
  const facultyList = team.filter((m) => m.role === "FACULTY" || m.designation.toLowerCase().includes("faculty"));
  const coordinatorsList = team.filter((m) => m.role === "STUDENT_COORDINATOR");
  const techList = team.filter((m) => m.role === "TECH");
  const creativeList = team.filter((m) => m.role === "SOCIAL_MEDIA" || m.role === "CONTENT");
  const generalList = team.filter((m) => 
    m.role !== "FACULTY" && 
    !m.designation.toLowerCase().includes("faculty") &&
    m.role !== "STUDENT_COORDINATOR" &&
    m.role !== "TECH" &&
    m.role !== "SOCIAL_MEDIA" &&
    m.role !== "CONTENT"
  );


  return (
    <div className="min-h-screen bg-black text-white overflow-hidden font-sans relative selection:bg-red-500/30">
      
      {/* 3D connected Constellation Background */}
      <div className="fixed inset-0 z-0 pointer-events-none perspective-1000 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
        
        {/* Connected team constellation canvas */}
        <TeamBackground3D />
        
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay z-20" />
      </div>

      {/* Navbar */}
      <header className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto border-b border-white/10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <SentinalLogo animateDrawing={true} />
            </Link>
          </div>

        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 sm:gap-5">
          <Link href="/about" className="md:hidden flex items-center justify-center p-1.5 text-slate-300 hover:text-white transition-colors" title="About">
            <Info className="w-5 h-5" />
          </Link>
          <Link href="/team" className="md:hidden flex items-center justify-center p-1.5 text-red-400 hover:text-white transition-colors" title="Crew">
            <Users className="w-5 h-5" />
          </Link>
          <Link href="/auth" className="md:hidden flex items-center justify-center p-1.5 text-slate-400 hover:text-white transition-colors" title="Sign In">
            <LogIn className="w-5 h-5" />
          </Link>
        </motion.div>
      </header>

      <main className="relative z-10 pt-16 pb-32 px-6 max-w-7xl mx-auto">
        <div className="mb-12" />

        {/* Categorized grids */}
        {team.length === 0 ? (
          <div className="text-center py-20 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl max-w-2xl mx-auto p-8">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold font-mono text-white uppercase tracking-wider mb-2">No Officers Registered</h3>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              The member directory is currently empty. Officers will be listed once configured by administration.
            </p>
          </div>
        ) : (
          <>
            <TeamGrid list={facultyList} title="Faculty Mentors" tag="[// FACULTY_MENTORS_CLEARANCE_LVL_5]" />
            <TeamGrid list={coordinatorsList} title="Student Coordinators" tag="[// STUDENT_OPERATIONS_HUB_CLEARANCE_LVL_4]" />
            <TeamGrid list={techList} title="Technical Division" tag="[// CORE_TECHNICAL_FORCE_CLEARANCE_LVL_3]" />
            <TeamGrid list={creativeList} title="Creative & Media Division" tag="[// CREATIVE_MEDIA_UNIT_CLEARANCE_LVL_2]" />
            <TeamGrid list={generalList} title="Additional Officers" tag="[// OFFICERS_CLEARANCE_LVL_1]" />
          </>
        )}

        {/* Join Our Team Call-To-Action Banner Section */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#080E24] via-zinc-950 to-black border-2 border-red-600/40 relative overflow-hidden shadow-[0_0_40px_rgba(220,38,38,0.2)] text-center"
        >
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-red-600/10 to-transparent pointer-events-none" />
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <span className="px-4 py-1.5 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-mono font-bold uppercase tracking-widest inline-flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-red-500" /> JOIN THE CHAKRAVYUH RECRUITMENT FORCE
            </span>
            <h2 className="text-3xl sm:text-5xl font-black font-mono uppercase tracking-tight text-white">
              Ready to Join Our Crew?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base font-sans leading-relaxed">
              We are constantly seeking passionate cybersecurity researchers, developers, CTF players, and creative leads to join our elite defense unit.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://chat.whatsapp.com/chakravyuh"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-mono font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-[0_0_25px_rgba(220,38,38,0.5)] flex items-center gap-2"
              >
                <Users className="w-4 h-4" /> Apply to Join Crew
              </a>
              <Link
                href="/auth"
                className="px-8 py-3.5 rounded-full bg-black/80 border border-zinc-700 text-slate-200 font-mono font-bold uppercase tracking-widest text-xs hover:border-red-500 hover:text-white transition-all flex items-center gap-2"
              >
                <LogIn className="w-4 h-4 text-red-400" /> Member Gateway
              </Link>
            </div>
          </div>
        </motion.section>

      </main>
      
      {/* Footer */}
      <footer className="border-t border-[#121F3D] bg-[#030712] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <SentinalLogo animateDrawing={false} />
          </div>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a href="https://linkedin.com/company/chakravyuh" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-white/10 hover:border-[#FFD700] hover:text-[#FFD700] hover:bg-[#FFD700]/10 transition-all text-zinc-400" title="LinkedIn">
              <LinkedinIcon className="w-5 h-5" />
            </a>
            <a href="https://www.instagram.com/chakravyuh.charusat/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-white/10 hover:border-[#00F5D4] hover:text-[#00F5D4] hover:bg-[#00F5D4]/10 transition-all text-zinc-400" title="Instagram">
              <InstagramIcon className="w-5 h-5" />
            </a>
            <a href="https://chat.whatsapp.com/chakravyuh" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-white/10 hover:border-[#FFD700] hover:text-[#FFD700] hover:bg-[#FFD700]/10 transition-all text-zinc-400" title="WhatsApp Community">
              <WhatsappIcon className="w-5 h-5" />
            </a>
          </div>

          <p className="text-zinc-500 text-sm">© {new Date().getFullYear()} Chakravyuh Club. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating Social Links Dock */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <a href="https://linkedin.com/company/chakravyuhclub" target="_blank" rel="noopener noreferrer"
           className="w-11 h-11 rounded-full bg-black/80 border border-zinc-800 flex items-center justify-center hover:border-red-500 text-zinc-400 hover:text-red-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] flex items-center justify-center"
           title="Chakravyuh LinkedIn">
           <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
        </a>
        <a href="https://www.instagram.com/chakravyuh.charusat/" target="_blank" rel="noopener noreferrer"
           className="w-11 h-11 rounded-full bg-black/80 border border-zinc-800 flex items-center justify-center hover:border-red-500 text-zinc-400 hover:text-red-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] flex items-center justify-center"
           title="Chakravyuh Instagram">
           <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        </a>
        <a href="https://chat.whatsapp.com/chakravyuhclub" target="_blank" rel="noopener noreferrer"
           className="w-11 h-11 rounded-full bg-black/80 border border-zinc-800 flex items-center justify-center hover:border-red-500 text-zinc-400 hover:text-red-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] flex items-center justify-center text-lg leading-none"
           title="Join WhatsApp Group">
           <span>💬</span>
        </a>
      </div>
    </div>
  );
}
