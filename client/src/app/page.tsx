"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SentinalLogo } from "@/components/SentinalLogo";
import { 
  Shield, 
  ChevronRight, 
  Calendar, 
  Code,
  Network,
  ArrowRight, 
  Info, 
  Users, 
  LogIn, 
  FileText 
} from "lucide-react";
import { api, getFileUrl } from "@/lib/api";
import dynamic from "next/dynamic";

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

const LinkedinIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: "1em", height: "1em" }}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
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

const WORDS = ["Defensive Warfare.", "Strategic Shield.", "Digital Realm.", "Unbreakable Formation."];

const TypingText = () => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (subIndex === WORDS[index].length + 1 && !isDeleting) {
      const timeout = setTimeout(() => setIsDeleting(true), 1500);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && isDeleting) {
      const timeout = setTimeout(() => {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % WORDS.length);
      }, 50);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
      setText(WORDS[index].substring(0, subIndex + (isDeleting ? -1 : 1)));
    }, isDeleting ? 40 : 90);

    return () => clearTimeout(timeout);
  }, [subIndex, isDeleting, index]);

  return (
    <span 
      className="inline-block text-[#FFD700] border-r-3 border-[#FFD700] animate-cursor-blink pr-1.5"
      style={{
        textShadow: "0 0 15px rgba(255, 215, 0, 0.85), 0 0 35px rgba(255, 215, 0, 0.45)",
      }}
    >
      {text}
    </span>
  );
};

