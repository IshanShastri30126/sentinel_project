// Created: 2026-08-11 | Modified: Initial creation — Slim sidebar navigation

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield,
    Swords,
    Trophy,
    User,
    ChevronLeft,
    ChevronRight,
    Wifi,
    WifiOff,
    Zap,
    ShieldCheck,
    FileText,
    Grid3X3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
    isConnected: boolean;
}

const navItems = [
    { href: "/lobby", label: "Lobby", icon: Shield },
    { href: "/challenges", label: "Challenges", icon: Swords },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/my-scores", label: "My Scores", icon: User },
];

const adminNavItems = [
    { href: "/admin", label: "Dashboard", icon: ShieldCheck },
    { href: "/admin/submissions", label: "Submissions", icon: FileText },
    { href: "/admin/heatmap", label: "Heatmap", icon: Grid3X3 },
];

export function Sidebar({ isConnected }: SidebarProps) {
    const [expanded, setExpanded] = useState(false);
    const pathname = usePathname();

    return (
        <motion.aside
            initial={false}
            animate={{ width: expanded ? 200 : 56 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-[var(--ctf-bg)] py-4"
            style={{ borderColor: "var(--ctf-border)" }}
        >
            {/* Logo */}
            <div className="flex items-center justify-center px-3 mb-6">
                <Zap className="size-6 text-[var(--ctf-green)] shrink-0" />
                <AnimatePresence>
                    {expanded && (
                        <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="ml-2 text-sm font-bold whitespace-nowrap overflow-hidden"
                            style={{
                                fontFamily: "var(--font-heading)",
                                color: "var(--ctf-green)",
                            }}
                        >
                            CTF WARS
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-1 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                                isActive
                                    ? "bg-[var(--ctf-green-subtle)] text-[var(--ctf-green)]"
                                    : "text-[var(--muted-foreground)] hover:bg-[var(--ctf-green-subtle)] hover:text-[var(--ctf-green)]"
                            )}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-[var(--ctf-green)]"
                                    style={{
                                        boxShadow: "0 0 12px var(--ctf-green-glow)",
                                    }}
                                />
                            )}

                            <Icon className="size-4 shrink-0" />

                            <AnimatePresence>
                                {expanded && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="whitespace-nowrap overflow-hidden"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    );
                })}

                {/* Admin Separator */}
                <div
                    className="mx-1 my-2 h-px"
                    style={{ backgroundColor: "var(--ctf-border)" }}
                />

                {/* Admin Nav */}
                {adminNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                                isActive
                                    ? "bg-[var(--ctf-green-subtle)] text-[var(--ctf-green)]"
                                    : "text-[var(--muted-foreground)] hover:bg-[var(--ctf-green-subtle)] hover:text-[var(--ctf-green)]"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-[var(--ctf-green)]"
                                    style={{
                                        boxShadow: "0 0 12px var(--ctf-green-glow)",
                                    }}
                                />
                            )}

                            <Icon className="size-4 shrink-0" />

                            <AnimatePresence>
                                {expanded && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="whitespace-nowrap overflow-hidden"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    );
                })}
            </nav>

            {/* Connection Status */}
            <div className="px-3 mb-2">
                <div
                    className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs",
                        isConnected
                            ? "text-[var(--ctf-green)]"
                            : "text-[var(--ctf-orange)]"
                    )}
                >
                    {isConnected ? (
                        <Wifi className="size-3.5 shrink-0 pulse-live" />
                    ) : (
                        <WifiOff className="size-3.5 shrink-0" />
                    )}
                    <AnimatePresence>
                        {expanded && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="whitespace-nowrap"
                            >
                                {isConnected ? "Live" : "Offline"}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="mx-2 flex items-center justify-center rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--ctf-green-subtle)] hover:text-[var(--ctf-green)] transition-colors"
            >
                {expanded ? (
                    <ChevronLeft className="size-4" />
                ) : (
                    <ChevronRight className="size-4" />
                )}
            </button>
        </motion.aside>
    );
}
