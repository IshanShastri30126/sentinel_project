"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SentinalLogo } from "@/components/SentinalLogo";
import { CyberButton } from "@/components/ui/CyberButton";
import { CyberStatus } from "@/components/ui/CyberStatus";
import { useAuth } from "@/lib/auth-context";
import { 
  Calendar, 
  Info, 
  Users, 
  LogIn, 
  LayoutDashboard, 
  Menu, 
  X, 
  Trophy 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinkItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_LINKS: NavLinkItem[] = [
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
  { name: "About", href: "/about", icon: Info },
  { name: "Team", href: "/team", icon: Users },
];

/**
 * Navbar
 *
 * Primary navigation header featuring tactical glassmorphism,
 * live telemetry indicators, responsive mobile drawer, and dynamic auth routing.
 *
 * @returns {JSX.Element} Rendered navigation bar.
 */
export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#030712]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3">
          <SentinalLogo animateDrawing={false} />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 font-mono text-xs tracking-wider uppercase">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3.5 py-1.5 rounded-md transition-all duration-200 flex items-center gap-2 text-slate-400 hover:text-[#00F5D4] hover:bg-white/[0.03]",
                  isActive && "text-[#00F5D4] font-semibold bg-[rgba(0,245,212,0.08)] border border-[rgba(0,245,212,0.25)]"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-[#00F5D4]" : "text-slate-500")} />
                <span>{link.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#00F5D4] shadow-[0_0_8px_rgba(0,245,212,0.8)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Status Telemetry & Action Buttons */}
        <div className="hidden sm:flex items-center gap-4">
          <CyberStatus status="operational" label="ACTIVE" />

          {user ? (
            <Link href="/dashboard">
              <CyberButton
                variant="primary"
                size="sm"
                leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
              >
                DASHBOARD
              </CyberButton>
            </Link>
          ) : (
            <Link href="/auth">
              <CyberButton
                variant="secondary"
                size="sm"
                leftIcon={<LogIn className="w-3.5 h-3.5" />}
              >
                SIGN IN
              </CyberButton>
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          {user ? (
            <Link href="/dashboard">
              <CyberButton variant="primary" size="sm">
                PORTAL
              </CyberButton>
            </Link>
          ) : (
            <Link href="/auth">
              <CyberButton variant="secondary" size="sm">
                SIGN IN
              </CyberButton>
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md border border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden border-t border-white/[0.08] bg-[#070D18]/95 backdrop-blur-2xl px-5 py-4 space-y-3"
          >
            <div className="pb-2 border-b border-white/[0.06]">
              <CyberStatus status="operational" label="ACTIVE" />
            </div>

            <nav className="flex flex-col space-y-1 font-mono text-xs uppercase tracking-wider">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-slate-300 hover:text-[#00F5D4] hover:bg-white/[0.04]",
                      isActive && "bg-cyan-500/10 text-[#00F5D4] font-semibold border border-cyan-500/30"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
