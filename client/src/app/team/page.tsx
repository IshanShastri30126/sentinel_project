"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Users, Mail, Eye } from "lucide-react";
import { api, getFileUrl } from "@/lib/api";
import { FALLBACK_TEAM_CADRE, formatSocialUrl, TeamCadreMember } from "@/lib/fallbackTeam";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { CyberBadge } from "@/components/ui/CyberBadge";
import { CyberButton } from "@/components/ui/CyberButton";
import { SystemLabel } from "@/components/ui/SystemLabel";
import { SectionReveal } from "@/components/ui/SectionReveal";
import { BorderBeam } from "@/components/effects/BorderBeam";

const LinkedinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: '1em', height: '1em' }}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: "1em", height: "1em" }}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

/**
 * TeamBackground3D
 *
 * Renders an ambient rotating 3D node constellation in cyber cyan and teal.
 */
function TeamBackground3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const fov = 400;
    const R = Math.min(width, height) * 0.38;

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
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = R * (0.35 + Math.random() * 0.7);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      nodes.push({
        x,
        y,
        z,
        origX: x,
        origY: y,
        origZ: z,
        vx: 0,
        vy: 0,
        vz: 0,
        color: Math.random() > 0.45 ? "rgba(0, 245, 212, " : "rgba(0, 225, 255, ",
        size: 1.2 + Math.random() * 2.2,
      });
    }

    let rotX = 0;
    let rotY = 0;
    let animId: number;
    let scanY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      rotY += 0.002;
      rotX += 0.001;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const centerX = width / 2;
      const centerY = height / 2;

      const projected = nodes.map((node) => {
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.x * sinY + node.z * cosY;
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX;

        const scale = fov / Math.max(10, fov + z2);
        const px = centerX + x1 * scale;
        const py = centerY + y2 * scale;

        return { px, py, scale, z: z2, node };
      });

      // Draw connection lines
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const n1 = projected[i];
          const n2 = projected[j];
          const dx = n1.node.x - n2.node.x;
          const dy = n1.node.y - n2.node.y;
          const dz = n1.node.z - n2.node.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.15;
            ctx.strokeStyle = `rgba(0, 245, 212, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(n1.px, n1.py);
            ctx.lineTo(n2.px, n2.py);
            ctx.stroke();
          }
        }
      }

      // Scanner ray
      scanY += 1.5;
      if (scanY > height + 200) scanY = -200;
      ctx.strokeStyle = "rgba(0, 245, 212, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();

      // Draw nodes
      projected.forEach((item) => {
        const alpha = Math.max(0.1, 0.8 * (1 - item.z / R));
        ctx.fillStyle = `${item.node.color}${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(item.px, item.py, item.node.size * item.scale, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-5" />;
}

const getClearanceLevel = (role: string) => {
  switch (role) {
    case "FACULTY_COORDINATOR":
      return "LVL_5 // FACULTY_ADMIN";
    case "STUDENT_COORDINATOR":
      return "LVL_4 // STUDENT_DIRECTOR";
    case "DEVELOPMENT_TEAM":
    case "TECH_COORDINATOR":
      return "LVL_3 // CORE_TECH_SYS";
    case "SOCIAL_MEDIA_COORDINATOR":
    case "SOCIAL_MEDIA":
    case "CONTENT":
      return "LVL_2 // CREATIVE_INTEL";
    default:
      return "LVL_1 // SEC_MEMBER";
  }
};

type TeamMemberItem = TeamCadreMember;

const ROLE_LABELS: Record<string, string> = {
  FACULTY_COORDINATOR: "Faculty Mentor",
  FACULTY: "Faculty Mentor",
  STUDENT_COORDINATOR: "Coordinator",
  DEVELOPMENT_TEAM: "Technical Lead",
  TECH_COORDINATOR: "Technical Lead",
  TECH: "Technical Lead",
  SOCIAL_MEDIA_COORDINATOR: "Creative Team",
  SOCIAL_MEDIA: "Creative Team",
  CONTENT: "Creative Team",
};

/**
 * TeamMemberCard
 *
 * Renders an operative card with resilient image error handling,
 * falling back to the cyber operative asset if remote images fail to load.
 */
const TeamMemberCard = ({ member, idx }: { member: TeamMemberItem; idx: number }) => {
  const router = useRouter();
  const [imageFailed, setImageFailed] = useState(false);

  const linkedInUrl = formatSocialUrl("linkedin", member.linkedin);
  const instagramUrl = formatSocialUrl("instagram", member.instagram);
  const emailUrl = member.email ? `mailto:${member.email.trim()}` : `mailto:support@sentinelclub.com`;

  const rawImg = member.imageUrl || member.avatarUrl || member.cyberAvatarUrl || member.coverPosterUrl;
  const avatarSrc = rawImg ? getFileUrl(rawImg) : null;

  return (
    <div className="w-full">
      <SectionReveal delay={(idx % 3) * 0.1}>
        <div
          onClick={() => router.push(`/team/${member.id}`)}
          className="rounded-xl bg-[#060C16] border border-white/[0.08] hover:border-cyan-500/40 relative overflow-hidden group transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-[0_0_25px_rgba(0,245,212,0.15)] cursor-pointer"
        >
          {/* Photo Container */}
          <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#040810] flex items-center justify-center">
            {avatarSrc && !imageFailed ? (
              <img
                src={avatarSrc}
                alt={member.name}
                onError={() => setImageFailed(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
              />
            ) : (
              <div className="w-full h-full bg-[#050A14] flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(0,245,212,0.35)_0%,transparent_70%)]" />
                <img
                  src="/images/cyber_avatar.png"
                  alt="Operative Avatar"
                  className="w-32 h-32 object-contain opacity-75 group-hover:opacity-95 transition-opacity"
                />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#060C16] via-[#060C16]/40 to-transparent pointer-events-none" />

            <div className="absolute top-3 right-3 z-10">
              <CyberBadge variant="normal" size="sm">
                {getClearanceLevel(member.role)}
              </CyberBadge>
            </div>
          </div>

          {/* Body Info */}
          <div className="p-5 text-center flex flex-col items-center justify-center space-y-1 bg-[#060C16]">
            <h3 className="text-lg font-bold text-white group-hover:text-[#00F5D4] transition-colors font-mono line-clamp-1">
              {member.name}
            </h3>
            <p className="text-xs text-[#00F5D4] font-mono tracking-wider font-semibold uppercase">
              {member.designation}
            </p>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">
              {ROLE_LABELS[member.role] || member.role}
            </p>
          </div>

          {/* Footer links */}
          <div className="px-5 pb-4 pt-3 border-t border-white/[0.06] flex items-center justify-between bg-[#060C16]">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 group-hover:text-[#00F5D4] transition-colors font-bold uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-[#00F5D4]" />
              <span>DOSSIER</span>
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-[#00F5D4] hover:bg-[#00F5D4]/10 transition-all cursor-pointer"
                title="LinkedIn Profile"
              >
                <LinkedinIcon className="w-3 h-3" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-[#00F5D4] hover:bg-[#00F5D4]/10 transition-all cursor-pointer"
                title="Instagram Profile"
              >
                <InstagramIcon className="w-3 h-3" />
              </a>
              <a
                href={emailUrl}
                className="w-7 h-7 rounded border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-[#00F5D4] hover:bg-[#00F5D4]/10 transition-all cursor-pointer"
                title="Direct Email"
              >
                <Mail className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </SectionReveal>
    </div>
  );
};

/**
 * TeamGrid
 *
 * Renders a categorized grid of operative profiles with holographic styling
 * and deep link routing to individual dossiers.
 */
const TeamGrid = ({ list, title, tag }: { list: TeamMemberItem[]; title: string; tag: string }) => {
  if (list.length === 0) return null;

  return (
    <div className="mb-20">
      <div className="flex items-center gap-3 mb-8 border-b border-white/[0.06] pb-4">
        <div className="w-1.5 h-6 bg-[#00F5D4] rounded-none shadow-[0_0_10px_rgba(0,245,212,0.8)]" />
        <div>
          <h2 className="text-lg sm:text-xl font-black font-mono tracking-wider text-white uppercase">{title}</h2>
          <p className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest">{tag}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
        {list.map((member, idx) => (
          <TeamMemberCard key={member.id || idx} member={member} idx={idx} />
        ))}
      </div>
    </div>
  );
};

/**
 * TeamPage
 *
 * Operational directory showcasing the Sentinel Executive Council,
 * Faculty Mentors, Technical Division, and Creative Intel Leads.
 *
 * @returns {JSX.Element} Rendered team directory.
 */
export default function TeamPage() {
  const [team, setTeam] = useState<TeamMemberItem[]>(FALLBACK_TEAM_CADRE);
  const [isIpRestricted, setIsIpRestricted] = useState(false);

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const res = await api<{ team: TeamMemberItem[] }>("/settings/landing-team");
        if (res.team && res.team.length > 0) {
          setTeam(res.team);
          setIsIpRestricted(false);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const isForbidden =
          typeof err === "object" && err !== null && "status" in err && err.status === 403;
        if (errMsg.includes("IP address is blocked") || isForbidden) {
          setIsIpRestricted(true);
        }
        console.warn("[TeamPage] Live roster load suspended, fallback cadre activated:", err);
      }
    };
    loadTeam();
  }, []);

  const facultyList = team.filter((m) => m.role === "FACULTY_COORDINATOR");
  const coordinatorsList = team.filter((m) => m.role === "STUDENT_COORDINATOR");
  const techList = team.filter((m) => m.role === "DEVELOPMENT_TEAM");
  const creativeList = team.filter((m) => m.role === "SOCIAL_MEDIA_COORDINATOR");
  const generalList = team.filter(
    (m) =>
      !["FACULTY_COORDINATOR", "STUDENT_COORDINATOR", "DEVELOPMENT_TEAM", "SOCIAL_MEDIA_COORDINATOR"].includes(m.role)
  );

  return (
    <div className="min-h-screen bg-[#02050B] text-slate-100 font-sans selection:bg-[#00F5D4]/20 relative overflow-x-hidden">
      {/* Universal Tactical Navigation */}
      <Navbar />

      {/* 3D connected Constellation Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[#02050B]/80 z-10" />
        <TeamBackground3D />
      </div>

      <main className="relative z-10 pt-12 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <SectionReveal>
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <SystemLabel prefix="[// ROSTER]" showDot={true}>
              EXECUTIVE COMMAND
            </SystemLabel>
            <h1 className="text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight text-white">
              SENTINEL <span className="text-[#00F5D4]">CADRE</span>
            </h1>
            <p className="font-mono text-xs sm:text-sm text-slate-400">
              The engineers, student coordinators, research leads, and faculty mentors
              directing our digital defense operations.
            </p>
          </div>
        </SectionReveal>

        {isIpRestricted && (
          <div className="mb-8 p-3 rounded border border-cyan-500/30 bg-[#070D18]/90 max-w-xl mx-auto flex items-center justify-center gap-2.5 text-xs font-mono text-[#00F5D4] shadow-lg">
            <Shield className="w-4 h-4 text-[#00F5D4] shrink-0" />
            <span>[// SECURE RECONNAISSANCE // CACHED OPERATIVE CADRE ACTIVE]</span>
          </div>
        )}

        {team.length === 0 ? (
          <div className="text-center py-16 bg-[#070D18]/60 border border-white/[0.08] rounded max-w-xl mx-auto p-6">
            <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold font-mono text-white uppercase tracking-wider mb-1">
              ROSTER PENDING INITIALIZATION
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Officer profiles will appear once finalized by the council.
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

        {/* Join Recruitment Directive Banner */}
        <SectionReveal delay={0.2}>
          <div className="mt-16 p-8 sm:p-10 rounded-lg bg-[#070E1A] border border-[#1E293B] relative overflow-hidden shadow-2xl text-center hud-brackets">
            <BorderBeam size={200} duration={12} />
            <div className="max-w-xl mx-auto space-y-3 relative z-10">
              <span className="px-3 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-[#00F5D4] text-[11px] font-mono font-bold uppercase tracking-widest inline-flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#00F5D4]" />
                RECRUITMENT DIRECTIVE
              </span>
              <h2 className="text-2xl sm:text-4xl font-black font-mono uppercase tracking-tight text-white">
                ENLIST WITH OUR CADRE
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm font-mono leading-relaxed">
                We continuously scout curious researchers, reverse engineers, CTF competitors,
                and creative directors ready to defend and build.
              </p>
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">

                <Link href="/auth">
                  <CyberButton variant="outline" size="md">
                    OPERATIVE GATEWAY
                  </CyberButton>
                </Link>
              </div>
            </div>
          </div>
        </SectionReveal>
      </main>

      {/* Universal Tactical Footer */}
      <Footer />
    </div>
  );
}
