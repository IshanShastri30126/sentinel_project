// Created: 2026-08-06 | Modified: Initial creation — Flag submission engine with 3-layer defense

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middlewares/auth";
import db from "../lib/db";
import { calculateDecayScore } from "../lib/scoring";
import { acquireLockWithRetry, releaseLock } from "../lib/locks";
import { incrementUserScore } from "../lib/leaderboard";
import { ctfNamespace } from "../index";

// ─────────────────────────────────────────────────────────────
// FLAG SUBMISSION ENGINE
// ─────────────────────────────────────────────────────────────
//
// This is the most critical route in the entire CTF platform.
// It handles what happens when a player clicks "Submit Flag."
//
// The 3-Layer Defense Strategy:
//
//   Layer 1: Redis Distributed Lock
//     → Prevents two players from being scored as "1st solver"
//       at the same millisecond.
//
//   Layer 2: Optimistic Concurrency Control (OCC)
//     → The version field on CtfChallenge ensures that if two
//       writes happen, only one succeeds. The other gets a
//       409 Conflict and must retry.
//
//   Layer 3: Database Unique Constraint
//     → The @@unique([participantId, challengeId]) on
//       ChallengeActivity ensures a player can never have
//       two SOLVED records for the same challenge.
//
// Why 3 layers?
// Any single layer can theoretically fail:
//   - Redis might crash (Layer 1 gone)
//   - OCC retries might both succeed (Layer 2 gone)
//   - But the DB constraint ALWAYS holds (Layer 3 = final safety net)
// ─────────────────────────────────────────────────────────────

const router = Router();

// ─────────────────────────────────────────────────────────────
// POST /api/submissions
// ─────────────────────────────────────────────────────────────
//
// Request Body:
//   {
//     "challengeId": "uuid-of-the-challenge",
//     "flag": "CTF{the_players_guess}"
//   }
//
// Possible Responses:
//   200 → Flag is correct! Points awarded.
//   400 → Missing input or already solved.
//   403 → Not a participant in this competition.
//   404 → Challenge not found.
//   423 → Server busy (couldn't acquire lock).
//   429 → Wrong flag. Try again.
// ─────────────────────────────────────────────────────────────

