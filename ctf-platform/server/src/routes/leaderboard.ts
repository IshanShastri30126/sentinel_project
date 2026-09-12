// Created: 2026-08-07 | Modified: Initial creation — Chunk 6 Leaderboard Route

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { getTopLeaderboard } from "../lib/leaderboard";
import db from "../lib/db";

const router = Router();

// ─── GET /api/leaderboard/:competitionId ─────────────────────
// Returns the top players for a specific competition.
// ─────────────────────────────────────────────────────────────
router.get(
  "/:competitionId",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { competitionId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      // 1. Get the sorted participant IDs from Redis (O(log(N) + M))
      const topPlayers = await getTopLeaderboard(competitionId, limit);

      if (topPlayers.length === 0) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      const participantIds = topPlayers.map((p) => p.participantId);

      // 2. Fetch their details from PostgreSQL
      const participantsData = await db.ctfParticipant.findMany({
        where: { id: { in: participantIds } },
        select: {
          id: true,
          user: {
            select: { name: true, email: true },
          },
        },
      });

      // 3. Merge Redis scores with Postgres details
      // Create a map for O(1) lookups
      const participantMap = new Map(
        participantsData.map((p) => [p.id, p])
      );

      const leaderboard = topPlayers.map((player, index) => {
        const pData = participantMap.get(player.participantId);
        
        // Compute Tier based on rank for some frontend styling flare
        let tier = "BRONZE";
        if (index === 0) tier = "DIAMOND";
        else if (index <= 3) tier = "GOLD";
        else if (index <= 10) tier = "SILVER";

        return {
          rank: index + 1,
          participantId: player.participantId,
          name: pData?.user?.name || pData?.user?.email || "Unknown",
          score: player.score,
          tier,
        };
      });

      res.status(200).json({ success: true, data: leaderboard });
    } catch (error) {
      console.error("[ERROR] [Leaderboard] Error fetching leaderboard:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

export default router;
