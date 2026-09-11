"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Shield, 
  ChevronRight, 
  Network, 
  ArrowRight, 
  FileText, 
  Terminal, 
  Activity, 
  Lock, 
  Award,
  Zap
} from "lucide-react";
import { api, getFileUrl } from "@/lib/api";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { 
  CyberButton, 
  CyberBadge, 
  CyberCard, 
  CyberCardContent, 
  SystemLabel, 
  SectionReveal, 
  TerminalText, 
  EmptyState,
  Countdown
} from "@/components/ui";
import { CyberGrid, BorderBeam, HoloCard, CountUp } from "@/components/effects";

const PlexusBackground = dynamic(() => import("@/components/PlexusBackground"), { ssr: false });

interface EventItem {
  id: string;
  title: string;
  description?: string;
  posterUrl?: string;
  startDate: string;
  slug: string;
  documentUrl?: string;
}

const TERMINAL_PHRASES = [
  "Defensive Warfare Matrix.",
  "Strategic Shield Protocol.",
  "Zero-Trust Architecture.",
  "Unbreakable Formation."
];

/**
 * EventCardItem
 *
 * Renders an operational event card featuring dynamic poster rendering,
 * real-time countdown timer, tactical badges, and engagement triggers.
 *
 * @param {{ ev: EventItem; index: number }} props - Event metadata and staggered index.
 * @returns {JSX.Element} Rendered tactical event card.
 */
