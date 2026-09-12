// Created: 2026-08-11 | Modified: Initial creation — Challenge Board page with filters

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Swords, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useCompetition } from "@/hooks/useCompetition";
import { useSocket } from "@/hooks/useSocket";
import { getChallenges, Challenge } from "@/lib/api";
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
    const [activeCategory, setActiveCategory] = useState<string>("ALL");
    const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Fetch challenges
    const fetchChallenges = useCallback(async () => {
        if (!competition?.id) return;
        setLoading(true);
        const res = await getChallenges(competition.id);
        if (res.success && res.data) {
            setChallenges(res.data);
        }
        setLoading(false);
    }, [competition?.id]);

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
                        className="text-2xl font-bold tracking-tight"
                        style={{ fontFamily: "var(--font-heading)" }}
                    >
                        Challenge Board
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "#666" }}>
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
            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-40 rounded-xl" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Swords className="size-10" style={{ color: "#333" }} />
                    <p className="text-sm" style={{ color: "#666" }}>
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
