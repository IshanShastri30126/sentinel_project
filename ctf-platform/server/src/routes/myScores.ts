// Created: 2026-08-07 | Modified: Initial creation — Chunk 6 Personal Stats

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { getUserRankAndScore } from "../lib/leaderboard";
import db from "../lib/db";

const router = Router();

// ─── GET /api/my-scores/:competitionId ───────────────────────
// Returns personal stats (rank, score, timeline) for the user.
// ─────────────────────────────────────────────────────────────
router.get(
  "/:competitionId",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { competitionId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // 1. Get the participant record
      const participant = await db.ctfParticipant.findUnique({
        where: {
          userId_competitionId: { userId, competitionId },
        },
      });

      if (!participant) {
        res.status(404).json({
          success: false,
          message: "You have not joined this competition.",
        });
        return;
      }

      // 2. Fetch specific rank and score from Redis
      const stats = await getUserRankAndScore(competitionId, participant.id);

      // 3. Fetch their solve timeline for the charts
      const timeline = await db.ctfSubmission.findMany({
        where: {
          participantId: participant.id,
          result: "CORRECT",
        },
        select: {
          pointsAwarded: true,
          submittedAt: true,
          challenge: {
            select: { title: true },
          },
        },
        orderBy: { submittedAt: "asc" },
      });

      res.status(200).json({
        success: true,
        data: {
          rank: stats?.rank || 0,
          totalScore: stats?.score || 0,
          timeline: timeline.map(t => ({
            challengeName: t.challenge.title,
            pointsAwarded: t.pointsAwarded,
            timestamp: t.submittedAt,
          })),
        },
      });
    } catch (error) {
      console.error("❌ [MyScores] Error fetching stats:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

export default router;
