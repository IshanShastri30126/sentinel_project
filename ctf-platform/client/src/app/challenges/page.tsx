// Created: 2026-08-11 | Modified: Initial creation — Challenge Board page with filters

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Swords, RefreshCw, ShieldAlert, LogIn, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useCompetition } from "@/hooks/useCompetition";
import { useSocket } from "@/hooks/useSocket";
import { getChallenges, joinCompetition, Challenge } from "@/lib/api";
import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { ChallengeDetailDialog } from "@/components/challenges/ChallengeDetailDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const categories = [
    "ALL",
    "WEB",
    "CRYPTO",
    "REVERSING",
    "FORENSICS",
    "OSINT",
    "STEGO",
    "MISC",
] as const;

function ChallengesContent() {
    const { competition } = useCompetition();
    const { presenceData, viewChallenge, leaveChallenge, liveSolve } = useSocket(
        competition?.id || null
    );

    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [notRegistered, setNotRegistered] = useState(false);
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>("ALL");
    const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Fetch challenges
    const fetchChallenges = useCallback(async () => {
        if (!competition?.id) return;
        setLoading(true);
        setNotRegistered(false);
        setJoinError(null);
        const res = await getChallenges(competition.id);
        if (res.success && res.data) {
            setChallenges(res.data);
        } else {
            if (res.message && res.message.toLowerCase().includes("join this competition")) {
                setNotRegistered(true);
            }
        }
        setLoading(false);
    }, [competition?.id]);

    const handleJoinCompetition = async () => {
        if (!competition?.id) return;
        setJoining(true);
        setJoinError(null);
        const res = await joinCompetition(competition.id);
        if (res.success) {
            setNotRegistered(false);
            fetchChallenges();
        } else {
            setJoinError(res.message || "Failed to join competition.");
        }
        setJoining(false);
    };

    useEffect(() => {
        fetchChallenges();
    }, [fetchChallenges]);

    // Refresh on live solve (update solve counts)
    useEffect(() => {
        if (liveSolve) {
            fetchChallenges();
        }
    }, [liveSolve, fetchChallenges]);

    // Filter by category
    const filtered =
        activeCategory === "ALL"
            ? challenges
            : challenges.filter((c) => c.category === activeCategory);

    // Open challenge dialog
    const openChallenge = (id: string) => {
        setSelectedChallengeId(id);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1
                        className="text-2xl font-bold tracking-tight text-white"
                        style={{ fontFamily: "var(--font-heading)" }}
                    >
                        Challenge Board
                    </h1>
                    <p className="text-xs mt-1 text-slate-400 font-mono">
                        {challenges.length} challenge{challenges.length !== 1 ? "s" : ""} available
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchChallenges}
                    className="text-[var(--muted-foreground)] hover:text-[var(--ctf-green)]"
                >
                    <RefreshCw className="size-4 mr-1" />
                    Refresh
                </Button>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${activeCategory === cat
                                ? "bg-[var(--ctf-green-subtle)] text-[var(--ctf-green)] border border-[var(--ctf-green)]/20"
                                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 border border-transparent"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Challenge Grid */}
            {notRegistered ? (
                <div
                    className="flex flex-col items-center justify-center rounded-lg border p-8 text-center max-w-lg mx-auto my-12"
                    style={{
                        backgroundColor: "rgba(255, 184, 0, 0.05)",
                        borderColor: "rgba(255, 184, 0, 0.2)",
                    }}
                >
                    <ShieldAlert className="size-12 mb-3 text-[var(--ctf-amber)]" />
                    <h2
                        className="text-lg font-bold uppercase tracking-wider text-white mb-2"
                        style={{ fontFamily: "var(--font-heading)" }}
                    >
                        Enlistment Required
                    </h2>
                    <p className="text-xs text-[#aaa] max-w-sm mb-6 leading-relaxed">
                        You have not joined {competition?.title || "this competition"} yet. Enlist your operative account to access tactical challenges, submit flags, and track progression.
                    </p>
                    {joinError && (
                        <p className="text-xs text-[var(--ctf-red)] mb-4">{joinError}</p>
                    )}
                    <Button
                        onClick={handleJoinCompetition}
                        disabled={joining}
                        className="bg-[var(--ctf-green)] text-black hover:bg-[var(--ctf-green)]/90 font-bold font-mono text-xs px-6 py-2"
                    >
                        {joining ? (
                            <>
                                <Loader2 className="size-4 animate-spin mr-2" />
                                ENLISTING OPERATIVE...
                            </>
                        ) : (
                            <>
                                <LogIn className="size-4 mr-2" />
                                JOIN COMPETITION NOW
                            </>
                        )}
                    </Button>
                </div>
            ) : loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-40 rounded-lg" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Swords className="size-10 text-slate-500" />
                    <p className="text-sm text-slate-400 font-mono">
                        {activeCategory === "ALL"
                            ? "No challenges available yet."
                            : `No ${activeCategory} challenges found.`}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((challenge, index) => (
                        <ChallengeCard
                            key={challenge.id}
                            challenge={challenge}
                            viewers={presenceData[challenge.id] || 0}
                            onClick={() => openChallenge(challenge.id)}
                            index={index}
                        />
                    ))}
                </div>
            )}

            {/* Challenge Detail Dialog */}
            <ChallengeDetailDialog
                challengeId={selectedChallengeId}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSolved={fetchChallenges}
                viewers={selectedChallengeId ? presenceData[selectedChallengeId] || 0 : 0}
                onView={viewChallenge}
                onLeave={leaveChallenge}
            />
        </div>
    );
}

export default function ChallengesPage() {
    return (
        <AppShell>
            <ChallengesContent />
        </AppShell>
    );
}
