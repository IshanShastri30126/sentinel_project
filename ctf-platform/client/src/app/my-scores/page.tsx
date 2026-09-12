// Created: 2026-08-11 | Modified: Initial creation — Personal scores dashboard

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Trophy, TrendingUp, Clock, Award } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useCompetition } from "@/hooks/useCompetition";
import { getMyScores, MyScoresData } from "@/lib/api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

function MyScoresContent() {
    const { competition } = useCompetition();
    const [data, setData] = useState<MyScoresData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!competition?.id) return;

        setLoading(true);
        getMyScores(competition.id).then((res) => {
            if (res.success && res.data) {
                setData(res.data);
            }
            setLoading(false);
        });
    }, [competition?.id]);

    // Build cumulative score data for chart
    const chartData = data?.timeline
        ? data.timeline.reduce(
            (acc, item, i) => {
                const prevScore = i > 0 ? acc[i - 1].cumulativeScore : 0;
                acc.push({
                    name: item.challengeName,
                    points: item.pointsAwarded,
                    cumulativeScore: prevScore + item.pointsAwarded,
                    time: new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                });
                return acc;
            },
            [] as { name: string; points: number; cumulativeScore: number; time: string }[]
        )
        : [];

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                </div>
                <Skeleton className="h-64" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <User className="size-12" style={{ color: "#333" }} />
                <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "var(--font-heading)" }}
                >
                    No Data Yet
                </h2>
                <p className="text-sm" style={{ color: "#666" }}>
                    Join a competition and solve challenges to see your stats.
                </p>
            </div>
        );
    }

    // Determine tier from rank
    let tier = "Apprentice";
    let tierColor = "var(--tier-apprentice)";
    if (data.rank === 1) {
        tier = "Grandmaster";
        tierColor = "var(--tier-grandmaster)";
    } else if (data.rank <= 3) {
        tier = "Master";
        tierColor = "var(--tier-master)";
    } else if (data.rank <= 10) {
        tier = "Journeyman";
        tierColor = "var(--tier-journeyman)";
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            {/* Header */}
            <div>
                <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ fontFamily: "var(--font-heading)" }}
                >
                    My Scores
                </h1>
                <p className="text-sm mt-1" style={{ color: "#666" }}>
                    Your personal performance dashboard
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Rank */}
                <Card
                    style={{
                        backgroundColor: "var(--ctf-card)",
                        borderColor: "var(--ctf-border)",
                    }}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium" style={{ color: "#888" }}>
                            <Trophy className="size-4 text-[var(--ctf-green)]" />
                            Current Rank
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span
                            className="text-4xl font-bold"
                            style={{
                                fontFamily: "var(--font-mono)",
                                color: "var(--ctf-green)",
                            }}
                        >
                            #{data.rank}
                        </span>
                    </CardContent>
                </Card>

                {/* Score */}
                <Card
                    style={{
                        backgroundColor: "var(--ctf-card)",
                        borderColor: "var(--ctf-border)",
                    }}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium" style={{ color: "#888" }}>
                            <TrendingUp className="size-4 text-[var(--ctf-green)]" />
                            Total Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span
                            className="text-4xl font-bold"
                            style={{ fontFamily: "var(--font-mono)" }}
                        >
                            {data.totalScore.toLocaleString()}
                        </span>
                    </CardContent>
                </Card>

                {/* Tier */}
                <Card
                    style={{
                        backgroundColor: "var(--ctf-card)",
                        borderColor: "var(--ctf-border)",
                    }}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium" style={{ color: "#888" }}>
                            <Award className="size-4" style={{ color: tierColor }} />
                            Tier
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge
                            className="text-sm font-bold px-3 py-1"
                            style={{
                                backgroundColor: `${tierColor}15`,
                                color: tierColor,
                                border: `1px solid ${tierColor}30`,
                            }}
                        >
                            {tier}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Score Growth Chart */}
            {chartData.length > 0 && (
                <Card
                    style={{
                        backgroundColor: "var(--ctf-card)",
                        borderColor: "var(--ctf-border)",
                    }}
                >
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <TrendingUp className="size-4 text-[var(--ctf-green)]" />
                            Score Growth
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00FF88" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00FF88" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                                <XAxis
                                    dataKey="time"
                                    tick={{ fill: "#666", fontSize: 11 }}
                                    axisLine={{ stroke: "#262626" }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: "#666", fontSize: 11 }}
                                    axisLine={{ stroke: "#262626" }}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#111111",
                                        border: "1px solid #262626",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                    }}
                                    labelStyle={{ color: "#888" }}
                                    itemStyle={{ color: "#00FF88" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="cumulativeScore"
                                    stroke="#00FF88"
                                    strokeWidth={2}
                                    fill="url(#greenGradient)"
                                    name="Score"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Solve Timeline */}
            {data.timeline.length > 0 && (
                <div className="space-y-3">
                    <h3
                        className="text-sm font-medium flex items-center gap-2"
                        style={{ color: "#888" }}
                    >
                        <Clock className="size-4" />
                        Solve Timeline
                    </h3>
                    <div className="space-y-2">
                        {data.timeline.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center justify-between rounded-lg border px-4 py-3"
                                style={{
                                    backgroundColor: "var(--ctf-card)",
                                    borderColor: "var(--ctf-border)",
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: "var(--ctf-green)" }}
                                    />
                                    <span className="text-sm font-medium">{item.challengeName}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span
                                        className="text-sm font-bold"
                                        style={{
                                            fontFamily: "var(--font-mono)",
                                            color: "var(--ctf-green)",
                                        }}
                                    >
                                        +{item.pointsAwarded}
                                    </span>
                                    <span className="text-xs" style={{ color: "#555" }}>
                                        {new Date(item.timestamp).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

export default function MyScoresPage() {
    return (
        <AppShell>
            <MyScoresContent />
        </AppShell>
    );
}
