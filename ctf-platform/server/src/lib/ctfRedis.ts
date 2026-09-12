// Created: 2026-08-02 | Modified: 2026-08-16 — Graceful degradation when Redis is unavailable

import Redis from "ioredis";

// ─── Redis Connection ───────────────────────────────────────
// Uses ioredis (TCP) for sub-millisecond latency on JWT
// blacklist checks and distributed locks.
//
// IMPORTANT: The server will start even if Redis is down.
// Real-time features (leaderboard, presence) and token
// blacklisting will be disabled until Redis reconnects.
// ─────────────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redisReady = false;

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    if (times > 5) {
      console.warn("[WARN] [Redis] Max retries reached. Running without Redis — real-time features disabled.");
      return null; // Stop retrying — don't crash the server
    }
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true, // Don't block server startup
  enableReadyCheck: true,
});

// Try to connect, but don't crash if it fails
redis.connect().catch((err) => {
  console.warn("[WARN] [Redis] Could not connect:", err.message);
  console.warn("[WARN] [Redis] Server will run without Redis. Real-time features disabled.");
});

redis.on("ready", () => {
  redisReady = true;
  console.log("[OK] [Redis] Connected to TCP Redis at", REDIS_URL);
});

redis.on("error", () => {
  // Silenced — the retryStrategy handles logging
});

redis.on("close", () => {
  redisReady = false;
});

// ─── Token Blacklist Helpers ────────────────────────────────
// Gracefully degrade: if Redis is down, blacklist operations
// are no-ops. This means tokens can't be revoked until Redis
// reconnects, but the server stays alive.
// ─────────────────────────────────────────────────────────────

export async function blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
  if (!redisReady) return;
  try {
    await redis.set(`blacklist:${jti}`, "revoked", "EX", ttlSeconds);
  } catch {
    console.warn("[WARN] [Redis] blacklistToken failed — token not blacklisted");
  }
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  if (!redisReady) return false; // Can't check — assume not blacklisted
  try {
    const result = await redis.get(`blacklist:${jti}`);
    return result !== null;
  } catch {
    return false;
  }
}

export { redisReady };
export default redis;

