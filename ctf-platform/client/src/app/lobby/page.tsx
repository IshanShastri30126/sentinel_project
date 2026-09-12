// Created: 2026-08-11 | Modified: Initial creation — CTF Lobby page

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Clock, Users, ArrowRight, KeyRound, Swords } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useCompetition } from "@/hooks/useCompetition";
import { joinCompetition } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Countdown Timer Hook ───────────────────────────────────
function useCountdown(targetDate: string | null) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        if (!targetDate) return;

        const update = () => {
            const diff = new Date(targetDate).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / (1000 * 60)) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            });
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return timeLeft;
}

// ─── Countdown Display ──────────────────────────────────────
function CountdownUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <div
                className="flex h-16 w-16 items-center justify-center rounded-lg border text-2xl font-bold"
                style={{
                    backgroundColor: "var(--ctf-card)",
                    borderColor: "var(--ctf-border)",
                    fontFamily: "var(--font-mono)",
                    color: "var(--ctf-green)",
                }}
            >
                {String(value).padStart(2, "0")}
            </div>
            <span className="text-xs uppercase tracking-wider" style={{ color: "#666" }}>
                {label}
            </span>
        </div>
    );
}

// ─── State Badge ────────────────────────────────────────────
function StateBadge({ state }: { state: string }) {
    const colors: Record<string, string> = {
        DRAFT: "bg-zinc-800 text-zinc-400",
        OPEN: "bg-[var(--ctf-green-subtle)] text-[var(--ctf-green)]",
        ACTIVE: "bg-[var(--ctf-green-subtle)] text-[var(--ctf-green)]",
        PAUSED: "bg-amber-500/10 text-amber-400",
        ENDED: "bg-zinc-800 text-zinc-400",
    };

    return (
        <Badge className={colors[state] || colors.DRAFT}>
            {state === "ACTIVE" && <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--ctf-green)] pulse-live" />}
            {state}
        </Badge>
    );
}

// ─── Main Lobby Content ─────────────────────────────────────
function LobbyContent() {
    const { competition, loading, error } = useCompetition();
    const router = useRouter();
    const searchParams = useSearchParams();
    const codeParam = searchParams ? searchParams.get("code") || "" : "";
    const [inviteCode, setInviteCode] = useState(codeParam);
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        if (codeParam) {
            setInviteCode(codeParam);
        }
    }, [codeParam]);

    const countdown = useCountdown(competition?.startTime || null);

    const handleJoin = async () => {
        if (!competition) return;
        setJoining(true);
        setJoinError(null);

        const res = await joinCompetition(competition.id);
        if (res.success) {
            setJoined(true);
        } else {
            setJoinError(res.message || "Failed to join");
        }
        setJoining(false);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-4 w-96" />
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            </div>
        );
    }

    if (error || !competition) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center space-y-4">
                    <Shield className="mx-auto size-12" style={{ color: "#333" }} />
                    <h2
                        className="text-xl font-bold"
                        style={{ fontFamily: "var(--font-heading)" }}
                    >
                        No Active Competition
                    </h2>
                    <p className="text-sm" style={{ color: "#666" }}>
                        There are no competitions available right now. Check back later.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <StateBadge state={competition.state} />
                </div>
                <h1
                    className="text-3xl font-bold tracking-tight"
                    style={{ fontFamily: "var(--font-heading)" }}
                >
                    {competition.title}
                </h1>
                {competition.description && (
                    <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "#999" }}>
                        {competition.description}
                    </p>
                )}
            </div>

            {/* Countdown Timer (if OPEN and has startTime) */}
            {competition.state === "OPEN" && competition.startTime && (
                <Card
                    className="border glow-green"
                    style={{
                        backgroundColor: "var(--ctf-card)",
                        borderColor: "var(--ctf-border)",
                    }}
                >
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="size-4 text-[var(--ctf-green)]" />
                            Competition Starts In
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <CountdownUnit value={countdown.days} label="Days" />
                            <CountdownUnit value={countdown.hours} label="Hours" />
                            <CountdownUnit value={countdown.minutes} label="Min" />
                            <CountdownUnit value={countdown.seconds} label="Sec" />
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Rules Card */}
                {competition.rules && (
                    <Card
                        style={{
                            backgroundColor: "var(--ctf-card)",
                            borderColor: "var(--ctf-border)",
                        }}
                    >
                        <CardHeader>
                            <CardTitle>Rules & Directives</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p
                                className="text-sm leading-relaxed whitespace-pre-wrap"
                                style={{ color: "#999" }}
                            >
                                {competition.rules}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Join Card */}
                <Card
                    style={{
                        backgroundColor: "var(--ctf-card)",
                        borderColor: "var(--ctf-border)",
                    }}
                >
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="size-4 text-[var(--ctf-green)]" />
                            Join Competition
                        </CardTitle>
                        <CardDescription>
                            Enter the invite code to register as a participant
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {joined ? (
                            <div className="space-y-4">
                                <p className="text-sm font-medium text-[var(--ctf-green)]">
                                    [CONFIRMED] You have joined this competition.
                                </p>
                                {competition.state === "ACTIVE" && (
                                    <Button
                                        onClick={() => router.push("/challenges")}
                                        className="w-full bg-[var(--ctf-green)] text-black hover:bg-[var(--ctf-green)]/90"
                                    >
                                        Enter Challenge Board
                                        <ArrowRight className="ml-2 size-4" />
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <>
                                <Input
                                    placeholder="Enter invite code..."
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    className="bg-transparent border-[var(--ctf-border)]"
                                    style={{ fontFamily: "var(--font-mono)" }}
                                />
                                {joinError && (
                                    <p className="text-xs" style={{ color: "var(--ctf-orange)" }}>
                                        {joinError}
                                    </p>
                                )}
                                <Button
                                    onClick={handleJoin}
                                    disabled={joining}
                                    className="w-full bg-[var(--ctf-green)] text-black hover:bg-[var(--ctf-green)]/90 font-semibold"
                                >
                                    {joining ? "Joining..." : "Join Now"}
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Enter button for ACTIVE competitions */}
            {competition.state === "ACTIVE" && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <Button
                        onClick={() => router.push("/challenges")}
                        size="lg"
                        className="bg-[var(--ctf-green)] text-black hover:bg-[var(--ctf-green)]/90 font-bold text-base glow-green"
                    >
                        <Swords className="mr-2 size-5" />
                        Enter Challenge Board
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}

export default function LobbyPage() {
    return (
        <AppShell>
            <Suspense fallback={<div className="p-8 text-xs font-mono text-zinc-500">INITIALIZING LOBBY INTERFACE...</div>}>
                <LobbyContent />
            </Suspense>
        </AppShell>
    );
}
