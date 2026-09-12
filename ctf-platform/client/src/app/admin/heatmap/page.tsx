// Created: 2026-08-12 | Modified: Fixed Tooltip API for @base-ui/react — Progression Matrix Heatmap

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Grid3X3, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useCompetition } from "@/hooks/useCompetition";
import { getHeatmapData, HeatmapData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
    SOLVED: "var(--activity-solved)",
    ATTEMPTED: "var(--activity-attempted)",
    OPENED: "var(--activity-opened)",
};

const statusLabels: Record<string, string> = {
    SOLVED: "Solved",
    ATTEMPTED: "Attempted",
    OPENED: "Opened",
};

function HeatmapContent() {
    const { competition } = useCompetition();
    const [data, setData] = useState<HeatmapData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchHeatmap = async () => {
        if (!competition?.id) return;
        setLoading(true);
        const res = await getHeatmapData(competition.id);
        if (res.success && res.data) setData(res.data);
        setLoading(false);
    };

    useEffect(() => {
        fetchHeatmap();
    }, [competition?.id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96" />
            </div>
        );
    }

    if (!data || data.participants.length === 0) {
        return (
            <div className="space-y-6">
                <Header onRefresh={fetchHeatmap} />
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Grid3X3 className="size-10" style={{ color: "#333" }} />
                    <p className="text-sm" style={{ color: "#666" }}>
                        No activity data available yet.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Header onRefresh={fetchHeatmap} />

            {/* Legend */}
            <div className="flex items-center gap-6">
                {Object.entries(statusLabels).map(([status, label]) => (
                    <div key={status} className="flex items-center gap-2 text-xs">
                        <div
                            className="h-3 w-3 rounded-sm"
                            style={{ backgroundColor: statusColors[status] }}
                        />
                        <span style={{ color: "#888" }}>{label}</span>
                    </div>
                ))}
                <div className="flex items-center gap-2 text-xs">
                    <div
                        className="h-3 w-3 rounded-sm border"
                        style={{ borderColor: "var(--ctf-border)" }}
                    />
                    <span style={{ color: "#888" }}>Not started</span>
                </div>
            </div>

            {/* Matrix */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="overflow-x-auto rounded-xl border"
                style={{
                    backgroundColor: "var(--ctf-card)",
                    borderColor: "var(--ctf-border)",
                }}
            >
                <table className="w-full text-xs">
                    <thead>
                        <tr>
                            <th
                                className="sticky left-0 z-10 px-3 py-2 text-left font-medium"
                                style={{
                                    backgroundColor: "var(--ctf-card)",
                                    color: "#888",
                                    minWidth: 120,
                                }}
                            >
                                Player
                            </th>
                            {data.challenges.map((ch) => (
                                <th
                                    key={ch.id}
                                    className="px-1 py-2 text-center font-medium"
                                    style={{ color: "#888", minWidth: 32 }}
                                    title={`${ch.title} (${ch.category})`}
                                >
                                    <span className="truncate block max-w-8">
                                        {ch.title.slice(0, 3)}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.participants.map((participant, pi) => (
                            <motion.tr
                                key={participant.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: pi * 0.02 }}
                                className="border-t"
                                style={{ borderColor: "var(--ctf-border)" }}
                            >
                                <td
                                    className="sticky left-0 z-10 px-3 py-1.5 font-medium"
                                    style={{ backgroundColor: "var(--ctf-card)" }}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate max-w-24">
                                            {participant.name}
                                        </span>
                                        <span
                                            className="text-[10px] shrink-0"
                                            style={{
                                                fontFamily: "var(--font-mono)",
                                                color: "#555",
                                            }}
                                        >
                                            {participant.score}
                                        </span>
                                    </div>
                                </td>
                                {data.challenges.map((ch) => {
                                    const key = `${participant.id}:${ch.id}`;
                                    const status = data.matrix[key];

                                    return (
                                        <td key={ch.id} className="px-1 py-1.5 text-center">
                                            <div
                                                className="mx-auto h-5 w-5 rounded-sm transition-all hover:scale-125 cursor-help"
                                                title={`${participant.name} → ${ch.title}: ${status ? statusLabels[status] : "Not started"
                                                    }`}
                                                style={{
                                                    backgroundColor: status
                                                        ? statusColors[status]
                                                        : "transparent",
                                                    border: status
                                                        ? "none"
                                                        : "1px solid var(--ctf-border)",
                                                    opacity: status ? 1 : 0.3,
                                                }}
                                            />
                                        </td>
                                    );
                                })}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </div>
    );
}

function Header({ onRefresh }: { onRefresh: () => void }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Grid3X3 className="size-6 text-[var(--ctf-green)]" />
                <div>
                    <h1
                        className="text-2xl font-bold tracking-tight"
                        style={{ fontFamily: "var(--font-heading)" }}
                    >
                        Progression Matrix
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: "#666" }}>
                        Player × Challenge activity heatmap
                    </p>
                </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="text-[var(--muted-foreground)] hover:text-[var(--ctf-green)]"
            >
                <RefreshCw className="size-4 mr-1" />
                Refresh
            </Button>
        </div>
    );
}

export default function HeatmapPage() {
    return (
        <AppShell>
            <HeatmapContent />
        </AppShell>
    );
}
