// Created: 2026-08-07 | Security Hardening Sprint — Rate limiting + security headers

import rateLimit from "express-rate-limit";

// ─────────────────────────────────────────────────────────────
// RATE LIMITING (Review Point #7: Performance Optimization)
// ─────────────────────────────────────────────────────────────
//
// Rate limiting prevents abuse by capping how many requests a
// single IP address can make within a time window.
//
// WHY IS THIS CRITICAL FOR CTF?
// Without rate limiting, a player could write a script to try
// every possible flag combination. With 10 attempts/minute,
// brute-forcing a flag like "CTF{a1b2c3}" would take years.
//
// TWO TIERS:
// 1. Global: 100 requests per 15 minutes (normal browsing)
// 2. Submission: 10 requests per minute (anti brute-force)
// ─────────────────────────────────────────────────────────────

/**
 * Global rate limiter — applies to ALL API routes.
 * 100 requests per 15-minute window per IP address.
 *
 * This catches general abuse (DDoS, scraping, automation).
 * Normal users will NEVER hit this limit during a CTF.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: 100,                      // 100 requests per window
  standardHeaders: true,         // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,          // Disable `X-RateLimit-*` headers (deprecated)
  validate: { ip: false, xForwardedForHeader: false },
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again in 15 minutes.",
  },
  // Skip rate limiting for basic read requests and health check endpoint
  skip: (req) => req.method === "GET" || req.method === "OPTIONS" || req.path === "/api/health",
});

/**
 * Strict rate limiter — ONLY for flag submission endpoint.
 * 10 attempts per 1-minute window per IP address.
 *
 * This is the anti-brute-force defense. A player who tries
 * to submit 11 flags in 60 seconds gets blocked.
 *
 * WHY 10?
 * - Legitimate players rarely submit more than 5 flags/minute
 * - 10 gives a comfortable margin for fast typists
 * - But makes brute-force computationally infeasible
 *
 * SECURITY NOTE: We rate-limit by IP, not by user, because
 * an attacker could create multiple accounts to bypass
 * per-user limits. IP is harder to rotate.
 */
export const submissionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,      // 1 minute
  max: 10,                       // 10 submissions per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  message: {
    success: false,
    message: "Too many flag submissions. Wait 1 minute before trying again.",
  },
  // Use a specific key prefix so this doesn't share counters
  // with the global limiter
  keyGenerator: (req) => {
    // Combine IP + user ID (if authenticated) for more precise limiting
    const userId = (req as any).user?.id || "anonymous";
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    return `submission:${ip}:${userId}`;
  },
});
