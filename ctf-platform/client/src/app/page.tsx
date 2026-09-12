// Created: 2026-08-11 | Modified: Initial creation — Root page (redirect to lobby/challenges)

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCompetition } from "@/hooks/useCompetition";
import { AppShell } from "@/components/layout/AppShell";
import { Zap } from "lucide-react";

function HomeContent() {
    const { competition, loading } = useCompetition();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        // Check authentication first
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/auth/me`, {
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) {
                    // Not authenticated → bounce to Chakravyuh via our login endpoint
                    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/auth/login`;
                    return;
                }
                // Authenticated — route based on competition state
                if (competition) {
                    if (competition.state === "ACTIVE") {
                        router.replace("/challenges");
                    } else {
                        router.replace("/lobby");
                    }
                } else {
                    // No competition exists yet — go to lobby anyway
                    router.replace("/lobby");
                }
            })
            .catch(() => {
                // Network error — try login flow
                window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/auth/login`;
            });
    }, [competition, loading, router]);

    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <div className="flex flex-col items-center gap-6 text-center">
                <div className="relative">
                    <Zap
                        className="size-16 text-[var(--ctf-green)]"
                        style={{ filter: "drop-shadow(0 0 20px var(--ctf-green-glow))" }}
                    />
                </div>
                <h1
                    className="text-4xl font-bold tracking-tight glow-green-text"
                    style={{
                        fontFamily: "var(--font-heading)",
                        color: "var(--ctf-green)",
                    }}
                >
                    CTF WARS
                </h1>
                <p className="text-sm" style={{ color: "#666" }}>
                    {loading ? "Connecting to server..." : "Redirecting..."}
                </p>
                {/* Loading pulse */}
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="h-1.5 w-8 rounded-full bg-[var(--ctf-green)]"
                            style={{
                                opacity: 0.3,
                                animation: `pulse-green 1.5s ease-in-out ${i * 0.2}s infinite`,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function Home() {
    return (
        <AppShell>
            <HomeContent />
        </AppShell>
    );
}
