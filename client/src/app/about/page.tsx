"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, ShieldAlert, Trophy, Terminal, Heart, Info, Users, LogIn } from "lucide-react";
import { CyberKavachLogo } from "@/components/CyberKavachLogo";
import PlexusBackground from "@/components/PlexusBackground";

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

export default function AboutPage() {
  const pillars = [
    {
      icon: <ShieldAlert className="w-8 h-8 text-red-500" />,
      title: "Ethical Hacking & Audits",
      desc: "Educating developers and enthusiasts in testing environments, discovering critical structural weaknesses, and writing reports."
    },
    {
      icon: <Trophy className="w-8 h-8 text-amber-500" />,
      title: "CTF Competition Training",
      desc: "Drilling skills in cryptography, reverse engineering, web exploitation, and binary analysis to compete globally."
    },
    {
      icon: <Terminal className="w-8 h-8 text-red-400" />,
      title: "Incident Simulation",
      desc: "Simulating live red-team vs blue-team cyber attack protocols to train defense analysts in threat remediation."
    },
    {
      icon: <Heart className="w-8 h-8 text-orange-500" />,
      title: "Community Outreach",
      desc: "Spreading digital hygiene awareness, securing systems locally, and encouraging safe technological habits."
    }
  ];

  const timelineEvents = [
    {
      year: "2024",
      title: "Club Foundation",
      desc: "Chakravyuh formed as a dedicated cyber strategic defense interest group with 30 initial members."
    },
    {
      year: "2025",
      title: "Scaling Operations",
      desc: "Expanded to 200+ members. Launched major college-level Hackathons and strategic defense scoring boards."
    },
    {
      year: "2026",
      title: "Chakravyuh 2.0 Hub",
      desc: "Launched a centralized digital operations workspace hosting attendance scanner consoles and credential verification."
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden selection:bg-[#FFD700]/30 font-sans relative">
      
      {/* Interactive 7-Tier Chakravyuh Background Canvas */}
      <PlexusBackground />

      {/* Cyberpunk Grid Overlay and Ambient Neon Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,245,212,0.12),rgba(3,7,18,0.85))]" />
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#121F3D20_1px,transparent_1px),linear-gradient(to_bottom,#121F3D20_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Navbar */}
      <header className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto border-b border-[#121F3D]">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#FFD700]" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <CyberKavachLogo animateDrawing={true} />
            </Link>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 sm:gap-5">
          <Link href="/about" className="md:hidden flex items-center justify-center p-1.5 text-[#FFD700] hover:text-white transition-colors" title="About">
            <Info className="w-5 h-5" />
          </Link>
          <Link href="/team" className="md:hidden flex items-center justify-center p-1.5 text-[#00F5D4] hover:text-[#FFD700] transition-colors" title="Crew">
            <Users className="w-5 h-5" />
          </Link>
          <Link href="/auth" className="md:hidden flex items-center justify-center p-1.5 text-slate-400 hover:text-white transition-colors" title="Sign In">
            <LogIn className="w-5 h-5" />
          </Link>
        </motion.div>
      </header>

      <main className="relative z-10 pt-16 pb-32 px-6 max-w-7xl mx-auto">
        {/* Header Hero */}
        <div className="text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs font-mono mb-6 uppercase tracking-wider animate-pulse"
          >
            Invincible Strategic Shield
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-br from-white via-slate-200 to-[#FFD700] bg-clip-text text-transparent"
          >
            Our Mission & Vision
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed"
          >
            Chakravyuh Club is a collective of security researchers, software developers, and ethical hackers. Inspired by the legendary 7-tier strategic formation of Mahabharat, we build invincible cyber defense systems through collaborative training and simulations.
          </motion.p>
        </div>

        {/* Pillars of Focus */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight">Core Pillars of <span className="text-[#FFD700] font-mono">Chakravyuh</span></h2>
            <p className="text-zinc-500 text-xs mt-1 font-mono">{"// CORE COMPETENCIES & FORMATION"}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative rounded-2xl bg-[#080E24]/60 border border-[#121F3D] hover:border-[#FFD700]/50 p-6 transition-all hover:bg-[#050A18]"
              >
                <div className="absolute top-4 right-4 text-[8px] font-mono text-zinc-500 group-hover:text-[#FFD700]/70 transition-colors">
                  SEC_PLR_{idx + 1}
                </div>
                <div className="mb-4 p-3 rounded-xl bg-black/40 w-fit border border-white/5 group-hover:border-[#FFD700]/30 group-hover:bg-[#FFD700]/10 transition-all text-[#00F5D4]">
                  {p.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-[#FFD700] transition-colors">{p.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Timeline Section */}
        <section className="mb-20 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight">System <span className="text-[#FFD700]">Timeline</span></h2>
            <p className="text-zinc-500 text-xs mt-1 font-mono">{"// CHRONOLOGICAL ARCHIVE"}</p>
          </div>

          <div className="relative border-l border-zinc-800 ml-4 md:ml-32 pl-8 space-y-12">
            {timelineEvents.map((ev, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative"
              >
                {/* Visual marker point */}
                <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-black border-2 border-[#FFD700] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping" />
                </div>
                
                {/* Year Label */}
                <span className="hidden md:block absolute -left-[160px] top-1 font-mono text-lg font-extrabold text-[#FFD700]">
                  {ev.year}
                </span>

                <div className="p-6 rounded-2xl bg-[#080E24]/60 border border-[#121F3D] hover:border-[#FFD700]/30 transition-colors">
                  <span className="md:hidden block font-mono text-sm font-bold text-[#FFD700] mb-1">{ev.year}</span>
                  <h3 className="text-xl font-bold mb-2 text-white">{ev.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{ev.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#121F3D] bg-[#030712] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <CyberKavachLogo collapsed={true} showText={true} />
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
           <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75-1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
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
