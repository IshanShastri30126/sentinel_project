// Created: 2026-08-11 | Modified: Initial creation — Competition context provider

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Competition, getActiveCompetition } from "@/lib/api";

interface CompetitionContextType {
    competition: Competition | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const CompetitionContext = createContext<CompetitionContextType>({
    competition: null,
    loading: true,
    error: null,
    refetch: async () => { },
});

export function CompetitionProvider({ children }: { children: ReactNode }) {
    const [competition, setCompetition] = useState<Competition | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCompetition = async () => {
        setLoading(true);
        setError(null);
        const res = await getActiveCompetition();
        if (res.success && res.data) {
            setCompetition(res.data);
        } else {
            setError(res.message || "No active competition found");
            setCompetition(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCompetition();
    }, []);

    return (
        <CompetitionContext.Provider
            value={{ competition, loading, error, refetch: fetchCompetition }}
        >
            {children}
        </CompetitionContext.Provider>
    );
}

export function useCompetition() {
    return useContext(CompetitionContext);
}
