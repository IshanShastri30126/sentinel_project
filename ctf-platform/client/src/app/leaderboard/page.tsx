// Created: 2026-08-11 | Modified: Initial creation — Real-time leaderboard page

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, Award, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useCompetition } from "@/hooks/useCompetition";
import { useSocket } from "@/hooks/useSocket";
import { getLeaderboard, LeaderboardEntry } from "@/lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Tier Styling ───────────────────────────────────────────
const tierConfig: Record<string, { color: string; label: string }> = {
    DIAMOND: { color: "var(--tier-grandmaster)", label: "Grandmaster" },
    GOLD: { color: "var(--tier-master)", label: "Master" },
    SILVER: { color: "var(--tier-journeyman)", label: "Journeyman" },
    BRONZE: { color: "var(--tier-apprentice)", label: "Apprentice" },
};

function RankIcon({ rank }: { rank: number }) {
    if (rank === 1)
        return <Crown className="size-5" style={{ color: "var(--tier-master)" }} />;
    if (rank === 2)
        return <Medal className="size-5" style={{ color: "#C0C0C0" }} />;
    if (rank === 3)
        return <Medal className="size-5" style={{ color: "#CD7F32" }} />;
    return (
        <span className="text-xs font-bold w-5 text-center font-mono text-slate-400">
            {rank}
        </span>
    );
}

function LeaderboardContent() {
    const { competition } = useCompetition();
    const { leaderboardUpdate } = useSocket(competition?.id || null);

    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = useCallback(async () => {
        if (!competition?.id) return;
        setLoading(true);
        const res = await getLeaderboard(competition.id);
        if (res.success && res.data) {
            setEntries(res.data);
        }
        setLoading(false);
    }, [competition?.id]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    // Refresh on leaderboard updates
    useEffect(() => {
        if (leaderboardUpdate) {
            fetchLeaderboard();
        }
    }, [leaderboardUpdate, fetchLeaderboard]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Trophy className="size-6 text-[var(--ctf-green)] shrink-0" />
                    <div>
                        <h1
                            className="text-2xl font-bold tracking-tight text-white"
                            style={{ fontFamily: "var(--font-heading)" }}
                        >
                            Leaderboard
                        </h1>
                        <p className="text-xs mt-0.5 text-slate-400 font-mono">
                            {entries.length} participant{entries.length !== 1 ? "s" : ""} ranked
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchLeaderboard}
                    className="text-[var(--muted-foreground)] hover:text-[var(--ctf-green)] shrink-0"
                >
                    <RefreshCw className="size-4 mr-1" />
                    <span className="hidden min-[360px]:inline">Refresh</span>
                </Button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 rounded-lg" />
                    ))}
                </div>
            ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Award className="size-10 text-slate-600" />
                    <p className="text-sm text-slate-400 font-mono">
                        No scores yet. Be the first to capture a flag!
                    </p>
                </div>
            ) : (
                <div
                    className="rounded-xl border overflow-hidden"
                    style={{
                        backgroundColor: "var(--ctf-card)",
                        borderColor: "var(--ctf-border)",
                    }}
                >
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-[var(--ctf-border)] hover:bg-transparent">
                                <TableHead className="w-16 text-center">Rank</TableHead>
                                <TableHead>Player</TableHead>
                                <TableHead className="text-right">Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((entry, i) => {
                                const tier = tierConfig[entry.tier] || tierConfig.BRONZE;
                                const isTop3 = entry.rank <= 3;

                                return (
                                    <motion.tr
                                        key={entry.participantId}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className={cn(
                                            "border-b border-[var(--ctf-border)] transition-colors hover:bg-white/[0.02]",
                                            isTop3 && "bg-[var(--ctf-green-subtle)]"
                                        )}
                                    >
                                        <TableCell className="text-center">
                                            <RankIcon rank={entry.rank} />
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className="font-semibold text-sm"
                                                style={{ color: tier.color }}
                                            >
                                                {entry.name}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span
                                                className="font-bold text-sm"
                                                style={{
                                                    fontFamily: "var(--font-mono)",
                                                    color: isTop3 ? "var(--ctf-green)" : "var(--foreground)",
                                                }}
                                            >
                                                {entry.score.toLocaleString()}
                                            </span>
                                        </TableCell>
                                    </motion.tr>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

export default function LeaderboardPage() {
    return (
        <AppShell>
            <LeaderboardContent />
        </AppShell>
    );
}
