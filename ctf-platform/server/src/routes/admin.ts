// Created: 2026-08-12 | Modified: Initial creation — Admin-only routes for CTF management

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { roleGuard } from "../middlewares/roleGuard";
import db from "../lib/db";

const router = Router();

// All routes require FACULTY_COORDINATOR or DEVELOPMENT_TEAM
const adminGuard = roleGuard(["FACULTY_COORDINATOR", "DEVELOPMENT_TEAM"]);

// ─── GET /api/admin/stats ───────────────────────────────────
// Returns aggregate statistics for the admin dashboard.
// ─────────────────────────────────────────────────────────────

router.get(
    "/stats",
    authMiddleware,
    adminGuard,
    async (_req: Request, res: Response): Promise<void> => {
        try {
            const [
                competitionCount,
                challengeCount,
                participantCount,
                submissionCount,
                correctCount,
            ] = await Promise.all([
                db.ctfCompetition.count(),
                db.ctfChallenge.count(),
                db.ctfParticipant.count(),
                db.ctfSubmission.count(),
                db.ctfSubmission.count({ where: { result: "CORRECT" } }),
            ]);

            res.json({
                success: true,
                data: {
                    competitions: competitionCount,
                    challenges: challengeCount,
                    participants: participantCount,
                    totalSubmissions: submissionCount,
                    correctSubmissions: correctCount,
                    successRate:
                        submissionCount > 0
                            ? Math.round((correctCount / submissionCount) * 100)
                            : 0,
                },
            });
        } catch (error) {
            console.error("[Admin] Error fetching stats:", error);
            res.status(500).json({ success: false, message: "Failed to fetch stats." });
        }
    }
);

// ─── GET /api/admin/competitions ────────────────────────────
// Returns ALL competitions (not just active). For admin management.
// ─────────────────────────────────────────────────────────────

router.get(
    "/competitions",
    authMiddleware,
    adminGuard,
    async (_req: Request, res: Response): Promise<void> => {
        try {
            const competitions = await db.ctfCompetition.findMany({
                orderBy: { createdAt: "desc" },
                include: {
                    _count: {
                        select: { challenges: true, participants: true },
                    },
                },
            });

            res.json({ success: true, data: competitions });
        } catch (error) {
            console.error("[Admin] Error fetching competitions:", error);
            res
                .status(500)
                .json({ success: false, message: "Failed to fetch competitions." });
        }
    }
);

// ─── POST /api/admin/competitions ───────────────────────────
// Create a new competition.
// ─────────────────────────────────────────────────────────────

router.post(
    "/competitions",
    authMiddleware,
    adminGuard,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { title, description, rules, inviteCode, startTime, endTime, state } =
                req.body;

            if (!title) {
                res
                    .status(400)
                    .json({ success: false, message: "Title is required." });
                return;
            }

            const competition = await db.ctfCompetition.create({
                data: {
                    title,
                    description: description || null,
                    rules: rules || null,
                    inviteCode: inviteCode || null,
                    startTime: startTime ? new Date(startTime) : null,
                    endTime: endTime ? new Date(endTime) : null,
                    state: state || "DRAFT",
                },
            });

            res.status(201).json({ success: true, data: competition });
        } catch (error) {
            console.error("[Admin] Error creating competition:", error);
            res
                .status(500)
                .json({ success: false, message: "Failed to create competition." });
        }
    }
);

// ─── PATCH /api/admin/competitions/:id ──────────────────────
// Update competition (state transitions, title, description).
// ─────────────────────────────────────────────────────────────

router.patch(
    "/competitions/:id",
    authMiddleware,
    adminGuard,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { title, description, rules, inviteCode, state, startTime, endTime } =
                req.body;

            const competition = await db.ctfCompetition.update({
                where: { id },
                data: {
                    ...(title !== undefined && { title }),
                    ...(description !== undefined && { description }),
                    ...(rules !== undefined && { rules }),
                    ...(inviteCode !== undefined && { inviteCode }),
                    ...(state !== undefined && { state }),
                    ...(startTime !== undefined && {
                        startTime: startTime ? new Date(startTime) : null,
                    }),
                    ...(endTime !== undefined && {
                        endTime: endTime ? new Date(endTime) : null,
                    }),
                },
            });

            res.json({ success: true, data: competition });
        } catch (error) {
            console.error("[Admin] Error updating competition:", error);
            res
                .status(500)
                .json({ success: false, message: "Failed to update competition." });
        }
    }
);

// ─── POST /api/admin/challenges ─────────────────────────────
// Create a new challenge for a competition.
// ─────────────────────────────────────────────────────────────

