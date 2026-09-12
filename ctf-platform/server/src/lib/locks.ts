// Created: 2026-08-06 | Modified: Initial creation — Redis distributed lock for flag submissions

import redis from "./ctfRedis";

// ─────────────────────────────────────────────────────────────
// REDIS DISTRIBUTED LOCK (Mutual Exclusion)
// ─────────────────────────────────────────────────────────────
//
// THE PROBLEM:
// Imagine Player A and Player B both submit the correct flag for
// Challenge #5 at the EXACT same millisecond.
//
// Without a lock:
//   1. Both requests read solveCount = 0
//   2. Both calculate score as "1st solver" (500 points!)
//   3. Both write solveCount = 1 to the database
//   Result: Two "1st place" winners. Database is corrupt.
//
// WITH a lock:
//   1. Player A's request grabs the lock for Challenge #5
//   2. Player B's request tries to grab the lock → DENIED → waits
//   3. Player A scores as 1st solver (500 pts), solveCount → 1
//   4. Player A releases the lock
//   5. Player B grabs the lock, reads solveCount = 1
//   6. Player B scores as 2nd solver (499 pts), solveCount → 2
//   Result: Fair, correct, sequential processing.
//
// HOW IT WORKS:
// We use Redis's SET with NX (Set if Not eXists) + PX (expiry in ms).
// This is an ATOMIC operation — it either sets the key or fails.
//
//   SET LOCK:challenge_abc123 <uniqueId> NX PX 5000
//
// - NX  = Only set if the key does NOT already exist
// - PX  = Auto-expire after 5000ms (safety net if server crashes)
// - The uniqueId ensures ONLY the owner can release the lock
//
// WHY NOT USE DATABASE LOCKS?
// PostgreSQL's SELECT FOR UPDATE creates a "pessimistic lock" that
// holds a connection open and blocks other queries. Under 150 users
// submitting flags simultaneously, this would create a connection
// pool bottleneck. Redis locks are in-memory and resolve in <1ms.
// ─────────────────────────────────────────────────────────────

const LOCK_PREFIX = "ctf:lock:challenge:";
const DEFAULT_LOCK_TTL_MS = 5000; // Lock expires after 5 seconds (safety net)
const RETRY_DELAY_MS = 100;       // Wait 100ms between retry attempts
const MAX_RETRIES = 3;            // Try 3 times before giving up

/**
 * Acquire a distributed lock for a specific challenge.
 *
 * @param challengeId - The challenge being locked
 * @param ownerId     - A unique string identifying who owns this lock
 *                      (we use participantId so each player gets their own lock identity)
 * @param ttlMs       - How long the lock lives before auto-expiring (default: 5s)
 * @returns true if lock was acquired, false if someone else holds it
 */
export async function acquireLock(
  challengeId: string,
  ownerId: string,
  ttlMs: number = DEFAULT_LOCK_TTL_MS
): Promise<boolean> {
  const lockKey = `${LOCK_PREFIX}${challengeId}`;

  // SET key value NX PX ttl
  // NX = "only set if Not eXists" → returns "OK" if set, null if already exists
  // PX = "expire in X milliseconds" → safety net if our code crashes
  const result = await redis.set(lockKey, ownerId, "PX", ttlMs, "NX");

  return result === "OK";
}

/**
 * Acquire a lock with automatic retries.
 * If the lock is held by someone else, wait and try again.
 *
 * @param challengeId - The challenge being locked
 * @param ownerId     - Unique lock owner ID
 * @param maxRetries  - How many times to retry (default: 3)
 * @returns true if lock acquired within retries, false if all attempts failed
 */
export async function acquireLockWithRetry(
  challengeId: string,
  ownerId: string,
  maxRetries: number = MAX_RETRIES
): Promise<boolean> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const acquired = await acquireLock(challengeId, ownerId);
    if (acquired) return true;

    // Wait before retrying (don't hammer Redis)
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  return false; // All retries exhausted
}

/**
 * Release the distributed lock, but ONLY if we are the owner.
 *
 * Why check ownership? Imagine this disaster scenario:
 *   1. Player A acquires lock, starts processing
 *   2. Player A's processing takes too long, lock auto-expires (TTL)
 *   3. Player B acquires the now-free lock, starts processing
 *   4. Player A's code finishes and calls releaseLock()
 *   5. Player A accidentally deletes Player B's lock!
 *
 * By checking "is the value my ownerId?", we prevent this.
 * We use a Lua script because Redis executes Lua atomically —
 * the GET + DEL happen as one uninterruptible operation.
 */
export async function releaseLock(
  challengeId: string,
  ownerId: string
): Promise<boolean> {
  const lockKey = `${LOCK_PREFIX}${challengeId}`;

  // Lua script: "If the lock belongs to me, delete it. Otherwise, don't touch it."
  // This runs atomically inside Redis — no race condition possible.
  const luaScript = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;

  const result = await redis.eval(luaScript, 1, lockKey, ownerId);
  return result === 1;
}