function EventCardItem({ ev, index }: { ev: EventItem; index: number }) {
  const [posterError, setPosterError] = useState(false);
  const isUpcoming = new Date(ev.startDate).getTime() > Date.now();

  let docs: string[] = [];
  if (ev.documentUrl) {
    if (ev.documentUrl.startsWith("[")) {
      try { docs = JSON.parse(ev.documentUrl); } catch { docs = [ev.documentUrl]; }
    } else { docs = [ev.documentUrl]; }
  }

  return (
    <SectionReveal delay={index * 0.1}>
      <CyberCard
        variant="interactive"
        showAccentTop={true}
        accentColor={index % 2 === 0 ? "primary" : "accent"}
        className="flex flex-col h-full group"
      >
        {/* Cover image or fallback */}
        <div className="h-48 bg-[#040813] relative overflow-hidden border-b border-white/[0.06]">
          {ev.posterUrl && !posterError ? (
            <img
              src={getFileUrl(ev.posterUrl)}
              alt={ev.title}
              onError={() => setPosterError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#050A14]">
              <CyberGrid gridSize={20} glowColor="rgba(0, 245, 212, 0.06)" />
              <Network className="w-12 h-12 text-slate-600 group-hover:text-[#00F5D4] transition-colors relative z-10" />
            </div>
          )}

          {/* Floating Operational Status */}
          <div className="absolute top-3 right-3 z-10">
            <CyberBadge variant={isUpcoming ? "normal" : "muted"} dot={true} pulseDot={isUpcoming}>
              {isUpcoming ? "ACTIVE REGISTRATION" : "ARCHIVED"}
            </CyberBadge>
          </div>

          {/* Date Stamp */}
          <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded bg-black/85 border border-cyan-500/30 backdrop-blur-md font-mono text-xs font-bold text-[#00F5D4]">
            {new Date(ev.startDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Card Body */}
        <CyberCardContent className="flex-1 flex flex-col justify-between p-5 space-y-4">
          <div className="space-y-2">
            <SystemLabel prefix="[// OPS-LOG]" dotColor="primary" showDot={true}>
              TACTICAL OPERATION
            </SystemLabel>
            <h3 className="font-sans text-lg font-bold text-slate-100 group-hover:text-[#00F5D4] transition-colors line-clamp-1">
              {ev.title}
            </h3>
            <p className="font-mono text-xs text-slate-400 line-clamp-3 leading-relaxed">
              {ev.description || "No tactical briefing provided for this operation."}
            </p>
          </div>

          {/* Live Countdown if upcoming */}
          {isUpcoming && (
            <div className="pt-2 border-t border-white/[0.04]">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-slate-400 mb-2">
                COMMENCES IN:
              </span>
              <Countdown targetDate={ev.startDate} />
            </div>
          )}

          {/* Document attachment links */}
          {docs.length > 0 && (
            <div className="flex flex-col gap-1.5 w-full bg-[#050A14] border border-white/[0.06] p-2.5 rounded-md">
              <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider">
                TACTICAL ATTACHMENTS:
              </span>
              {docs.map((doc, idx) => (
                <a
                  key={idx}
                  href={getFileUrl(doc)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-[#00F5D4] transition truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FileText className="w-3.5 h-3.5 text-[#00F5D4] shrink-0" />
                  <span className="truncate">{doc.split("/").pop()}</span>
                </a>
              ))}
            </div>
          )}

          {/* Action Trigger */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-500">
              CHAKRAVYUH.FORMATION
            </span>
            <Link href={`/events/${ev.slug}`}>
              <CyberButton
                variant="secondary"
                size="sm"
                rightIcon={<ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />}
              >
                ENGAGE STRATEGY
              </CyberButton>
            </Link>
          </div>
        </CyberCardContent>
      </CyberCard>
    </SectionReveal>
  );
}

/**
 * LandingPage
 *
 * Master landing page for Chakravyuh Club transformed into a modern
 * cybersecurity command-center and tactical event discovery interface.
 *
 * @returns {JSX.Element} Rendered landing page.
 */
export default function LandingPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    api<{ events: EventItem[] }>("/events?limit=3")
      .then((res) => {
        if (res.events) {
          const publicEvents = res.events
            .sort(
              (a, b) =>
                new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
            )
            .slice(0, 3);
          setEvents(publicEvents);
        }
      })
      .catch((err) => {
        console.error("Failed to load operations:", err);
      })
      .finally(() => {
        setEventsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#02050B] text-slate-100 selection:bg-[#00F5D4]/20 font-sans relative overflow-x-hidden">
      {/* Universal Tactical Navigation */}
      <Navbar />

      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#02050B]">
        <PlexusBackground />
        <div className="absolute inset-0 bg-[#02050B]/85 z-10" />
        <CyberGrid gridSize={36} glowColor="rgba(0, 245, 212, 0.05)" />
      </div>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-16 sm:pt-24 pb-24 sm:pb-36 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center text-center relative">
          <SectionReveal direction="down" distance={15}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(0,245,212,0.08)] border border-[rgba(0,245,212,0.3)] text-[#00F5D4] font-mono text-xs uppercase tracking-widest mb-8 shadow-[0_0_20px_rgba(0,245,212,0.15)]">
              <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping" />
              <span>STRATEGIC 7-TIER CYBER DEFENSE ECOSYSTEM</span>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 select-none drop-shadow-[0_5px_30px_rgba(0,0,0,0.9)]">
              <span className="block text-white">THE INVINCIBLE</span>
              <span className="bg-gradient-to-r from-[#00F5D4] via-[#00E1FF] to-[#00F5D4] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(0,245,212,0.35)]">
                <TerminalText words={TERMINAL_PHRASES} />
              </span>
            </h1>
          </SectionReveal>

          <SectionReveal delay={0.2}>
            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-sans px-4">
              Welcome to <span className="text-[#00F5D4] font-semibold">Chakravyuh Club</span>.
              Synthesizing ancient tactical defense doctrines with elite cybersecurity operations,
              threat mitigation, and competitive events to safeguard the digital frontier.
            </p>
          </SectionReveal>

          <SectionReveal delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md sm:max-w-none">
              <Link href="/auth">
                <CyberButton
                  variant="primary"
                  size="lg"
                  glow="primary"
                  leftIcon={<Shield className="w-4 h-4" />}
                >
                  DEPLOY DEFENSE GATEWAY
                </CyberButton>
              </Link>
              <a href="#events">
                <CyberButton
                  variant="secondary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  EXPLORE OPERATIONS
                </CyberButton>
              </a>
            </div>
          </SectionReveal>

          {/* Telemetry Statistics HUD */}
          <SectionReveal delay={0.4} className="mt-16 sm:mt-24 w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
              {[
                { label: "TACTICAL OPERATIVES", value: 500, suffix: "+", icon: Activity },
                { label: "EVENTS EXECUTED", value: 24, suffix: "+", icon: Zap },
                { label: "DEFENSE TIERS", value: 7, suffix: " TIER", icon: Shield },
                { label: "SECURITY AUDIT SCORE", value: 100, suffix: "%", icon: Award },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-[#070D18]/90 border border-white/[0.08] backdrop-blur-md text-center space-y-1 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-slate-400 font-mono text-[10px] tracking-wider uppercase mb-1">
                      <Icon className="w-3 h-3 text-[#00F5D4]" />
                      <span>{stat.label}</span>
                    </div>
                    <div className="font-mono text-2xl sm:text-3xl font-black text-[#00F5D4] tracking-tight drop-shadow-[0_0_10px_rgba(0,245,212,0.3)]">
                      <CountUp end={stat.value} suffix={stat.suffix} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionReveal>
        </section>

        {/* Tactical Operations Showcase */}
        <section id="events" className="px-4 sm:px-6 max-w-7xl mx-auto mb-28">
          <SectionReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-white/[0.06]">
              <div>
                <SystemLabel prefix="[// OPS-SCHEDULE]" showDot={true}>
                  TACTICAL DEPLOYMENTS
                </SystemLabel>
                <h2 className="text-2xl sm:text-3xl font-black uppercase font-mono tracking-tight text-white mt-1">
                  TACTICAL <span className="text-[#00F5D4]">OPERATIONS</span> & EVENTS
                </h2>
                <p className="font-mono text-xs text-slate-400 mt-1 max-w-xl">
                  Summits, competitive hackathons, zero-day research sessions, and certifications.
                </p>
              </div>
              <Link href="/events" className="mt-4 md:mt-0">
                <CyberButton variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  VIEW ALL EVENTS
                </CyberButton>
              </Link>
            </div>
          </SectionReveal>

          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-96 rounded-xl bg-[#080E1A] border border-white/[0.06] animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              title="NO ACTIVE OPERATIONS SCHEDULED"
              description="New strategic defense summits and hackathon deployments will appear here once scheduled by the Chakravyuh council."
              actionLabel="BROWSE ARCHIVES"
              onAction={() => {}}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.map((ev, i) => (
                <EventCardItem key={ev.id} ev={ev} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Security Command Pillars Section */}
        <section className="px-4 sm:px-6 max-w-7xl mx-auto mb-28">
          <SectionReveal>
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
              <SystemLabel prefix="[// ARCHITECTURE]" showDot={true}>
                TACTICAL DEFENSE ARSENAL
              </SystemLabel>
              <h2 className="text-2xl sm:text-3xl font-black uppercase font-mono tracking-tight text-white">
                DEFENSE PILLARS OF <span className="text-[#00F5D4]">CHAKRAVYUH</span>
              </h2>
              <p className="font-mono text-xs text-slate-400">
                Engineered from the ground up for maximum resilience, hands-on vulnerability analysis, and zero compromise.
              </p>
            </div>
          </SectionReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                id: "01",
                title: "OFFENSIVE WARFARE",
                description: "Ethical hacking drills, penetration testing methodologies, and real-world vulnerability identification.",
                icon: Terminal,
                accent: "#00F5D4",
              },
              {
                id: "02",
                title: "7-TIER FORMATION",
                description: "Multilayered security perimeter ensuring defense in depth across network, endpoint, application, and cloud.",
                icon: Shield,
                accent: "#00E1FF",
              },
              {
                id: "03",
                title: "EVENT LEADERBOARD",
                description: "Real-time telemetry, competitive scores, operative rankings, and event performance analytics.",
                icon: Award,
                accent: "#FFB800",
              },
              {
                id: "04",
                title: "CRYPTOGRAPHIC PROOF",
                description: "Verifiable digital credentialing, signed attendance receipts, and immutable skill verification.",
                icon: Lock,
                accent: "#00F5D4",
              },
            ].map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <SectionReveal key={pillar.id} delay={index * 0.08}>
                  <HoloCard className="h-full p-6 flex flex-col justify-between space-y-4 border-white/[0.08]">
                    <BorderBeam size={160} duration={12} delay={index * 3} />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {pillar.id}
                        </span>
                        <div className="p-2 rounded bg-cyan-500/10 text-[#00F5D4] border border-cyan-500/20">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="font-mono text-sm font-bold tracking-wider text-slate-100 uppercase">
                        {pillar.title}
                      </h4>
                      <p className="font-mono text-xs text-slate-400 leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.05] flex items-center gap-1.5 text-[10px] font-mono text-cyan-400">
                      <span>TACTICAL READY</span>
                      <span>→</span>
                    </div>
                  </HoloCard>
                </SectionReveal>
              );
            })}
          </div>
        </section>

        {/* Operative Enlistment Call to Action */}
        <section className="px-4 sm:px-6 max-w-5xl mx-auto mb-24">
          <SectionReveal>
            <div className="relative rounded-2xl bg-gradient-to-b from-[#081220] to-[#040810] border border-cyan-500/30 p-8 sm:p-12 text-center overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(0,245,212,0.1)] hud-brackets">
              <BorderBeam size={250} duration={10} colorFrom="#00F5D4" colorTo="#00E1FF" />
              <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
                <SystemLabel prefix="[// GATEWAY]" showDot={true}>
                  ENLISTMENT DIRECTIVE
                </SystemLabel>
                <h3 className="text-2xl sm:text-4xl font-black uppercase font-mono tracking-tight text-white">
                  JOIN THE CHAKRAVYUH DEFENSE FORCE
                </h3>
                <p className="font-mono text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Access live tactical workshops, register for premier hackathons, track leaderboard rankings,
                  and connect with fellow cybersecurity researchers.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Link href="/auth">
                    <CyberButton variant="primary" size="md" glow="primary">
                      INITIALIZE ACCESS
                    </CyberButton>
                  </Link>
                  <Link href="/about">
                    <CyberButton variant="outline" size="md">
                      LEARN CLUB CHARTER
                    </CyberButton>
                  </Link>
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>
      </main>

      {/* Universal Tactical Footer */}
      <Footer />
    </div>
  );
}