router.post(
    "/challenges",
    authMiddleware,
    adminGuard,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const {
                competitionId,
                title,
                description,
                category,
                difficulty,
                flagHash,
                initialPoints,
                minimumPoints,
                decayCount,
            } = req.body;

            if (!competitionId || !title || !flagHash) {
                res.status(400).json({
                    success: false,
                    message: "competitionId, title, and flagHash are required.",
                });
                return;
            }

            const challenge = await db.ctfChallenge.create({
                data: {
                    competitionId,
                    title,
                    description: description || null,
                    category: category || "MISC",
                    difficulty: difficulty || "MEDIUM",
                    flagHash,
                    initialPoints: initialPoints || 500,
                    minimumPoints: minimumPoints || 100,
                    decayCount: decayCount || 20,
                    currentPoints: initialPoints || 500,
                },
            });

            res.status(201).json({ success: true, data: challenge });
        } catch (error) {
            console.error("[Admin] Error creating challenge:", error);
            res
                .status(500)
                .json({ success: false, message: "Failed to create challenge." });
        }
    }
);

// ─── GET /api/admin/submissions ─────────────────────────────
// Returns all submissions with participant and challenge info.
// Used for the admin submission logs viewer.
// ─────────────────────────────────────────────────────────────

router.get(
    "/submissions",
    authMiddleware,
    adminGuard,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { competitionId, limit = "100" } = req.query;

            const where: Record<string, unknown> = {};
            if (competitionId && typeof competitionId === "string") {
                where.challenge = { competitionId };
            }

            const submissions = await db.ctfSubmission.findMany({
                where,
                take: parseInt(limit as string, 10),
                orderBy: { submittedAt: "desc" },
                select: {
                    id: true,
                    result: true,
                    pointsAwarded: true,
                    submittedAt: true,
                    participant: {
                        select: {
                            user: { select: { name: true, email: true } },
                        },
                    },
                    challenge: {
                        select: { title: true, category: true },
                    },
                },
            });

            const formatted = submissions.map((s) => ({
                id: s.id,
                result: s.result,
                pointsAwarded: s.pointsAwarded,
                submittedAt: s.submittedAt,
                playerName: s.participant.user.name || s.participant.user.email,
                challengeTitle: s.challenge.title,
                challengeCategory: s.challenge.category,
            }));

            res.json({ success: true, data: formatted });
        } catch (error) {
            console.error("[Admin] Error fetching submissions:", error);
            res
                .status(500)
                .json({ success: false, message: "Failed to fetch submissions." });
        }
    }
);

// ─── GET /api/admin/heatmap ─────────────────────────────────
// Returns the activity heatmap data for the Progression Matrix.
// Rows = Participants, Columns = Challenges,
// Cells = OPENED | ATTEMPTED | SOLVED
// ─────────────────────────────────────────────────────────────

router.get(
    "/heatmap",
    authMiddleware,
    adminGuard,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { competitionId } = req.query;

            if (!competitionId || typeof competitionId !== "string") {
                res.status(400).json({
                    success: false,
                    message: "competitionId query parameter is required.",
                });
                return;
            }

            // Get all challenges for this competition
            const challenges = await db.ctfChallenge.findMany({
                where: { competitionId },
                select: { id: true, title: true, category: true },
                orderBy: { category: "asc" },
            });

            // Get all participants
            const participants = await db.ctfParticipant.findMany({
                where: { competitionId },
                select: {
                    id: true,
                    user: { select: { name: true } },
                    totalScore: true,
                },
                orderBy: { totalScore: "desc" },
            });

            // Get all activity records
            const activities = await db.ctfChallengeActivity.findMany({
                where: {
                    participant: { competitionId },
                },
                select: {
                    participantId: true,
                    challengeId: true,
                    status: true,
                },
            });

            // Build a lookup map: participantId:challengeId → status
            const activityMap = new Map<string, string>();
            for (const a of activities) {
                activityMap.set(`${a.participantId}:${a.challengeId}`, a.status);
            }

            res.json({
                success: true,
                data: {
                    challenges: challenges.map((c) => ({
                        id: c.id,
                        title: c.title,
                        category: c.category,
                    })),
                    participants: participants.map((p) => ({
                        id: p.id,
                        name: p.user.name || "Anonymous",
                        score: p.totalScore,
                    })),
                    matrix: Object.fromEntries(activityMap),
                },
            });
        } catch (error) {
            console.error("[Admin] Error fetching heatmap:", error);
            res
                .status(500)
                .json({ success: false, message: "Failed to fetch heatmap data." });
        }
    }
);

export default router;
