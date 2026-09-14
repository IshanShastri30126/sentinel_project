"use client";

import React from "react";
import Link from "next/link";
import { SentinelLogo } from "@/components/SentinelLogo";
import { ShieldCheck, ArrowUpRight } from "lucide-react";

/**
 * Footer
 *
 * Operational cybersecurity platform footer containing sentinel identity,
 * quick navigation links, compliance telemetry marks, and social channels.
 *
 * @returns {JSX.Element} Rendered footer element.
 */
export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.08] bg-[#02050B] text-slate-400 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Column 1: Brand */}
        <div className="md:col-span-2 space-y-4">
          <SentinelLogo animateDrawing={false} />
          <p className="font-sans text-xs text-slate-400 max-w-sm leading-relaxed">
            SENTINEL is the centralized digital operations hub and cyber defense platform.
            Pioneering advanced vulnerability research, defense strategy summits, and competitive excellence.
          </p>
          <div className="flex items-center gap-2 font-mono text-[10px] text-cyan-400 tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00F5D4]" />
            <span>OPERATIONAL SECURITY HUB • ZERO TOLERANCE DEFENSE</span>
          </div>
        </div>

        {/* Column 2: Navigation Links */}
        <div className="space-y-3 font-mono text-xs uppercase tracking-wider">
          <h4 className="text-slate-200 font-bold text-[11px] mb-2 text-[#00F5D4]">
            [// DIRECTORY]
          </h4>
          <ul className="space-y-2">
            <li>
              <Link href="/event" className="hover:text-white transition-colors flex items-center gap-1">
                <span>Events & Summits</span>
                <ArrowUpRight className="w-3 h-3 text-slate-500" />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/leaderboard" className="hover:text-white transition-colors flex items-center gap-1">
                <span>Leaderboard</span>
                <ArrowUpRight className="w-3 h-3 text-slate-500" />
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white transition-colors flex items-center gap-1">
                <span>About Sentinel</span>
                <ArrowUpRight className="w-3 h-3 text-slate-500" />
              </Link>
            </li>
            <li>
              <Link href="/team" className="hover:text-white transition-colors flex items-center gap-1">
                <span>Executive Council</span>
                <ArrowUpRight className="w-3 h-3 text-slate-500" />
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Telemetry & Socials */}
        <div className="space-y-3 font-mono text-xs uppercase tracking-wider">
          <h4 className="text-slate-200 font-bold text-[11px] mb-2 text-[#00E1FF]">
            [// NETWORK]
          </h4>
          <div className="flex flex-col space-y-2">
            <a
              href="https://linkedin.com/company/chakravyuh-charusat"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E1FF]" />
              <span>LinkedIn</span>
            </a>
            <a
              href="https://instagram.com/chakravyuh.charusat"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4]" />
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-500">
        <p>© {new Date().getFullYear()} Sentinel. All systems operational.</p>
        <p className="text-slate-600 tracking-wide">
          SECURITY PROTOCOL: STRICT TLS 1.3 • AES-256 ENCRYPTION
        </p>
      </div>
    </footer>
  );
}
