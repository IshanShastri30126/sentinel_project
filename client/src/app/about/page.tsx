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

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden selection:bg-[#FFD700]/30 font-sans relative">
      
      {/* Interactive 7-Tier Chakravyuh Background Canvas (Bright & Visible) */}
      <PlexusBackground opacity={0.65} />

      {/* Cyber Grid & Glowing Ambient Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-[#030712]/65 via-[#030712]/50 to-[#030712]/85" />
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,245,212,0.2),transparent)]" />
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#121F3D30_1px,transparent_1px),linear-gradient(to_bottom,#121F3D30_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

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

      <main className="relative z-10 pt-12 pb-32 px-6 max-w-7xl mx-auto">
        {/* Header Title & Tagline */}
        <div className="text-center mb-10 relative">
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs font-mono mb-4 uppercase tracking-wider animate-pulse shadow-[0_0_15px_rgba(255,215,0,0.2)]"
          >
            <Shield className="w-3.5 h-3.5 text-[#00F5D4]" /> CSPIT CE DEPARTMENT • CYBERSECURITY CLUB
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-4xl sm:text-6xl md:text-7xl font-black mb-4 bg-gradient-to-br from-white via-slate-200 to-[#FFD700] bg-clip-text text-transparent tracking-tight font-mono uppercase"
          >
            CHAKRAVYUH CLUB
          </motion.h1>

          <p className="text-slate-400 text-sm sm:text-base font-mono max-w-2xl mx-auto uppercase tracking-widest">
            Strategic Cyber Defense • Peer Mentorship • Competitive Warfare
          </p>
        </div>

        {/* 1. Chakravyuh Club Official Banner Image (Max Width Display) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.6 }}
          className="w-full max-w-5xl mx-auto mb-12 relative rounded-3xl overflow-hidden border-2 border-[#FFD700]/40 shadow-[0_0_35px_rgba(255,215,0,0.2)] hover:border-[#00F5D4]/60 transition-all duration-500 group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/images/chakravyuh_banner.png" 
            alt="Chakravyuh Club Official Cyber Defense Banner" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/cyber_banner.png";
            }}
            className="w-full max-h-[450px] object-cover group-hover:scale-102 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-black/80 border border-[#FFD700]/40 text-[#FFD700] text-xs font-mono font-bold uppercase tracking-widest backdrop-blur-md shadow-lg flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[#00F5D4]" /> CHAKRAVYUH CLUB BARRACKS
            </span>
          </div>
        </motion.div>

        {/* 2. Detailed Text Information (Paragraph Format inside Cards) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="w-full max-w-5xl mx-auto space-y-6 mb-24"
        >
          {/* Box 1: About Us, Origins & Working Saturday Peer Sessions */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#080E24]/90 border border-[#121F3D] hover:border-[#FFD700]/40 transition-all shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00F5D4]/5 blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-[#00F5D4] animate-ping" />
              <span className="text-xs font-mono font-bold text-[#00F5D4] uppercase tracking-widest">ABOUT US & WORKING SATURDAY SESSIONS</span>
            </div>

            <div className="space-y-4 text-base sm:text-lg text-slate-200 leading-relaxed font-sans">
              <p>
                Chakravyuh Club was originally renowned as the flagship <strong className="text-[#FFD700]">Cybersecurity Club of the CSPIT Computer Engineering (CE) Department</strong>, created for conducting peer learning sessions for cybersecurity enthusiasts with keynote lectures delivered by external guest speakers.
              </p>
              
              <p>
                The best part of the club is that every working Saturday, senior members and domain experts share their knowledge on cybersecurity and deliver dedicated hands-on sessions to members and juniors for continuous knowledge improvement and cyber awareness. The club is open to all persons with no prior prerequisites required.
              </p>
            </div>
          </div>

          {/* Box 2: Evolution to Competitive Cyber Operations */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#080E24]/90 via-[#050A18]/90 to-black/90 border-2 border-[#FFD700]/30 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs font-mono font-bold uppercase tracking-widest">
                BY THE STUDENTS • FOR THE STUDENTS
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-white font-mono uppercase mb-4">
              Practical & Competitive Cybersecurity Operations
            </h3>

            <div className="space-y-4 text-base sm:text-lg text-slate-200 leading-relaxed font-sans">
              <p>
                Nowadays, due to a surge in events and peer learning sessions, students often did not get enough practice and competitive experience in the cybersecurity field.
              </p>

              <p>
                To solve this, <strong className="text-[#FFD700]">Chakravyuh Club</strong> is launched with a fresh vision of organizing various competitive and practical events like <strong className="text-[#00F5D4]">CTF (Capture The Flag) competitions, Bug Bounty programs, Hackathons, Seminars, and Workshops</strong> for the overall development of students — by the students, for the students.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Pillars of Focus */}
        <section className="mb-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold tracking-tight text-white font-mono uppercase">Core Pillars of <span className="text-[#FFD700]">Chakravyuh</span></h2>
            <p className="text-zinc-500 text-xs mt-1 font-mono">{"// CORE COMPETENCIES & STRATEGIC FORMATION"}</p>
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

        {/* Bottom Banner Section — Evolution to Competitive Cyber Defense */}
        <section className="mb-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#080E24] via-[#050A18] to-black border-2 border-[#FFD700]/40 relative overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.15)]"
          >
            <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-[#FFD700]/10 to-transparent pointer-events-none" />
            
            <div className="max-w-3xl relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] text-xs font-mono uppercase tracking-widest font-bold">
                BY THE STUDENTS • FOR THE STUDENTS
              </div>
              
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-mono tracking-tight uppercase">
                Bridging the Gap with Competitive Cyber Operations
              </h2>
              
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
                Nowadays, while peer learning sessions build baseline awareness, students often lack hands-on practice and real-world competitive experience in the rapidly evolving cybersecurity landscape.
              </p>

              <div className="p-5 rounded-2xl bg-black/70 border border-[#121F3D] space-y-3">
                <p className="text-sm sm:text-base text-slate-200 font-sans leading-relaxed">
                  To address this, <strong className="text-[#FFD700]">Chakravyuh Club</strong> was launched with a fresh vision to host diverse, high-impact competitive events:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {[
                    "🚩 CTF (Capture The Flag)",
                    "🐛 Bug Bounty Contests",
                    "⚡ Cyber Hackathons",
                    "🎤 Expert Seminars",
                    "🛠️ Hands-on Workshops",
                    "🛡️ Red/Blue Simulations"
                  ].map((feat, i) => (
                    <div key={i} className="px-3 py-2 rounded-xl bg-[#080E24] border border-[#121F3D] text-xs font-mono font-bold text-[#00F5D4] flex items-center gap-1.5">
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 font-mono italic pt-2">
                &quot;Empowering students with practical battle-testing, skill-building, and competitive leadership in cybersecurity.&quot;
              </p>
            </div>
          </motion.div>
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