router.post(
  "/",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    // A unique lock owner ID for this specific submission attempt
    const lockOwnerId = `${req.user!.id}:${Date.now()}`;
    let lockAcquired = false;
    let challengeId: string = "";

    try {
      // ── Step 0: Validate Input ──────────────────────────────
      const { challengeId: inputChallengeId, flag } = req.body;

      if (!inputChallengeId || !flag) {
        res.status(400).json({
          success: false,
          message: "Both challengeId and flag are required.",
        });
        return;
      }

      challengeId = inputChallengeId;

      // ── Step 1: Fetch the challenge ─────────────────────────
      // We need the flagHash (to compare), scoring params, and
      // the competitionId (to verify participation).
      const challenge = await db.ctfChallenge.findUnique({
        where: { id: challengeId },
        select: {
          id: true,
          flagHash: true,
          flagType: true,
          initialPoints: true,
          minimumPoints: true,
          decayCount: true,
          solveCount: true,
          version: true,
          competitionId: true,
          competition: {
            select: { state: true },
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

      // ── Step 1b: Is the competition still ACTIVE? ───────────
      // Players shouldn't be able to submit flags after the
      // competition has ended or been paused.
      if (challenge.competition.state !== "ACTIVE") {
        res.status(400).json({
          success: false,
          message: "This competition is not currently active.",
        });
        return;
      }

      // ── Step 2: Is this user a registered participant? ──────
      const participant = await db.ctfParticipant.findUnique({
        where: {
          userId_competitionId: {
            userId: req.user!.id,
            competitionId: challenge.competitionId,
          },
        },
        select: { id: true, totalScore: true, version: true },
      });

      if (!participant) {
        res.status(403).json({
          success: false,
          message: "You must join this competition first.",
        });
        return;
      }

      // ── Step 3: Has this player already solved this challenge?
      // Check BEFORE acquiring the lock to save Redis resources.
      const existingActivity = await db.ctfChallengeActivity.findUnique({
        where: {
          participantId_challengeId: {
            participantId: participant.id,
            challengeId: challengeId,
          },
        },
        select: { status: true },
      });

      if (existingActivity?.status === "SOLVED") {
        res.status(400).json({
          success: false,
          message: "You have already solved this challenge.",
        });
        return;
      }

      // ── Step 4: Verify the flag using bcrypt ────────────────
      // bcrypt.compare is TIMING-SAFE — it always takes the same
      // amount of time regardless of how "close" the guess is.
      // This prevents timing attacks where an attacker measures
      // response time to guess the flag character-by-character.
      const isCorrect = await bcrypt.compare(flag, challenge.flagHash);

      if (!isCorrect) {
        // Log the incorrect attempt
        await db.ctfSubmission.create({
          data: {
            submittedHash: flag, // Store the raw guess (for admin audit logs)
            result: "INCORRECT",
            pointsAwarded: 0,
            participantId: participant.id,
            challengeId: challengeId,
          },
        });

        // Update activity to ATTEMPTED (but don't overwrite SOLVED)
        await db.ctfChallengeActivity.upsert({
          where: {
            participantId_challengeId: {
              participantId: participant.id,
              challengeId: challengeId,
            },
          },
          create: {
            participantId: participant.id,
            challengeId: challengeId,
            status: "ATTEMPTED",
          },
          update: {
            // Safe: We already returned at Step 3 if status was SOLVED
            status: "ATTEMPTED",
          },
        });

        res.status(429).json({
          success: false,
          message: "Incorrect flag. Try again.",
        });
        return;
      }

      // ═══════════════════════════════════════════════════════
      // FLAG IS CORRECT! Now we need to score atomically.
      // ═══════════════════════════════════════════════════════

      // ── Step 5: Acquire Redis Lock ──────────────────────────
      // This prevents two correct submissions from being scored
      // simultaneously (the "double 1st place" problem).
      lockAcquired = await acquireLockWithRetry(challengeId, lockOwnerId);

      if (!lockAcquired) {
        // The lock is held by another submission that's being processed.
        // This is extremely rare — it means two players submitted the
        // correct flag within ~100ms of each other.
        res.status(423).json({
          success: false,
          message: "Server is processing another submission for this challenge. Please retry.",
        });
        return;
      }

      // ── Step 6: Re-read the challenge (inside the lock) ─────
      // Why read AGAIN? Because between Step 1 and Step 5, another
      // player might have solved it. The solveCount and version
      // might have changed. We need the LATEST data.
      const freshChallenge = await db.ctfChallenge.findUnique({
        where: { id: challengeId },
        select: {
          solveCount: true,
          initialPoints: true,
          minimumPoints: true,
          decayCount: true,
          version: true,
        },
      });

      if (!freshChallenge) {
        res.status(404).json({
          success: false,
          message: "Challenge disappeared during processing.",
        });
        return;
      }

      // ── Step 7: Double-check "already solved" (inside lock) ──
      // Another correct submission might have completed between
      // our first check (Step 3) and acquiring the lock (Step 5).
      const freshActivity = await db.ctfChallengeActivity.findUnique({
        where: {
          participantId_challengeId: {
            participantId: participant.id,
            challengeId: challengeId,
          },
        },
        select: { status: true },
      });

      if (freshActivity?.status === "SOLVED") {
        res.status(400).json({
          success: false,
          message: "You have already solved this challenge.",
        });
        return;
      }

      // ── Step 8: Calculate points using parabolic decay ──────
      // The NEW solveCount is current + 1 (this player is solving it now)
      const newSolveCount = freshChallenge.solveCount + 1;
      const pointsAwarded = calculateDecayScore(
        freshChallenge.initialPoints,
        freshChallenge.minimumPoints,
        freshChallenge.decayCount,
        newSolveCount
      );

      // Also calculate what the challenge's currentPoints should
      // be for the NEXT solver (displayed on the challenge board)
      const nextSolverPoints = calculateDecayScore(
        freshChallenge.initialPoints,
        freshChallenge.minimumPoints,
        freshChallenge.decayCount,
        newSolveCount + 1
      );

      // ── Step 9: Atomic Database Transaction ─────────────────
      // ALL of these writes happen as ONE operation. If ANY
      // single write fails, ALL of them roll back. This is
      // the "all-or-nothing" guarantee of database transactions.
      //
      // Without a transaction, we could have:
      //   ✅ Submission created
      //   ✅ solveCount incremented
      //   ❌ totalScore update fails (crash!)
      //   Result: Player gets no points but challenge shows as solved
      //
      // With a transaction:
      //   ❌ If anything fails → EVERYTHING rolls back
      //   Result: Clean state, player can retry

      const [submission] = await db.$transaction([
        // 9a: Create the submission record
        db.ctfSubmission.create({
          data: {
            submittedHash: flag,
            result: "CORRECT",
            pointsAwarded: pointsAwarded,
            participantId: participant.id,
            challengeId: challengeId,
          },
        }),

        // 9b: Increment solveCount + update currentPoints on the challenge
        db.ctfChallenge.update({
          where: { id: challengeId },
          data: {
            solveCount: { increment: 1 },
            currentPoints: nextSolverPoints,
            version: { increment: 1 },
          },
        }),

        // 9c: Add points to the participant's total score
        db.ctfParticipant.update({
          where: { id: participant.id },
          data: {
            totalScore: { increment: pointsAwarded },
            lastSolveAt: new Date(),
            version: { increment: 1 },
          },
        }),

        // 9d: Mark the challenge as SOLVED in the activity tracker
        db.ctfChallengeActivity.upsert({
          where: {
            participantId_challengeId: {
              participantId: participant.id,
              challengeId: challengeId,
            },
          },
          create: {
            participantId: participant.id,
            challengeId: challengeId,
            status: "SOLVED",
          },
          update: {
            status: "SOLVED",
          },
        }),
      ]);

      // ── Step 10: Redis Leaderboard Update ───────────────────
      const newTotalScore = await incrementUserScore(
        challenge.competitionId,
        participant.id,
        pointsAwarded
      );

      // ── Step 11: Real-Time Broadcasts ───────────────────────
      const ctfNamespace = req.app.get("io")?.of("/ctf"); // Or import ctfNamespace directly, but let's import it at the top
      
      console.log(
        `[FLAG CORRECT] ${req.user!.email} solved challenge ${challengeId} for ${pointsAwarded} pts (solve #${newSolveCount})`
      );

      // We use the imported ctfNamespace directly to emit to the room.
      ctfNamespace.to(`competition:${challenge.competitionId}`).emit("leaderboardUpdate", {
        participantId: participant.id,
        newTotalScore: newTotalScore,
        challengeId: challengeId,
        pointsAwarded: pointsAwarded,
      });

      ctfNamespace.to(`competition:${challenge.competitionId}`).emit("liveSolve", {
        challengeId: challengeId,
        newSolveCount: newSolveCount,
        solverName: req.user?.name || "Someone",
      });

      res.json({
        success: true,
        message: "Correct flag! Points awarded.",
        data: {
          pointsAwarded,
          newTotalScore: participant.totalScore + pointsAwarded,
          solveNumber: newSolveCount,
          challengeCurrentPoints: nextSolverPoints,
        },
      });
    } catch (error) {
      console.error("[Submissions] Error processing flag:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process submission.",
      });
    } finally {
      // ── ALWAYS release the lock ───────────────────────────
      // The `finally` block runs no matter what — even if the
      // code above threw an error or returned early. This
      // guarantees we never leave a "zombie lock" in Redis.
      if (lockAcquired) {
        await releaseLock(challengeId, lockOwnerId);
      }
    }
  }
);

export default router;
