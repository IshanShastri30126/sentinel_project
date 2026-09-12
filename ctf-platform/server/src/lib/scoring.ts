// Created: 2026-08-06 | Modified: Initial creation — Parabolic decay scoring formula

// ─────────────────────────────────────────────────────────────
// PARABOLIC DECAY SCORING
// ─────────────────────────────────────────────────────────────
//
// This is the mathematical heart of the CTF scoring system.
//
// The idea: The FIRST person to solve a challenge gets maximum
// points. As more people solve it, the points DROP along a
// parabolic curve (not a straight line).
//
// Why parabolic instead of linear?
//   Linear:    500 → 450 → 400 → 350 → ... (boring, predictable)
//   Parabolic: 500 → 499 → 494 → 485 → 468 → ... (steep drop later)
//
// This rewards early solvers heavily and makes the leaderboard
// more dynamic — solving an "easy" challenge that everyone has
// already solved gives almost no points.
//
// Formula (from CTFd's parabolic model):
//   points = max(minimum, initial - initial * (solveCount / decayCount)²)
//
// Where:
//   initial    = Starting points (e.g., 500)
//   minimum    = Floor — points never go below this (e.g., 50)
//   decayCount = Number of solves at which points hit the minimum (e.g., 20)
//   solveCount = How many people have solved it so far
// ─────────────────────────────────────────────────────────────

/**
 * Calculate the current point value of a challenge using parabolic decay.
 *
 * @param initialPoints  - Maximum points when nobody has solved it yet
 * @param minimumPoints  - Floor value — points never drop below this
 * @param decayCount     - Number of solves at which points reach the minimum
 * @param solveCount     - Current number of correct solves
 * @returns The calculated point value (always an integer)
 *
 * @example
 *   // First solver: 500 points
 *   calculateDecayScore(500, 50, 20, 0) → 500
 *
 *   // 5th solver:
 *   calculateDecayScore(500, 50, 20, 5) → 469
 *
 *   // 15th solver:
 *   calculateDecayScore(500, 50, 20, 15) → 219
 *
 *   // 20th+ solver: always 50 (the minimum)
 *   calculateDecayScore(500, 50, 20, 25) → 50
 */
export function calculateDecayScore(
  initialPoints: number,
  minimumPoints: number,
  decayCount: number,
  solveCount: number
): number {
  // Guard: If decayCount is 0 or negative, just return the minimum
  // to avoid division by zero.
  if (decayCount <= 0) {
    return minimumPoints;
  }

  // The parabolic formula:
  // decay = initial * (solveCount / decayCount)²
  // points = initial - decay
  const ratio = solveCount / decayCount;
  const decay = initialPoints * (ratio * ratio); // ratio² = parabolic curve
  const rawPoints = initialPoints - decay;

  // Clamp: Never go below the minimum, and always return a whole number
  return Math.max(minimumPoints, Math.floor(rawPoints));
}
