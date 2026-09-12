// Created: 2026-08-05 | Modified: Initial creation — Challenge read + admin live-fix routes

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { roleGuard } from "../middlewares/roleGuard";
import { updateChallengeSchema } from "../validators/challenge.validator";
import db from "../lib/db";

const router = Router();

// ─── GET /api/challenges?competitionId=xxx ──────────────────
// Returns ALL challenges for a specific competition.
//
// The frontend calls this when the Challenge Board loads.
// We return everything EXCEPT the flagHash (obviously).
// We also include the hint count (but NOT hint content — that's
// a separate endpoint so hints cost points).
//
// Who can access: Any authenticated user who has joined.
// ─────────────────────────────────────────────────────────────

router.get(
  "/",
  authMiddleware,
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

      // Verify user is a participant of this competition
      const participant = await db.ctfParticipant.findUnique({
        where: {
          userId_competitionId: {
            userId: req.user!.id,
            competitionId,
          },
        },
        select: { id: true },
      });

      if (!participant) {
        res.status(403).json({
          success: false,
          message: "You must join this competition first.",
        });
        return;
      }

      // ── Pagination (Review Point #7) ──────────────────────
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const skip = (page - 1) * limit;

      // Get total count for pagination metadata
      const total = await db.ctfChallenge.count({
        where: { competitionId },
      });

      const challenges = await db.ctfChallenge.findMany({
        where: { competitionId },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          // Scoring info (visible to players)
          initialPoints: true,
          currentPoints: true,
          minimumPoints: true,
          solveCount: true,
          createdAt: true,
          // NOTE: flagHash is NEVER sent to the client
          // Include hint count (not content)
          _count: {
            select: { hints: true },
          },
          // Include this user's activity status for each challenge
          activities: {
            where: { participantId: participant.id },
            select: { status: true },
          },
        },
        orderBy: [
          { category: "asc" },
          { difficulty: "asc" },
        ],
        skip,
        take: limit,
      });

      // Transform the response to flatten the activity status
      const formatted = challenges.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty,
        initialPoints: c.initialPoints,
        currentPoints: c.currentPoints,
        minimumPoints: c.minimumPoints,
        solveCount: c.solveCount,
        hintCount: c._count.hints,
        // If user has an activity, show the status; otherwise null
        userStatus: c.activities[0]?.status ?? null,
        createdAt: c.createdAt,
      }));

      res.json({
        success: true,
        data: formatted,
        count: formatted.length,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("[ERROR] [Challenges] Error fetching:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch challenges.",
      });
    }
  }
);

// ─── GET /api/challenges/:id ────────────────────────────────
// Returns a SINGLE challenge with full details.
// Used when a player clicks on a challenge card to open the
// detail modal.
//
// This also creates/updates a ChallengeActivity record to
// track that the user OPENED this challenge (for the admin
// Progression Matrix).
//
// Who can access: Any authenticated participant.
// ─────────────────────────────────────────────────────────────

router.get(
  "/:id",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const challenge = await db.ctfChallenge.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          flagType: true,
          initialPoints: true,
          currentPoints: true,
          minimumPoints: true,
          decayCount: true,
          solveCount: true,
          competitionId: true,
          createdAt: true,
          updatedAt: true,
          // Include hints (ordered, content visible here)
          hints: {
            select: {
              id: true,
              content: true,
              pointCost: true,
              orderIndex: true,
            },
            orderBy: { orderIndex: "asc" },
          },
        },
      });

      if (!challenge) {
        res.status(404).json({
          success: false,
          message: "Challenge not found.",
        });
        return;
      }

      // Track that this user OPENED the challenge (for Progression Matrix)
      const participant = await db.ctfParticipant.findUnique({
        where: {
          userId_competitionId: {
            userId: req.user!.id,
            competitionId: challenge.competitionId,
          },
        },
        select: { id: true },
      });

      if (participant) {
        // upsert: Create OPENED activity if not exists, don't overwrite
        // if already ATTEMPTED or SOLVED
        await db.ctfChallengeActivity.upsert({
          where: {
            participantId_challengeId: {
              participantId: participant.id,
              challengeId: challenge.id,
            },
          },
          create: {
            participantId: participant.id,
            challengeId: challenge.id,
            status: "OPENED",
          },
          update: {}, // Don't overwrite existing status
        });
      }

      res.json({
        success: true,
        data: challenge,
      });
    } catch (error) {
      console.error("[ERROR] [Challenges] Error fetching single:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch challenge.",
      });
    }
  }
);

// ─── PATCH /api/challenges/:id ──────────────────────────────
// Admin-only: Update a challenge to fix live issues.
//
// This is the ONLY write operation CTF Wars has for challenges.
// No Create, no Delete — those happen in Sentinel.
//
// Uses OCC (Optimistic Concurrency Control): The admin sends
// the current `version` number. If someone else modified the
// challenge in between, the version won't match and the update
// fails safely.
//
// In Chunk 6, this endpoint will also trigger a WebSocket
// broadcast for the 5-Second Freeze Pop-Up.
//
// Who can access: SUPER_ADMIN, ADMIN, FACULTY (Question Setter)
// ─────────────────────────────────────────────────────────────

router.patch(
  "/:id",
  authMiddleware,
  roleGuard(["SUPER_ADMIN", "ADMIN", "FACULTY"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // ── Step 1: Validate input with Zod ─────────────────────
      const parseResult = updateChallengeSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: "Invalid input.",
          errors: parseResult.error.flatten().fieldErrors,
        });
        return;
      }

      const updateData = parseResult.data;

      // Reject empty updates
      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          message: "No fields provided to update.",
        });
        return;
      }

      // ── Step 2: Fetch current challenge + verify it exists ──
      const existing = await db.ctfChallenge.findUnique({
        where: { id },
        select: { id: true, version: true, competitionId: true },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          message: "Challenge not found.",
        });
        return;
      }

      // ── Step 3: OCC Update ──────────────────────────────────
      // We update WHERE id = X AND version = currentVersion.
      // If someone else modified it between our read and write,
      // the version won't match and updateMany returns count: 0.
      const result = await db.ctfChallenge.updateMany({
        where: {
          id,
          version: existing.version, // OCC check
        },
        data: {
          ...updateData,
          version: { increment: 1 }, // Bump version
        },
      });

      if (result.count === 0) {
        // OCC conflict — someone else modified it first
        res.status(409).json({
          success: false,
          message:
            "Conflict: This challenge was modified by someone else. Please refresh and try again.",
        });
        return;
      }

      // ── Step 4: Fetch the updated record to return ──────────
      const updated = await db.ctfChallenge.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          initialPoints: true,
          currentPoints: true,
          minimumPoints: true,
          decayCount: true,
          version: true,
          updatedAt: true,
        },
      });

      // Broadcast WebSocket event for 5-Second Freeze
      const ctfNamespace = req.app.get("io")?.of("/ctf");
      if (ctfNamespace) {
        ctfNamespace.to(`competition:${existing.competitionId}`).emit("adminFreeze", {
          challengeId: id,
          title: updated?.title,
          message: "Admin is updating this challenge. Submissions are temporarily paused.",
        });
      }

      console.log(
        ` [Challenge Updated] "${updated?.title}" by ${req.user!.email} (v${updated?.version})`
      );

      res.json({
        success: true,
        data: updated,
        message: "Challenge updated successfully.",
      });
    } catch (error) {
      console.error("[Challenges] Error updating:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update challenge.",
      });
    }
  }
);

export default router;