function EventCard({ ev, i }: { ev: EventItem; i: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [posterError, setPosterError] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <motion.div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1 }}
      className="group relative rounded-xl bg-[#080E24]/80 backdrop-blur-md border border-[#121F3D] overflow-hidden hover:border-[#FFD700]/60 hover:shadow-[0_0_35px_rgba(255,215,0,0.15)] flex flex-col h-full transition-all duration-300"
    >
      {/* Spotlight Overlay Effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
        style={{
          background: "radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(255, 215, 0, 0.08), transparent 80%)"
        }}
      />

      {/* Chakravyuh Concentric Dots Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(#00F5D4 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px"
        }}
      />

      {/* Golden Corner Brackets */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#FFD700]/40 group-hover:border-[#FFD700] transition-colors z-20" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#FFD700]/40 group-hover:border-[#FFD700] transition-colors z-20" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#FFD700]/40 group-hover:border-[#FFD700] transition-colors z-20" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#FFD700]/40 group-hover:border-[#FFD700] transition-colors z-20" />
      
      {/* Cover image or fallback */}
      <div className="h-44 bg-[#050A18] relative overflow-hidden border-b border-white/5 z-10">
        {ev.posterUrl && !posterError ? (
          <img
            src={getFileUrl(ev.posterUrl)}
            alt={ev.title}
            onError={() => setPosterError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-95"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#030712] group-hover:scale-105 transition-transform duration-500">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(#00F5D4 1px, transparent 1px), linear-gradient(90deg, #00F5D4 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
            <Network className="w-10 h-10 text-zinc-600 group-hover:text-[#00F5D4] transition-colors relative z-10" />
          </div>
        )}
        
        {/* Glowing status tag */}
        <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded bg-black/80 border border-[#00F5D4]/40 backdrop-blur-md text-[9px] font-mono font-bold tracking-widest text-[#00F5D4]">
          {"// STRATEGY_ACTIVE"}
        </div>
        
        {/* Floating Date Badge */}
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/80 border border-[#FFD700]/40 backdrop-blur-md rounded text-xs font-mono font-bold text-[#FFD700]">
          {new Date(ev.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
      
      {/* Card details */}
      <div className="p-6 flex-1 flex flex-col justify-between z-10">
        <div>
          <div className="text-[10px] font-mono text-[#00F5D4] uppercase mb-2 tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-ping" />
            Tactical Operation
          </div>
          <h3 className="text-xl font-bold mb-2 line-clamp-1 group-hover:text-[#FFD700] transition-colors">{ev.title}</h3>
          <p className="text-sm text-zinc-400 mb-6 line-clamp-3 leading-relaxed">{ev.description || "No description provided."}</p>
        </div>
        
        {/* Action Block */}
        <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-3">
          {ev.documentUrl && (() => {
            let docs: string[] = [];
            if (ev.documentUrl.startsWith("[")) {
              try { docs = JSON.parse(ev.documentUrl); } catch { docs = [ev.documentUrl]; }
            } else { docs = [ev.documentUrl]; }
            return docs.length > 0 ? (
              <div className="flex flex-col gap-1.5 w-full bg-black/40 border border-zinc-800/40 p-2.5 rounded-lg">
                <span className="text-[8px] font-mono uppercase text-zinc-400 tracking-wider">Uploaded templates/resources:</span>
                {docs.map((doc, idx) => (
                  <a
                    key={idx}
                    href={getFileUrl(doc)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-mono text-zinc-300 hover:text-[#FFD700] transition truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText className="w-3.5 h-3.5 text-[#00F5D4] shrink-0" />
                    <span className="truncate">{doc.split("/").pop()}</span>
                  </a>
                ))}
              </div>
            ) : null;
          })()}

          <div className="flex items-center justify-between mt-1 w-full">
            <span className="text-[10px] font-mono text-zinc-500">{"// CHAKRAVYUH_FORMATION"}</span>
            <Link href={`/events/${ev.slug}`} className="px-4 py-1.5 rounded bg-black/60 border border-[#FFD700]/30 hover:bg-[#FFD700] hover:border-[#FFD700] hover:text-black text-xs font-bold font-mono tracking-widest uppercase transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,215,0,0.4)] flex items-center gap-1.5 text-[#FFD700]">
              Engage Strategy <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    // Fetch Latest Events (Top 3 active)
    api<{ events: EventItem[] }>("/events?limit=3").then((res) => {
      if (res.events) {
        const publicEvents = res.events
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
          .slice(0, 3);
        setEvents(publicEvents);
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden selection:bg-[#FFD700]/30 font-sans relative">
      
      {/* Background Chakravyuh Canvas */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#030712]">
        <PlexusBackground />
        
        {/* Navy Blue Solid Overlay */}
        <div className="absolute inset-0 bg-[#030712]/80 z-10" />

        {/* Texture Grid Lines */}
        <div className="absolute inset-0 opacity-[0.03] z-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(#FFD700 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      {/* Navbar */}
      <header className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <SentinalLogo animateDrawing={true} />
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 sm:gap-4">
          {/* Desktop Navigation Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/about" className="px-4 py-2 bg-black/40 border border-[#121F3D] rounded-md text-xs font-mono uppercase hover:border-[#FFD700]/60 hover:text-[#FFD700] hover:bg-[#050A18] transition-all duration-300 flex items-center gap-1.5 text-zinc-300">
              <Info className="w-3.5 h-3.5 text-[#FFD700]" /> About
            </Link>
            <Link href="/team" className="px-4 py-2 bg-black/40 border border-[#121F3D] rounded-md text-xs font-mono uppercase hover:border-[#00F5D4]/60 hover:text-[#00F5D4] hover:bg-[#050A18] transition-all duration-300 flex items-center gap-1.5 text-zinc-300">
              <Users className="w-3.5 h-3.5 text-[#00F5D4]" /> Crew
            </Link>
            <Link href="/auth" className="px-5 py-2 bg-gradient-to-r from-[#FFD700] to-[#00F5D4] rounded-md text-xs font-mono font-black text-black uppercase hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:scale-[1.02] transition-all duration-300 flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </Link>
          </div>

          {/* Mobile Navigation Icons */}
          <div className="flex md:hidden items-center gap-3">
            <Link href="/about" className="flex items-center justify-center p-1.5 text-[#FFD700] hover:text-white transition-colors" title="About">
              <Info className="w-5 h-5" />
            </Link>
            <Link href="/team" className="flex items-center justify-center p-1.5 text-[#00F5D4] hover:text-white transition-colors" title="Crew">
              <Users className="w-5 h-5" />
            </Link>
            <Link href="/auth" className="flex items-center justify-center p-1.5 text-slate-300 hover:text-white transition-colors" title="Sign In">
              <LogIn className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-12 sm:pt-20 pb-32 sm:pb-48 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center text-center relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/40 text-[#FFD700] text-xs font-mono mb-8 uppercase tracking-widest shadow-[0_0_15px_rgba(255,215,0,0.15)]"
          >
            <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping" />
            Strategic Mahabharat Defense Formation
          </motion.div>
 
          <motion.h1 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[4rem] sm:text-[6.5rem] md:text-[8.5rem] lg:text-[10.5rem] xl:text-[12.5rem] font-black tracking-tighter mb-8 text-[#FFFFFF] select-none drop-shadow-[0_5px_25px_rgba(0,0,0,0.9)]"
            style={{ lineHeight: 1.05 }}
          >
            The Invincible <br className="hidden sm:block"/> <TypingText />
          </motion.h1>
 
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-zinc-300 max-w-3xl mb-8 select-none px-4 leading-relaxed font-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          >
            Welcome to <span className="text-[#FFD700] font-semibold drop-shadow-[0_0_12px_rgba(255,215,0,0.5)]">Chakravyuh Club</span>. Inspired by the legendary 7-tier strategic formation of Mahabharat, fusing ancient military intellect with modern cyber defense to shield your enterprise.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full max-w-md sm:max-w-none"
          >
            <Link href="/auth" className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#FFD700] to-[#E5A93C] rounded-lg font-bold font-mono uppercase text-base text-black overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-[1.02] border border-[#FFD700]/50 flex items-center justify-center">
              <span className="relative flex items-center gap-2">
                Deploy Chakravyuh Shield 
                <Shield className="w-5 h-5 group-hover:scale-110 transition-transform text-black" />
              </span>
            </Link>
            <a href="#events" className="group w-full sm:w-auto px-8 py-4 bg-[#050A18]/80 border border-[#00F5D4]/40 rounded-lg font-bold font-mono uppercase text-base text-[#00F5D4] hover:text-white hover:bg-[#080E24] hover:border-[#00F5D4] transition-all hover:shadow-[0_0_20px_rgba(0,245,212,0.3)] hover:scale-[1.02] flex items-center justify-center gap-2">
              Explore Operations <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </section>
 
        {/* Latest Events Section */}
        <section id="events" className="px-6 max-w-7xl mx-auto mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase font-mono tracking-tight">Tactical <span style={{ color: "#FFD700" }}>Operations</span> & <span style={{ color: "#00F5D4" }}>Events</span></h2>
            <p className="text-zinc-400 max-w-xl mx-auto font-sans">Discover workshops, hackathons, and strategic summits organized by Chakravyuh Club.</p>
          </div>

          {events.length === 0 ? (
            <div className="text-center p-12 rounded-2xl bg-[#080E24]/60 border border-[#121F3D]">
              <Calendar className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <p className="text-zinc-400">No public operations scheduled at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {events.map((ev, i) => (
                <EventCard key={ev.id} ev={ev} i={i} />
              ))}
            </div>
          )}
        </section>

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
      <div className="fixed bottom-6 right-6 z-50 hidden sm:flex flex-col gap-3">
        <a href="https://linkedin.com/company/chakravyuh" target="_blank" rel="noopener noreferrer"
           className="w-11 h-11 rounded-full bg-[#050A18]/90 border border-[#121F3D] flex items-center justify-center hover:border-[#FFD700] text-zinc-400 hover:text-[#FFD700] shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(255,215,0,0.25)] flex items-center justify-center"
           title="Chakravyuh LinkedIn">
           <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
        </a>
        <a href="https://www.instagram.com/chakravyuh.charusat/" target="_blank" rel="noopener noreferrer"
           className="w-11 h-11 rounded-full bg-[#050A18]/90 border border-[#121F3D] flex items-center justify-center hover:border-[#00F5D4] text-zinc-400 hover:text-[#00F5D4] shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(0,245,212,0.25)] flex items-center justify-center"
           title="Chakravyuh Instagram">
           <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        </a>
        <a href="https://chat.whatsapp.com/chakravyuh" target="_blank" rel="noopener noreferrer"
           className="w-11 h-11 rounded-full bg-[#050A18]/90 border border-[#121F3D] flex items-center justify-center hover:border-[#FFD700] text-zinc-400 hover:text-[#FFD700] shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(255,215,0,0.25)] flex items-center justify-center text-lg leading-none"
           title="Join WhatsApp Group">
           <span>💬</span>
        </a>
      </div>
    </div>
  );
}
