// Created: 2026-08-05 | Modified: Initial creation — Competition read-only routes

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import db from "../lib/db";

const router = Router();

// ─── GET /api/competitions/active ───────────────────────────
// Returns the currently ACTIVE competition (state = "ACTIVE").
//
// Why only one? In our CTF platform, only ONE competition runs
// at a time. If none is active, the frontend shows the Lobby
// page with a countdown timer. If one is active, it shows the
// Challenge Board.
//
// Who can access: Any authenticated user.
// ─────────────────────────────────────────────────────────────

router.get(
  "/active",
  authMiddleware,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const competition = await db.ctfCompetition.findFirst({
        where: { state: "ACTIVE" },
        select: {
          id: true,
          title: true,
          description: true,
          rules: true,
          state: true,
          startTime: true,
          endTime: true,
          inviteCode: true,
          // Include a count of challenges and participants
          _count: {
            select: {
              challenges: true,
              participants: true,
            },
          },
        },
      });

      if (!competition) {
        // No active competition — check if there's an OPEN one
        // (accepting registrations but hasn't started yet)
        const upcoming = await db.ctfCompetition.findFirst({
          where: { state: { in: ["OPEN", "DRAFT"] } },
          select: {
            id: true,
            title: true,
            description: true,
            rules: true,
            state: true,
            startTime: true,
            endTime: true,
          },
          orderBy: { startTime: "asc" },
        });

        res.json({
          success: true,
          data: upcoming || null,
          message: upcoming
            ? "Competition is not active yet. Showing lobby."
            : "No competitions scheduled.",
        });
        return;
      }

      res.json({
        success: true,
        data: competition,
      });
    } catch (error) {
      console.error("[Competitions] Error fetching active:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch competition data.",
      });
    }
  }
);

// ─── GET /api/competitions/:id/join ─────────────────────────
// Registers the authenticated user as a participant in the
// competition. Creates a CtfParticipant record linking their
// User to the Competition.
//
// Why a GET-style name but POST logic? It's actually a POST.
// "Join" is clearer than "create participant resource".
//
// Who can access: Any authenticated user (typically STUDENT/MEMBER).
// ─────────────────────────────────────────────────────────────

router.post(
  "/:id/join",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: competitionId } = req.params;
      const userId = req.user!.id;

      // Verify competition exists and is joinable
      const competition = await db.ctfCompetition.findUnique({
        where: { id: competitionId },
        select: { id: true, state: true, title: true },
      });

      if (!competition) {
        res.status(404).json({
          success: false,
          message: "Competition not found.",
        });
        return;
      }

      if (competition.state !== "OPEN" && competition.state !== "ACTIVE") {
        res.status(400).json({
          success: false,
          message: `Cannot join a competition in ${competition.state} state.`,
        });
        return;
      }

      // upsert: if they already joined, don't crash — just return
      const participant = await db.ctfParticipant.upsert({
        where: {
          userId_competitionId: {
            userId,
            competitionId,
          },
        },
        update: {}, // Already joined, do nothing
        create: {
          userId,
          competitionId,
        },
        select: {
          id: true,
          totalScore: true,
          tier: true,
          joinedAt: true,
        },
      });

      res.status(201).json({
        success: true,
        data: participant,
        message: `Joined competition: ${competition.title}`,
      });
    } catch (error) {
      console.error("[Competitions] Error joining:", error);
      res.status(500).json({
        success: false,
        message: "Failed to join competition.",
      });
    }
  }
);

export default router;
