"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, CheckCircle2, Users, Trophy, Terminal, Award } from "lucide-react";
import { SentinalLogo } from "@/components/SentinalLogo";

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
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-[#00F5D4]/20">
      
      {/* Top Navbar */}
      <header className="border-b border-[#121F3D] bg-[#050A18]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg bg-black/40 border border-[#121F3D] hover:border-[#00F5D4] text-slate-300 hover:text-[#00F5D4] transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <SentinalLogo animateDrawing={false} />
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <Link href="/team" className="text-slate-300 hover:text-[#00F5D4] transition-colors">
              Team Roster
            </Link>
            <Link href="/auth" className="px-3 py-1.5 rounded-lg bg-[#FFD700] text-black font-bold hover:opacity-90 transition-opacity">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area — Simple, Sober & Informative */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        
        {/* Title Header */}
        <div className="border-b border-[#121F3D] pb-8">
          <div className="flex items-center gap-2 text-xs font-mono text-[#00F5D4] uppercase tracking-widest mb-2">
            <Shield className="w-4 h-4 text-[#00F5D4]" />
            <span>CSPIT Computer Engineering Department</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight uppercase">
            About Chakravyuh Club
          </h1>
          <p className="text-slate-400 text-sm font-mono mt-2">
            Cybersecurity Learning Community & Practical Operations Gateway
          </p>
        </div>

        {/* Section 1: Overview */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#FFD700] font-mono uppercase tracking-wider">
            1. Origin & Working Saturday Peer Sessions
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Chakravyuh Club is the official <strong>Cybersecurity Club of the Computer Engineering (CE) Department at CSPIT</strong>. It was created to foster continuous technical growth, peer mentorship, and digital security awareness among students.
          </p>
          <p className="text-slate-300 text-base leading-relaxed">
            A key tradition of the club is our dedicated <strong>Working Saturday peer-learning sessions</strong>. Every working Saturday, senior members, domain leads, and invited guest speakers host interactive, hands-on workshops for all members and juniors. No prior prerequisites or advanced cybersecurity experience are required — anyone with enthusiasm for technology is welcome to join.
          </p>
        </section>

        {/* Section 2: Competitive Evolution */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#00F5D4] font-mono uppercase tracking-wider">
            2. Practical & Competitive Cybersecurity Focus
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            While classroom lectures and peer discussions build baseline knowledge, students need hands-on practice to excel in real-world cybersecurity environments.
          </p>
          <p className="text-slate-300 text-base leading-relaxed">
            Chakravyuh Club bridges this gap by organizing competitive events created <em>by the students, for the students</em>:
          </p>
          
          <ul className="space-y-2 pt-2 text-slate-300 text-sm font-mono">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#00F5D4] shrink-0" />
              <span><strong>CTF (Capture The Flag) Competitions:</strong> Jeopardy & Attack-Defense challenges in Web, Crypto, Reverse Engineering, and Forensics.</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#00F5D4] shrink-0" />
              <span><strong>Bug Bounty Programs:</strong> Vulnerability assessment and defensive audit practice.</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#00F5D4] shrink-0" />
              <span><strong>Cyber Hackathons & Seminars:</strong> Building security utilities and learning from industry security professionals.</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#00F5D4] shrink-0" />
              <span><strong>Hands-on Technical Workshops:</strong> Practical lab sessions on Linux, Network Security, and Threat Remediation.</span>
            </li>
          </ul>
        </section>

        {/* Section 3: Core Pillars */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white font-mono uppercase tracking-wider">
            3. Key Objectives & Activities
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="border-l-2 border-[#FFD700] pl-4 space-y-1">
              <h3 className="text-base font-bold text-white font-mono">Ethical Hacking & Audits</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Educating students in authorized testing environments, identifying code vulnerabilities, and generating structured remediation reports.
              </p>
            </div>

            <div className="border-l-2 border-[#00F5D4] pl-4 space-y-1">
              <h3 className="text-base font-bold text-white font-mono">Competitive CTF Training</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Training members in cryptography, reverse engineering, web exploitation, and binary analysis to compete in national and global CTFs.
              </p>
            </div>

            <div className="border-l-2 border-indigo-400 pl-4 space-y-1">
              <h3 className="text-base font-bold text-white font-mono">Incident Simulation</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Simulating threat scenarios to train defense analysts in threat detection, response, and system hardening.
              </p>
            </div>

            <div className="border-l-2 border-emerald-400 pl-4 space-y-1">
              <h3 className="text-base font-bold text-white font-mono">Community & Digital Hygiene</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Promoting cyber hygiene awareness, password security, phishing prevention, and safe digital practices across campus.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Membership Info */}
        <section className="border-t border-[#121F3D] pt-8 space-y-3">
          <h2 className="text-lg font-bold text-white font-mono uppercase">
            Join the Community
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            All students across departments and semesters are welcome to attend peer sessions, join CTF teams, and participate in club activities.
          </p>
          <div className="pt-2">
            <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFD700] text-black font-bold font-mono text-xs uppercase tracking-wider hover:opacity-90 transition-opacity">
              Register as Operative
            </Link>
          </div>
        </section>

      </main>

      {/* Sober Footer */}
      <footer className="border-t border-[#121F3D] bg-[#050A18] py-8 text-xs font-mono text-slate-400">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Chakravyuh Club • CSPIT Computer Engineering Department</p>
          
          <div className="flex items-center gap-4 text-slate-400">
            <a href="https://linkedin.com/company/chakravyuhclub" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFD700] transition-colors" title="LinkedIn">
              <LinkedinIcon className="w-4 h-4" />
            </a>
            <a href="https://www.instagram.com/chakravyuh.charusat/" target="_blank" rel="noopener noreferrer" className="hover:text-[#00F5D4] transition-colors" title="Instagram">
              <InstagramIcon className="w-4 h-4" />
            </a>
            <a href="https://chat.whatsapp.com/chakravyuhclub" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFD700] transition-colors" title="WhatsApp">
              <WhatsappIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
