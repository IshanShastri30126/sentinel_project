"use client";

import React, { useEffect, useState } from "react";
import { api, getFileUrl } from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Search, Tag, Users, Clock, MapPin, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
        setEvents(data.events);
      } catch (err) {
        console.error(err);
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
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Hero Header */}
      <div className="relative pt-20 pb-12 overflow-hidden border-b border-[#121F3D]">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 border border-[#121F3D] hover:border-[#00F5D4] text-slate-300 hover:text-white text-xs font-mono font-bold transition-all shadow-md group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#00F5D4] group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </button>
            <div className="inline-flex items-center gap-2 bg-black/40 border border-[#FFD700]/30 px-4 py-1.5 rounded-full">
              <Shield className="w-4 h-4 text-[#FFD700]" />
              <span className="text-xs font-bold text-[#FFD700] font-mono tracking-widest uppercase">CHAKRAVYUH STRATEGIC OPERATIONS</span>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 uppercase font-mono tracking-tighter bg-gradient-to-r from-[#FFD700] via-white to-[#00F5D4] bg-clip-text text-transparent">
              Public Defense Operations
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
              Discover and participate in upcoming cybersecurity workshops, strategic hackathons, and community defense exercises.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00F5D4]" />
            <input 
              className="w-full bg-[#080E24] border border-[#121F3D] focus:border-[#FFD700] focus:outline-none rounded-xl text-xs text-white pl-9 pr-4 py-2.5 font-mono" 
              placeholder="Search operations by title, keyword..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-black/60 border border-[#121F3D] w-full md:w-auto overflow-x-auto">
            {(["upcoming", "past", "all"] as const).map((t) => (
              <button key={t} onClick={() => setTimeFilter(t)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition cursor-pointer ${timeFilter === t ? "bg-[#FFD700] text-black shadow-[0_0_12px_rgba(255,215,0,0.4)]" : "text-slate-400 hover:text-white"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Empty States */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-3 border-[#FFD700]/30 border-t-[#FFD700] rounded-full animate-spin" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-[#050A18] rounded-2xl border border-[#121F3D]">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2 font-mono uppercase tracking-widest">No Operations Found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search query or timeframe filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, i) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/events/${event.slug}`} className="block h-full">
                  <div className="rounded-2xl bg-[#050A18] border border-[#121F3D] hover:border-[#FFD700]/40 transition-all duration-300 h-full flex flex-col group overflow-hidden shadow-xl">
                    {/* Event Poster / Banner */}
                    <div className="h-48 relative overflow-hidden bg-[#030712]">
                      {event.posterUrl ? (
                        <img 
                          src={getFileUrl(event.posterUrl)} 
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#080E24] to-[#030712]">
                          <Shield className="w-16 h-16 text-[#FFD700]/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050A18] via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        {event.tags.slice(0, 2).map(t => (
                          <span key={t} className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider font-mono bg-[#00F5D4]/20 border border-[#00F5D4]/40 text-[#00F5D4] rounded-md backdrop-blur-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h2 className="text-lg font-bold font-mono tracking-tight text-white mb-2 group-hover:text-[#FFD700] transition-colors line-clamp-2">
                        {event.title}
                      </h2>
                      <div className="space-y-2 mb-4 flex-1">
                        <p className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
                          <span>{new Date(event.startDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                          <Clock className="w-3.5 h-3.5 text-[#00F5D4] shrink-0" />
                          <span>{new Date(event.startDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                        </p>
                        {event.venue && (
                          <p className="text-xs text-slate-400 flex items-center gap-2 line-clamp-1 font-mono">
                            <MapPin className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
                            <span className="truncate">{event.venue}</span>
                          </p>
                        )}
                      </div>
                      <div className="pt-4 border-t border-[#121F3D] flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#00F5D4]" />
                          {event._count.registrations} Enrolled
                        </span>
                        <span className="text-xs font-bold text-[#FFD700] group-hover:text-[#00F5D4] flex items-center gap-1 font-mono uppercase tracking-wider transition-colors">
                          Inspect &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
