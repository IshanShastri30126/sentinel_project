// Created: 2026-08-11 | Modified: Initial creation — Socket.io hook for /ctf namespace

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";

// ─── Types ──────────────────────────────────────────────────
export interface LeaderboardUpdateEvent {
    competitionId: string;
    participantId: string;
    newScore: number;
}

export interface LiveSolveEvent {
    challengeId: string;
    newSolveCount: number;
    solverName: string;
}

export interface AdminFreezeEvent {
    challengeId: string;
    message: string;
}

export interface PresenceUpdateEvent {
    challengeId: string;
    viewers: number;
}

// ─── Main Hook ──────────────────────────────────────────────
export function useSocket(competitionId: string | null) {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [leaderboardUpdate, setLeaderboardUpdate] =
        useState<LeaderboardUpdateEvent | null>(null);
    const [liveSolve, setLiveSolve] = useState<LiveSolveEvent | null>(null);
    const [adminFreeze, setAdminFreeze] = useState<AdminFreezeEvent | null>(null);
    const [presenceData, setPresenceData] = useState<Record<string, number>>({});

    useEffect(() => {
        // Connect to the /ctf namespace
        const socket = io(`${SOCKET_URL}/ctf`, {
            withCredentials: true,
            transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setIsConnected(true);
            // Auto-join competition room if we have an ID
            if (competitionId) {
                socket.emit("joinCompetition", competitionId);
            }
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
        });

        // ── Event Listeners ───────────────────────────────────
        socket.on("leaderboardUpdate", (data: LeaderboardUpdateEvent) => {
            setLeaderboardUpdate(data);
        });

        socket.on("liveSolve", (data: LiveSolveEvent) => {
            setLiveSolve(data);
        });

        socket.on("adminFreeze", (data: AdminFreezeEvent) => {
            setAdminFreeze(data);
        });

        socket.on("presenceUpdate", (data: PresenceUpdateEvent) => {
            setPresenceData((prev) => ({
                ...prev,
                [data.challengeId]: data.viewers,
            }));
        });

        return () => {
            if (competitionId) {
                socket.emit("leaveCompetition", competitionId);
            }
            socket.disconnect();
        };
    }, [competitionId]);

    // ── Presence Controls ─────────────────────────────────────
    const viewChallenge = useCallback((challengeId: string) => {
        socketRef.current?.emit("viewChallenge", challengeId);
    }, []);

    const leaveChallenge = useCallback((challengeId: string) => {
        socketRef.current?.emit("leaveChallenge", challengeId);
    }, []);

    const clearAdminFreeze = useCallback(() => {
        setAdminFreeze(null);
    }, []);

    return {
        isConnected,
        leaderboardUpdate,
        liveSolve,
        adminFreeze,
        presenceData,
        viewChallenge,
        leaveChallenge,
        clearAdminFreeze,
    };
}
