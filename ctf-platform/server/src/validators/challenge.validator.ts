// Created: 2026-08-05 | Modified: Initial creation — Zod validation schemas for API inputs

import { z } from "zod";

// ─── Challenge Update Schema ────────────────────────────────
// Used when an Admin fixes a typo in a live challenge.
// All fields are optional because they only send what changed.
// `.partial()` makes every field optional automatically.
//
// Why Zod? Express doesn't validate request bodies.
// Without Zod, someone could send { "initialPoints": "hacked" }
// aod catches this BEFORE itnd crash the server. Z hits the DB.
// ─────────────────────────────────────────────────────────────

export const updateChallengeSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be under 200 characters")
    .optional(),

  description: z
    .string()
    .max(5000, "Description must be under 5000 characters")
    .optional(),

  // Admins can adjust scoring if a challenge is too easy/hard
  initialPoints: z
    .number()
    .int()
    .min(10, "Minimum 10 initial points")
    .max(5000, "Maximum 5000 initial points")
    .optional(),

  decayCount: z
    .number()
    .int()
    .min(1, "Decay count must be at least 1")
    .max(1000, "Decay count must be under 1000")
    .optional(),

  minimumPoints: z
    .number()
    .int()
    .min(1, "Minimum points must be at least 1")
    .max(5000, "Maximum 5000 minimum points")
    .optional(),
}).strict(); // .strict() rejects any fields NOT defined above

// Type export so route handlers get full type safety
export type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>;
