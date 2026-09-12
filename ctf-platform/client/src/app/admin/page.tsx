// Created: 2026-08-12 | Modified: Initial creation — Admin dashboard with stats, competitions, and challenges

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    ShieldCheck,
    Trophy,
    Swords,
    Users,
    Send,
    Target,
    Plus,
    Play,
    Pause,
    Square,
    DoorOpen,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
    AdminStats,
    Competition,
    getAdminStats,
    getAdminCompetitions,
    createCompetition,
    updateCompetition,
    createChallenge,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// ─── State Colors ───────────────────────────────────────────
const stateActions: Record<
    string,
    { next: string; icon: React.ReactNode; label: string; color: string }
> = {
    DRAFT: { next: "OPEN", icon: <DoorOpen className="size-3.5" />, label: "Open Registration", color: "var(--ctf-green)" },
    OPEN: { next: "ACTIVE", icon: <Play className="size-3.5" />, label: "Start Competition", color: "var(--ctf-green)" },
    ACTIVE: { next: "PAUSED", icon: <Pause className="size-3.5" />, label: "Pause", color: "var(--ctf-amber)" },
    PAUSED: { next: "ACTIVE", icon: <Play className="size-3.5" />, label: "Resume", color: "var(--ctf-green)" },
};

function StatCard({
    title,
    value,
    icon,
    index,
}: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    index: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
        >
            <Card
                style={{
                    backgroundColor: "var(--ctf-card)",
                    borderColor: "var(--ctf-border)",
                }}
            >
                <CardHeader className="pb-2">
                    <CardTitle
                        className="flex items-center gap-2 text-sm font-medium"
                        style={{ color: "#888" }}
                    >
                        {icon}
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <span
                        className="text-3xl font-bold"
                        style={{ fontFamily: "var(--font-mono)" }}
                    >
                        {value}
                    </span>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function AdminContent() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);

    // New Competition Form
    const [showNewComp, setShowNewComp] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newInviteCode, setNewInviteCode] = useState("");
    const [creating, setCreating] = useState(false);

    // New Challenge Form
    const [showNewChallenge, setShowNewChallenge] = useState(false);
    const [chalCompId, setChalCompId] = useState("");
    const [chalTitle, setChalTitle] = useState("");
    const [chalFlag, setChalFlag] = useState("");
    const [chalCategory, setChalCategory] = useState("WEB");
    const [chalDifficulty, setChalDifficulty] = useState("MEDIUM");
    const [chalPoints, setChalPoints] = useState("500");
    const [creatingChal, setCreatingChal] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const [statsRes, compsRes] = await Promise.all([
            getAdminStats(),
            getAdminCompetitions(),
        ]);
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (compsRes.success && compsRes.data) setCompetitions(compsRes.data);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateCompetition = async () => {
        if (!newTitle.trim()) return;
        setCreating(true);
        await createCompetition({
            title: newTitle,
            inviteCode: newInviteCode || undefined,
            state: "DRAFT",
        });
        setNewTitle("");
        setNewInviteCode("");
        setShowNewComp(false);
        setCreating(false);
        fetchData();
    };

    const handleStateTransition = async (compId: string, newState: string) => {
        await updateCompetition(compId, { state: newState as Competition["state"] });
        fetchData();
    };

    const handleCreateChallenge = async () => {
        if (!chalCompId || !chalTitle.trim() || !chalFlag.trim()) return;
        setCreatingChal(true);
        await createChallenge({
            competitionId: chalCompId,
            title: chalTitle,
            flagHash: chalFlag,
            category: chalCategory,
            difficulty: chalDifficulty,
            initialPoints: parseInt(chalPoints, 10) || 500,
        });
        setChalTitle("");
        setChalFlag("");
        setShowNewChallenge(false);
        setCreatingChal(false);
        fetchData();
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex items-center gap-3">
                <ShieldCheck className="size-6 text-[var(--ctf-green)]" />
                <div>
                    <h1
                        className="text-2xl font-bold tracking-tight"
                        style={{ fontFamily: "var(--font-heading)" }}
                    >
                        Admin Dashboard
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: "#666" }}>
                        Manage competitions, challenges, and monitor activity
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    <StatCard
                        title="Competitions"
                        value={stats.competitions}
                        icon={<Trophy className="size-4 text-[var(--ctf-green)]" />}
                        index={0}
                    />
                    <StatCard
                        title="Challenges"
                        value={stats.challenges}
                        icon={<Swords className="size-4 text-[var(--ctf-amber)]" />}
                        index={1}
                    />
                    <StatCard
                        title="Participants"
                        value={stats.participants}
                        icon={<Users className="size-4 text-[var(--tier-journeyman)]" />}
                        index={2}
                    />
                    <StatCard
                        title="Submissions"
                        value={stats.totalSubmissions}
                        icon={<Send className="size-4 text-[var(--tier-grandmaster)]" />}
                        index={3}
                    />
                    <StatCard
                        title="Correct"
                        value={stats.correctSubmissions}
                        icon={<Target className="size-4 text-[var(--ctf-green)]" />}
                        index={4}
                    />
                    <StatCard
                        title="Success Rate"
                        value={`${stats.successRate}%`}
                        icon={<Target className="size-4 text-[var(--ctf-amber)]" />}
                        index={5}
                    />
                </div>
            )}

            <Separator style={{ backgroundColor: "var(--ctf-border)" }} />

            {/* Competitions Management */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2
                        className="text-lg font-bold"
                        style={{ fontFamily: "var(--font-heading)" }}
                    >
                        Competitions
                    </h2>
                    <Button
                        onClick={() => setShowNewComp(!showNewComp)}
                        size="sm"
                        className="bg-[var(--ctf-green)] text-black hover:bg-[var(--ctf-green)]/90"
                    >
                        <Plus className="size-4 mr-1" />
                        New Competition
                    </Button>
                </div>

                {/* Create Competition Form */}
                {showNewComp && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="overflow-hidden"
                    >
                        <Card
                            style={{
                                backgroundColor: "var(--ctf-card)",
                                borderColor: "var(--ctf-green)",
                            }}
                        >
                            <CardContent className="pt-4 space-y-3">
                                <Input
                                    placeholder="Competition Title"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="bg-transparent border-[var(--ctf-border)]"
                                />
                                <Input
                                    placeholder="Invite Code (optional)"
                                    value={newInviteCode}
                                    onChange={(e) => setNewInviteCode(e.target.value)}
                                    className="bg-transparent border-[var(--ctf-border)]"
                                    style={{ fontFamily: "var(--font-mono)" }}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleCreateCompetition}
                                        disabled={creating || !newTitle.trim()}
                                        size="sm"
                                        className="bg-[var(--ctf-green)] text-black"
                                    >
                                        {creating ? "Creating..." : "Create"}
                                    </Button>
                                    <Button
                                        onClick={() => setShowNewComp(false)}
                                        variant="ghost"
                                        size="sm"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Competition List */}
                <div className="space-y-3">
                    {competitions.map((comp, i) => {
                        const action = stateActions[comp.state];
                        return (
                            <motion.div
                                key={comp.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card
                                    style={{
                                        backgroundColor: "var(--ctf-card)",
                                        borderColor: "var(--ctf-border)",
                                    }}
                                >
                                    <CardContent className="flex items-center justify-between py-4">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="font-semibold text-sm">{comp.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        className={`text-[10px] ${comp.state === "ACTIVE"
                                                                ? "bg-[var(--ctf-green-subtle)] text-[var(--ctf-green)]"
                                                                : "bg-zinc-800 text-zinc-400"
                                                            }`}
                                                    >
                                                        {comp.state === "ACTIVE" && (
                                                            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--ctf-green)] pulse-live" />
                                                        )}
                                                        {comp.state}
                                                    </Badge>
                                                    {comp.inviteCode && (
                                                        <span
                                                            className="text-[10px]"
                                                            style={{
                                                                fontFamily: "var(--font-mono)",
                                                                color: "#555",
                                                            }}
                                                        >
                                                            Code: {comp.inviteCode}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {action && (
                                                <Button
                                                    onClick={() =>
                                                        handleStateTransition(comp.id, action.next)
                                                    }
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs"
                                                    style={{
                                                        borderColor: action.color,
                                                        color: action.color,
                                                    }}
                                                >
                                                    {action.icon}
                                                    <span className="ml-1">{action.label}</span>
                                                </Button>
                                            )}
                                            {(comp.state === "ACTIVE" || comp.state === "PAUSED") && (
                                                <Button
                                                    onClick={() =>
                                                        handleStateTransition(comp.id, "ENDED")
                                                    }
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs"
                                                    style={{
                                                        borderColor: "var(--ctf-orange)",
                                                        color: "var(--ctf-orange)",
                                                    }}
                                                >
                                                    <Square className="size-3.5" />
                                                    <span className="ml-1">End</span>
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <Separator style={{ backgroundColor: "var(--ctf-border)" }} />

            {/* Quick Add Challenge */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2
                        className="text-lg font-bold"
                        style={{ fontFamily: "var(--font-heading)" }}
                    >
                        Quick Add Challenge
                    </h2>
                    <Button
                        onClick={() => setShowNewChallenge(!showNewChallenge)}
                        size="sm"
                        className="bg-[var(--ctf-green)] text-black hover:bg-[var(--ctf-green)]/90"
                    >
                        <Plus className="size-4 mr-1" />
                        New Challenge
                    </Button>
                </div>

                {showNewChallenge && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="overflow-hidden"
                    >
                        <Card
                            style={{
                                backgroundColor: "var(--ctf-card)",
                                borderColor: "var(--ctf-green)",
                            }}
                        >
                            <CardContent className="pt-4 space-y-3">
                                <select
                                    value={chalCompId}
                                    onChange={(e) => setChalCompId(e.target.value)}
                                    className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
                                    style={{ borderColor: "var(--ctf-border)", color: "var(--foreground)" }}
                                >
                                    <option value="" style={{ backgroundColor: "#111" }}>
                                        Select Competition...
                                    </option>
                                    {competitions.map((c) => (
                                        <option key={c.id} value={c.id} style={{ backgroundColor: "#111" }}>
                                            {c.title}
                                        </option>
                                    ))}
                                </select>
                                <Input
                                    placeholder="Challenge Title"
                                    value={chalTitle}
                                    onChange={(e) => setChalTitle(e.target.value)}
                                    className="bg-transparent border-[var(--ctf-border)]"
                                />
                                <Input
                                    placeholder="Flag (plaintext — will be hashed)"
                                    value={chalFlag}
                                    onChange={(e) => setChalFlag(e.target.value)}
                                    className="bg-transparent border-[var(--ctf-border)]"
                                    style={{ fontFamily: "var(--font-mono)" }}
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        value={chalCategory}
                                        onChange={(e) => setChalCategory(e.target.value)}
                                        className="rounded-lg border px-3 py-2 text-sm bg-transparent"
                                        style={{ borderColor: "var(--ctf-border)", color: "var(--foreground)" }}
                                    >
                                        {["WEB", "CRYPTO", "REVERSING", "FORENSICS", "OSINT", "STEGO", "MISC"].map(
                                            (c) => (
                                                <option key={c} value={c} style={{ backgroundColor: "#111" }}>
                                                    {c}
                                                </option>
                                            )
                                        )}
                                    </select>
                                    <select
                                        value={chalDifficulty}
                                        onChange={(e) => setChalDifficulty(e.target.value)}
                                        className="rounded-lg border px-3 py-2 text-sm bg-transparent"
                                        style={{ borderColor: "var(--ctf-border)", color: "var(--foreground)" }}
                                    >
                                        {["EASY", "MEDIUM", "HARD", "INSANE"].map((d) => (
                                            <option key={d} value={d} style={{ backgroundColor: "#111" }}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                    <Input
                                        placeholder="Points"
                                        value={chalPoints}
                                        onChange={(e) => setChalPoints(e.target.value)}
                                        className="bg-transparent border-[var(--ctf-border)]"
                                        type="number"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleCreateChallenge}
                                        disabled={creatingChal || !chalTitle.trim() || !chalFlag.trim() || !chalCompId}
                                        size="sm"
                                        className="bg-[var(--ctf-green)] text-black"
                                    >
                                        {creatingChal ? "Creating..." : "Create Challenge"}
                                    </Button>
                                    <Button
                                        onClick={() => setShowNewChallenge(false)}
                                        variant="ghost"
                                        size="sm"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

export default function AdminPage() {
    return (
        <AppShell>
            <AdminContent />
        </AppShell>
    );
}
