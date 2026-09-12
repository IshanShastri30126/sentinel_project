// Created: 2026-08-11 | Modified: Initial creation — Centralized API client with cookie auth

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// ─── Types ──────────────────────────────────────────────────
export interface Competition {
    id: string;
    title: string;
    description: string | null;
    rules: string | null;
    state: "DRAFT" | "OPEN" | "ACTIVE" | "PAUSED" | "ENDED";
    startTime: string | null;
    endTime: string | null;
    inviteCode: string | null;
}

export interface Challenge {
    id: string;
    title: string;
    description: string | null;
    category: "WEB" | "CRYPTO" | "REVERSING" | "FORENSICS" | "OSINT" | "STEGO" | "MISC";
    difficulty: "EASY" | "MEDIUM" | "HARD" | "INSANE";
    initialPoints: number;
    currentPoints: number;
    solveCount: number;
    competitionId: string;
    hints?: Hint[];
    userStatus?: "OPENED" | "ATTEMPTED" | "SOLVED" | null;
}

export interface Hint {
    id: string;
    content?: string;
    pointCost: number;
    orderIndex: number;
    isUnlocked?: boolean;
}

export interface LeaderboardEntry {
    rank: number;
    participantId: string;
    name: string;
    score: number;
    tier: string;
}

export interface MyScoresData {
    rank: number;
    totalScore: number;
    timeline: {
        challengeName: string;
        pointsAwarded: number;
        timestamp: string;
    }[];
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

// ─── Core Fetch Wrapper ─────────────────────────────────────
async function fetchAPI<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            credentials: "include", // Send HttpOnly cookies
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        const data = await res.json();

        if (!res.ok) {
            return {
                success: false,
                message: data.message || `Error ${res.status}`,
            };
        }

        return data;
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Network error",
        };
    }
}

// ─── API Functions ──────────────────────────────────────────

export async function getActiveCompetition() {
    return fetchAPI<Competition>("/competitions/active");
}

export async function joinCompetition(competitionId: string) {
    return fetchAPI<{ participantId: string }>(`/competitions/${competitionId}/join`, {
        method: "POST",
    });
}

export async function getChallenges(competitionId: string) {
    return fetchAPI<Challenge[]>(`/challenges?competitionId=${competitionId}`);
}

export async function getChallenge(challengeId: string) {
    return fetchAPI<Challenge>(`/challenges/${challengeId}`);
}

export async function unlockHint(challengeId: string, hintId: string) {
    return fetchAPI<{
        hintId: string;
        content: string;
        pointCost: number;
        isUnlocked: boolean;
    }>(`/challenges/${challengeId}/hints/${hintId}/unlock`, {
        method: "POST",
    });
}

export async function submitFlag(challengeId: string, flag: string) {
    return fetchAPI<{
        result: "CORRECT" | "INCORRECT";
        pointsAwarded?: number;
        newTotalScore?: number;
    }>("/submissions", {
        method: "POST",
        body: JSON.stringify({ challengeId, flag }),
    });
}

export async function getLeaderboard(competitionId: string, limit = 100) {
    return fetchAPI<LeaderboardEntry[]>(
        `/leaderboard/${competitionId}?limit=${limit}`
    );
}

export async function getMyScores(competitionId: string) {
    return fetchAPI<MyScoresData>(`/my-scores/${competitionId}`);
}

// ─── Admin Types ────────────────────────────────────────────

export interface AdminStats {
    competitions: number;
    challenges: number;
    participants: number;
    totalSubmissions: number;
    correctSubmissions: number;
    successRate: number;
}

export interface SubmissionLog {
    id: string;
    result: "CORRECT" | "INCORRECT";
    pointsAwarded: number | null;
    submittedAt: string;
    playerName: string;
    challengeTitle: string;
    challengeCategory: string;
}

export interface HeatmapData {
    challenges: { id: string; title: string; category: string }[];
    participants: { id: string; name: string; score: number }[];
    matrix: Record<string, string>;
}

// ─── Admin API Functions ────────────────────────────────────

export async function getAdminStats() {
    return fetchAPI<AdminStats>("/admin/stats");
}

export async function getAdminCompetitions() {
    return fetchAPI<Competition[]>("/admin/competitions");
}

export async function createCompetition(data: Partial<Competition>) {
    return fetchAPI<Competition>("/admin/competitions", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateCompetition(id: string, data: Partial<Competition>) {
    return fetchAPI<Competition>(`/admin/competitions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function createChallenge(data: {
    competitionId: string;
    title: string;
    description?: string;
    category?: string;
    difficulty?: string;
    flagHash: string;
    initialPoints?: number;
    minimumPoints?: number;
    decayCount?: number;
}) {
    return fetchAPI<Challenge>("/admin/challenges", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getSubmissionLogs(competitionId?: string) {
    const query = competitionId ? `?competitionId=${competitionId}` : "";
    return fetchAPI<SubmissionLog[]>(`/admin/submissions${query}`);
}

export async function getHeatmapData(competitionId: string) {
    return fetchAPI<HeatmapData>(`/admin/heatmap?competitionId=${competitionId}`);
}
