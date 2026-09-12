"use client";

import React, { useEffect, useState } from "react";
import { api, getFileUrl } from "@/lib/api";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Search, 
  Users, 
  Clock, 
  MapPin, 
  Shield, 
  ArrowLeft,
  ArrowRight,
  Network,
  Lock,
  Unlock
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { 
  CyberButton, 
  CyberBadge, 
  CyberCard, 
  CyberCardContent, 
  SystemLabel, 
  SectionReveal, 
  EmptyState,
  CyberSkeleton
} from "@/components/ui";
import { CyberGrid } from "@/components/effects";
import dynamic from "next/dynamic";

const PlexusBackground = dynamic(() => import("@/components/PlexusBackground"), { ssr: false });

interface Event {
  id: string;
  title: string;
  description?: string;
  venue?: string;
  startDate: string;
  endDate: string;
  slug: string;
  tags: string[];
  eventType: string;
  posterUrl?: string;
  creator: { name: string; role: string };
  _count: { registrations: number };
}

/**
 * PublicEventsPage
 *
 * Tactical event discovery portal providing search, timeframe filtering,
 * and comprehensive details on scheduled cybersecurity operations and summits.
 *
 * @returns {JSX.Element} Rendered public events directory.
 */
export default function PublicEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        const qs = params.toString() ? `?${params.toString()}` : "";
        const data = await api<{ events: Event[] }>(`/events${qs}`);
        setEvents(data.events || []);
      } catch (err) {
        console.warn("Operations load notice:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchQuery]);

  const now = new Date();
  const filteredEvents = events.filter((ev) => {
    if (timeFilter === "upcoming") return new Date(ev.startDate) >= now;
    if (timeFilter === "past") return new Date(ev.endDate) < now;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#02050B] text-slate-100 font-sans relative overflow-x-hidden selection:bg-[#00F5D4]/20">
      {/* Universal Navigation */}
      <Navbar />

      {/* Dynamic Tactical Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#02050B]">
        <PlexusBackground />
        <div className="absolute inset-0 bg-[#02050B]/85 z-10" />
        <CyberGrid gridSize={32} glowColor="rgba(0, 245, 212, 0.04)" />
      </div>

      <main className="relative z-10">
        {/* Header Hero */}
        <section className="pt-12 pb-10 border-b border-white/[0.08] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#070D18] border border-white/10 hover:border-[#00F5D4] text-slate-300 hover:text-white text-xs font-mono font-bold transition-all shadow-md group cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#00F5D4] group-hover:-translate-x-1 transition-transform" />
                <span>BACK</span>
              </button>

              <div className="inline-flex items-center gap-2 bg-[#070D18] border border-cyan-500/30 px-3.5 py-1.5 rounded-full backdrop-blur">
                <Shield className="w-3.5 h-3.5 text-[#00F5D4]" />
                <span className="text-[11px] font-bold text-[#00F5D4] font-mono tracking-widest uppercase">
                  OPERATIONS REPOSITORY
                </span>
              </div>
            </div>

            <SectionReveal>
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <SystemLabel prefix="[// DIRECTORY]" showDot={true}>
                  TACTICAL DEPLOYMENTS & GATHERINGS
                </SystemLabel>
                <h1 className="text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight text-white">
                  CYBER DEFENSE <span className="text-[#00F5D4]">OPERATIONS</span>
                </h1>
                <p className="font-mono text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  Discover upcoming workshops, strategic hackathons, zero-day threat exercises,
                  and official Chakravyuh certification summits.
                </p>
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* Filters & Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00F5D4]" />
              <input
                className="w-full h-10 rounded-md bg-[#070D18] border border-white/[0.12] pl-10 pr-4 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4]/40 transition-all"
                placeholder="Search operations by title, tag, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Timeframe Filter Tabs */}
            <div className="flex p-1 rounded-lg bg-[#040810] border border-white/[0.08] w-full md:w-auto">
              {(["upcoming", "past", "all"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={`flex-1 md:flex-none px-4 py-1.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    timeFilter === t
                      ? "bg-gradient-to-r from-[#00F5D4] to-[#00E1FF] text-black shadow-[0_0_12px_rgba(0,245,212,0.3)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Grid or Empty */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <CyberSkeleton key={n} className="h-80 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              title="NO OPERATIONS FOUND"
              description="No tactical missions match your current query or timeframe parameters. Clear your search or toggle timeframe filters."
              actionLabel="RESET FILTERS"
              onAction={() => {
                setSearchQuery("");
                setTimeFilter("all");
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, i) => {
                const isUpcoming = new Date(event.startDate).getTime() >= now.getTime();
                return (
                  <SectionReveal key={event.id} delay={i * 0.05}>
                    <Link href={`/events/${event.slug}`} className="block h-full">
                      <CyberCard
                        variant="interactive"
                        showAccentTop={true}
                        accentColor={isUpcoming ? "primary" : "accent"}
                        className="h-full flex flex-col group overflow-hidden"
                      >
                        {/* Poster */}
                        <div className="h-44 relative overflow-hidden bg-[#040812] border-b border-white/[0.06]">
                          {event.posterUrl ? (
                            <img
                              src={getFileUrl(event.posterUrl)}
                              alt={event.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#050A14]">
                              <Network className="w-12 h-12 text-slate-600 group-hover:text-[#00F5D4] transition-colors" />
                            </div>
                          )}

                          {/* Tags */}
                          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 z-10">
                            {event.tags.slice(0, 2).map((t) => (
                              <CyberBadge key={t} variant="normal" size="sm">
                                {t}
                              </CyberBadge>
                            ))}
                          </div>

                          <div className="absolute top-3 right-3 z-10">
                            <CyberBadge variant={isUpcoming ? "normal" : "muted"} dot={true} pulseDot={isUpcoming}>
                              {isUpcoming ? "UPCOMING" : "CONCLUDED"}
                            </CyberBadge>
                          </div>
                        </div>

                        {/* Details */}
                        <CyberCardContent className="p-5 flex flex-col flex-1 justify-between space-y-4">
                          <div>
                            <h3 className="font-sans text-base font-bold text-slate-100 group-hover:text-[#00F5D4] transition-colors line-clamp-2 mb-3">
                              {event.title}
                            </h3>

                            <div className="space-y-1.5 font-mono text-xs text-slate-400">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-[#00F5D4] shrink-0" />
                                <span>
                                  {new Date(event.startDate).toLocaleDateString("en-IN", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-[#00E1FF] shrink-0" />
                                <span>
                                  {new Date(event.startDate).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              {event.venue && (
                                <div className="flex items-center gap-2 line-clamp-1">
                                  <MapPin className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                                  <span className="truncate">{event.venue}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-[#00F5D4]" />
                              {event._count.registrations} Enrolled
                            </span>
                            {["hackathon", "competition", "ctf"].includes(event.eventType?.toLowerCase()) ? (
                              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                                <span className="px-2 py-0.5 rounded border border-white/10 bg-white/[0.04] text-slate-300">
                                  DETAILS
                                </span>
                                {new Date(event.startDate).getTime() > Date.now() ? (
                                  <span className="px-2 py-0.5 rounded border border-red-500/40 bg-red-950/40 text-red-400 flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-red-400" />
                                    <span>LOCKED</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded border border-cyan-500/50 bg-cyan-950/40 text-cyan-300 flex items-center gap-1 animate-pulse shadow-[0_0_8px_rgba(0,245,212,0.4)]">
                                    <Unlock className="w-3 h-3 text-[#00F5D4]" />
                                    <span>UNLOCKED</span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="font-mono text-xs font-bold text-[#00F5D4] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                <span>INSPECT</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </CyberCardContent>
                      </CyberCard>
                    </Link>
                  </SectionReveal>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Universal Tactical Footer */}
      <Footer />
    </div>
  );
}
