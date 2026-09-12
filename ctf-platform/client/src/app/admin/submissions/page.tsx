// Created: 2026-08-12 | Modified: Initial creation — Submission logs viewer

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useCompetition } from "@/hooks/useCompetition";
import { getSubmissionLogs, SubmissionLog } from "@/lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function SubmissionsContent() {
    const { competition } = useCompetition();
    const [logs, setLogs] = useState<SubmissionLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        const res = await getSubmissionLogs(competition?.id);
        if (res.success && res.data) setLogs(res.data);
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, [competition?.id]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileText className="size-6 text-[var(--ctf-green)]" />
                    <div>
                        <h1
                            className="text-2xl font-bold tracking-tight"
                            style={{ fontFamily: "var(--font-heading)" }}
                        >
                            Submission Logs
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: "#666" }}>
                            {logs.length} submission{logs.length !== 1 ? "s" : ""} recorded
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchLogs}
                    className="text-[var(--muted-foreground)] hover:text-[var(--ctf-green)]"
                >
                    <RefreshCw className="size-4 mr-1" />
                    Refresh
                </Button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 rounded-lg" />
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <FileText className="size-10" style={{ color: "#333" }} />
                    <p className="text-sm" style={{ color: "#666" }}>
                        No submissions yet.
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
                                <TableHead>Result</TableHead>
                                <TableHead>Player</TableHead>
                                <TableHead>Challenge</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Points</TableHead>
                                <TableHead className="text-right">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log, i) => (
                                <motion.tr
                                    key={log.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    className="border-b border-[var(--ctf-border)] hover:bg-white/[0.02]"
                                >
                                    <TableCell>
                                        {log.result === "CORRECT" ? (
                                            <CheckCircle className="size-4 text-[var(--ctf-green)]" />
                                        ) : (
                                            <XCircle className="size-4 text-[var(--ctf-orange)]" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">
                                        {log.playerName}
                                    </TableCell>
                                    <TableCell className="text-sm">{log.challengeTitle}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] uppercase tracking-wider"
                                        >
                                            {log.challengeCategory}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {log.pointsAwarded ? (
                                            <span
                                                className="text-sm font-bold text-[var(--ctf-green)]"
                                                style={{ fontFamily: "var(--font-mono)" }}
                                            >
                                                +{log.pointsAwarded}
                                            </span>
                                        ) : (
                                            <span className="text-xs" style={{ color: "#555" }}>
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right text-xs" style={{ color: "#666" }}>
                                        {new Date(log.submittedAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                        })}
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

export default function SubmissionsPage() {
    return (
        <AppShell>
            <SubmissionsContent />
        </AppShell>
    );
}
