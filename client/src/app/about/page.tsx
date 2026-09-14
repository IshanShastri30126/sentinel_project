"use client";

import React from "react";
import Link from "next/link";
import { 
  Shield, 
  CheckCircle2, 
  Terminal, 
  Award, 
  Lock, 
  Users, 
  Zap, 
  ArrowRight,
  ArrowLeft,
  Trophy
} from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { 
  CyberButton, 
  CyberCard, 
  CyberCardContent, 
  SystemLabel, 
  SectionReveal, 
  CyberBadge 
} from "@/components/ui";
import { CyberGrid, BorderBeam, HoloCard } from "@/components/effects";
import dynamic from "next/dynamic";

const PlexusBackground = dynamic(() => import("@/components/PlexusBackground"), { ssr: false });

/**
 * AboutPage
 *
 * Official sentinel charter, mission briefing, history, and strategic operational pillars
 * of the Sentinel Cybersecurity Society at CSPIT Computer Engineering.
 *
 * @returns {JSX.Element} Rendered about view.
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#02050B] text-slate-100 font-sans selection:bg-[#00F5D4]/20 relative overflow-x-hidden">
      {/* Universal Tactical Navigation */}
      <Navbar />

      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#02050B]">
        <PlexusBackground />
        <div className="absolute inset-0 bg-[#02050B]/85 z-10" />
        <CyberGrid gridSize={32} glowColor="rgba(0, 245, 212, 0.04)" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        {/* Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-6">
          <Link href="/">
            <CyberButton variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              HOME
            </CyberButton>
          </Link>
          <div className="flex items-center gap-2">
            <CyberBadge variant="normal" dot={true}>
              CSPIT COMPUTER ENGINEERING
            </CyberBadge>
          </div>
        </div>

        {/* Hero Title */}
        <SectionReveal>
          <div className="space-y-3 text-center max-w-3xl mx-auto">
            <SystemLabel prefix="[// SENTINEL.CHARTER]" showDot={true}>
              STRATEGIC FORMATION & MISSION
            </SystemLabel>
            <h1 className="text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight text-white">
              ABOUT <span className="text-[#00F5D4]">SENTINEL</span>
            </h1>
            <p className="font-mono text-xs sm:text-sm text-slate-300 leading-relaxed">
              The Official Cybersecurity Society of the Computer Engineering Department, CSPIT.
              Fostering relentless technical rigor, offensive defense, and peer-to-peer security engineering.
            </p>
          </div>
        </SectionReveal>

        {/* Section 1: Working Saturday Sessions */}
        <SectionReveal delay={0.1}>
          <CyberCard variant="panel" className="p-6 sm:p-8 bg-[#060C16]/90 border-white/[0.08] space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#00F5D4]">01.</span>
              <h2 className="text-lg sm:text-xl font-bold font-mono uppercase text-white tracking-wide">
                Origin & Working Saturday Peer Sessions
              </h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Sentinel was established within the <strong>Department of Computer Engineering at CSPIT</strong> as a specialized hub for offensive defense, reverse engineering, and threat intelligence. It provides students with an arena to push beyond textbook theory and tackle active defense challenges.
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              A foundational cornerstone of the organization is our <strong>Working Saturday peer-learning sessions</strong>. Every working Saturday, senior operatives, research leads, and invited industry practitioners deliver immersive workshops for all members and juniors. No prior cybersecurity certifications are needed — curiosity, discipline, and passion are the only prerequisites.
            </p>
          </CyberCard>
        </SectionReveal>

        {/* Section 2: Practical & Competitive Focus */}
        <SectionReveal delay={0.15}>
          <div className="space-y-6">
            <div className="space-y-1">
              <SystemLabel prefix="[// ARENA]" showDot={true}>
                TACTICAL CAPABILITIES
              </SystemLabel>
              <h2 className="text-xl sm:text-2xl font-black font-mono uppercase tracking-tight text-white">
                Practical Defense & Competitive CTF Focus
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Capture The Flag (CTF)",
                  desc: "Jeopardy and Attack-Defense challenges spanning Web Security, Cryptography, Reverse Engineering, and Memory Forensics.",
                  icon: Trophy,
                },
                {
                  title: "Vulnerability Assessments",
                  desc: "Ethical hacking drills, source-code audits, and zero-day patch creation in sandboxed target environments.",
                  icon: Terminal,
                },
                {
                  title: "Defense Summits & Hackathons",
                  desc: "Collaborative defensive tool development and direct mentorship with industry cyber professionals.",
                  icon: Zap,
                },
                {
                  title: "Hands-on Technical Labs",
                  desc: "Laboratory sessions covering Linux internals, network protocol analysis, wireless penetration, and defensive hardening.",
                  icon: Award,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-lg bg-[#070D18] border border-white/[0.08] space-y-2 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-cyan-500/10 text-[#00F5D4] border border-cyan-500/20">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="font-mono text-xs font-bold uppercase text-slate-100">
                        {item.title}
                      </h4>
                    </div>
                    <p className="font-mono text-xs text-slate-300 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionReveal>

        {/* Section 3: Core Pillars */}
        <SectionReveal delay={0.2}>
          <div className="space-y-6">
            <div className="space-y-1">
              <SystemLabel prefix="[// MATRIX]" showDot={true}>
                STRATEGIC PILLARS
              </SystemLabel>
              <h2 className="text-xl sm:text-2xl font-black font-mono uppercase tracking-tight text-white">
                Core Objectives & Charter
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-lg bg-[#050A14] border-l-2 border-[#00F5D4] border-t border-r border-b border-white/[0.06] space-y-2">
                <h3 className="font-mono text-sm font-bold text-white uppercase">
                  Ethical Hacking & Audits
                </h3>
                <p className="font-mono text-xs text-slate-300 leading-relaxed">
                  Educating students in authorized testing environments, identifying code vulnerabilities,
                  and generating structured remediation reports compliant with OWASP standards.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-[#050A14] border-l-2 border-[#00E1FF] border-t border-r border-b border-white/[0.06] space-y-2">
                <h3 className="font-mono text-sm font-bold text-white uppercase">
                  Competitive CTF Training
                </h3>
                <p className="font-mono text-xs text-slate-300 leading-relaxed">
                  Training members in cryptography, reverse engineering, web exploitation, and binary analysis
                  to compete on national and global leaderboards.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-[#050A14] border-l-2 border-[#A855F7] border-t border-r border-b border-white/[0.06] space-y-2">
                <h3 className="font-mono text-sm font-bold text-white uppercase">
                  Incident Simulation
                </h3>
                <p className="font-mono text-xs text-slate-300 leading-relaxed">
                  Simulating multi-vector adversary tactics to train defense analysts in detection, containment,
                  forensics, and system resilience.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-[#050A14] border-l-2 border-[#FFB800] border-t border-r border-b border-white/[0.06] space-y-2">
                <h3 className="font-mono text-sm font-bold text-white uppercase">
                  Campus Digital Hygiene
                </h3>
                <p className="font-mono text-xs text-slate-300 leading-relaxed">
                  Promoting institutional security hygiene, strong authentication protocols, phishing prevention,
                  and safe software engineering practices.
                </p>
              </div>
            </div>
          </div>
        </SectionReveal>

        {/* Call to Action Card */}
        <SectionReveal delay={0.25}>
          <div className="relative rounded-lg bg-[#070E1A] border border-[#1E293B] p-8 text-center space-y-4 hud-brackets">
            <BorderBeam size={200} duration={12} />
            <h3 className="text-xl sm:text-2xl font-black uppercase font-mono tracking-tight text-white">
              JOIN THE SENTINEL CADRE
            </h3>
            <p className="font-mono text-xs text-slate-300 max-w-xl mx-auto">
              All students across departments and semesters are welcome to attend peer sessions,
              form competition teams, and contribute to campus security projects.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link href="/auth">
                <CyberButton variant="primary" size="md" glow="primary">
                  ENLIST AS OPERATIVE
                </CyberButton>
              </Link>
              <Link href="/team">
                <CyberButton variant="outline" size="md">
                  VIEW EXECUTIVE COUNCIL
                </CyberButton>
              </Link>
            </div>
          </div>
        </SectionReveal>
      </main>

      {/* Universal Tactical Footer */}
      <Footer />
    </div>
  );
}
