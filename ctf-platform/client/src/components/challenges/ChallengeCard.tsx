// Created: 2026-08-11 | Modified: Initial creation — Challenge card component

"use client";

import { motion } from "framer-motion";
import { Eye, CheckCircle, XCircle, Lock } from "lucide-react";
import { Challenge } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
    challenge: Challenge;
    viewers: number;
    onClick: () => void;
    index: number;
}

const categoryColors: Record<string, string> = {
    WEB: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    CRYPTO: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    REVERSING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    FORENSICS: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    OSINT: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    STEGO: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    MISC: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const difficultyColors: Record<string, string> = {
    EASY: "text-[var(--ctf-green)]",
    MEDIUM: "text-[var(--ctf-amber)]",
    HARD: "text-[var(--ctf-orange)]",
    INSANE: "text-[var(--tier-grandmaster)]",
};

export function ChallengeCard({ challenge, viewers, onClick, index }: ChallengeCardProps) {
    const isSolved = challenge.userStatus === "SOLVED";
    const isAttempted = challenge.userStatus === "ATTEMPTED";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={onClick}
            className={cn(
                "group relative cursor-pointer rounded-lg border p-5 transition-all duration-200",
                isSolved
                    ? "border-[var(--ctf-green)]/30 bg-[var(--ctf-green-subtle)]"
                    : "border-[var(--ctf-border)] bg-[var(--ctf-card)] card-hover"
            )}
        >
            {/* Solved indicator */}
            {isSolved && (
                <div className="absolute top-3 right-3">
                    <CheckCircle className="size-5 text-[var(--ctf-green)]" />
                </div>
            )}
            {isAttempted && (
                <div className="absolute top-3 right-3">
                    <XCircle className="size-5 text-[var(--ctf-orange)]" />
                </div>
            )}

            {/* Category + Difficulty */}
            <div className="flex items-center gap-2 mb-3">
                <Badge
                    variant="outline"
                    className={cn("text-[10px] uppercase tracking-wider", categoryColors[challenge.category])}
                >
                    {challenge.category}
                </Badge>
                <span
                    className={cn("text-[10px] font-bold uppercase", difficultyColors[challenge.difficulty])}
                >
                    {challenge.difficulty}
                </span>
            </div>

            {/* Title */}
            <h3
                className="text-base font-semibold mb-2 line-clamp-2 group-hover:text-[var(--ctf-green)] transition-colors"
                style={{ fontFamily: "var(--font-heading)" }}
            >
                {challenge.title}
            </h3>

            {/* Points + Solve Count */}
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1">
                    <span
                        className="text-xl font-bold"
                        style={{
                            fontFamily: "var(--font-mono)",
                            color: isSolved ? "var(--ctf-green)" : "var(--foreground)",
                        }}
                    >
                        {challenge.currentPoints}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                        pts
                    </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    {/* Solve count */}
                    <span>
                        {challenge.solveCount} solve{challenge.solveCount !== 1 ? "s" : ""}
                    </span>

                    {/* Live viewers */}
                    {viewers > 0 && (
                        <span className="flex items-center gap-1 text-[var(--ctf-amber)]">
                            <Eye className="size-3" />
                            {viewers}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
