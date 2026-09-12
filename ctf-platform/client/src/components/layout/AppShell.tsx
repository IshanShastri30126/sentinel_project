// Created: 2026-08-11 | Modified: Initial creation — App shell with sidebar + socket integration

"use client";

import { ReactNode } from "react";
import { CompetitionProvider, useCompetition } from "@/hooks/useCompetition";
import { useSocket } from "@/hooks/useSocket";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminFreezeOverlay } from "@/components/layout/AdminFreezeOverlay";
import { LiveSolveToast } from "@/components/layout/LiveSolveToast";

function AppShellInner({ children }: { children: ReactNode }) {
    const { competition } = useCompetition();
    const {
        isConnected,
        liveSolve,
        adminFreeze,
        clearAdminFreeze,
    } = useSocket(competition?.id || null);

    return (
        <>
            <Sidebar isConnected={isConnected} />

            {/* Main content area with sidebar offset */}
            <main className="ml-14 min-h-screen">
                <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
            </main>

            {/* Global overlays */}
            <AdminFreezeOverlay
                freezeEvent={adminFreeze}
                onComplete={clearAdminFreeze}
            />
            <LiveSolveToast event={liveSolve} />
        </>
    );
}

export function AppShell({ children }: { children: ReactNode }) {
    return (
        <CompetitionProvider>
            <AppShellInner>{children}</AppShellInner>
        </CompetitionProvider>
    );
}
