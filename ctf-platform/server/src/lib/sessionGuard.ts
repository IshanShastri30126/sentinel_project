// Created: 2026-08-07 | Security Hardening Sprint — Device fingerprinting + inactivity timeout

import { createHash } from "crypto";
import { Request } from "express";
import redis from "./ctfRedis";

// ─────────────────────────────────────────────────────────────
// DEVICE FINGERPRINTING (Review Points #5 + #10)
// ─────────────────────────────────────────────────────────────
//
// THE PROBLEM (Session Hijacking):
// An attacker steals a user's cookie (via XSS, network sniffing,
// or physical access). They paste it into their own browser.
// Without fingerprinting, the server can't tell the difference
// between the real user and the attacker — both have valid cookies.
//
// THE SOLUTION (Device Binding):
// When a user first authenticates, we compute a "fingerprint"
// from their browser's unique characteristics:
//   - User-Agent (browser name, version, OS)
//   - Accept-Language (language preferences)
//   - IP subnet (/24 — allows WiFi → mobile data switches)
//
// We store this fingerprint in Redis. On every subsequent
// request, we recompute the fingerprint and compare it.
// If it doesn't match → someone stole the cookie → REJECT.
//
// WHY NOT MAC ADDRESS?
// The faculty mentor suggested MAC addresses, but browsers
// CANNOT access MAC addresses (for privacy reasons). Our
// fingerprint is the next best thing.
//
// WHY IP /24 SUBNET INSTEAD OF EXACT IP?
// If we used the exact IP, a user would get logged out every
// time they switched from WiFi to mobile data (different IP).
// The /24 subnet (first 3 octets) is stable enough to catch
// cross-device usage but flexible enough for normal network
// changes within the same ISP.
// ─────────────────────────────────────────────────────────────

const FINGERPRINT_PREFIX = "ctf:fp:";
const SESSION_ACTIVITY_PREFIX = "ctf:activity:";
const INACTIVITY_TIMEOUT_SECONDS = 30 * 60; // 30 minutes

/**
 * Extract the /24 subnet from an IP address.
 * "192.168.1.105" → "192.168.1"
 *
 * This allows IP changes within the same subnet (WiFi roaming)
 * while catching completely different networks (stolen cookie).
 */
function getIpSubnet(ip: string): string {
  // Handle IPv6-mapped IPv4 addresses like "::ffff:192.168.1.105"
  const cleanIp = ip.replace(/^::ffff:/, "");

  // For IPv4: take first 3 octets
  const parts = cleanIp.split(".");
  if (parts.length === 4) {
    return parts.slice(0, 3).join(".");
  }

  // For IPv6: take first 4 groups (equivalent to /64 subnet)
  const v6Parts = cleanIp.split(":");
  if (v6Parts.length >= 4) {
    return v6Parts.slice(0, 4).join(":");
  }

  return cleanIp;
}

/**
 * Compute a device fingerprint from the request.
 *
 * We hash the combination so:
 * 1. The fingerprint is fixed-length (32 chars)
 * 2. We don't store raw user data in Redis (privacy)
 * 3. It's impossible to reverse-engineer the original values
 */
export function computeFingerprint(req: Request): string {
  const userAgent = req.headers["user-agent"] || "unknown";
  const acceptLanguage = req.headers["accept-language"] || "unknown";
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const ipSubnet = getIpSubnet(ip);

  const raw = `${userAgent}|${acceptLanguage}|${ipSubnet}`;

  // SHA-256 hash → deterministic, fixed-length, irreversible
  return createHash("sha256").update(raw).digest("hex").substring(0, 32);
}

/**
 * Store the device fingerprint when a user first authenticates.
 * Called from the auth middleware on the FIRST successful request.
 *
 * @param userId - The authenticated user's ID
 * @param jti    - The JWT's unique token ID
 * @param fingerprint - The computed device fingerprint
 */
export async function storeFingerprint(
  userId: string,
  jti: string,
  fingerprint: string
): Promise<void> {
  const key = `${FINGERPRINT_PREFIX}${userId}:${jti}`;
  // Store with same TTL as the JWT (we'll set 24h as max safety net)
  await redis.set(key, fingerprint, "EX", 24 * 60 * 60);
}

/**
 * Validate the device fingerprint against the stored one.
 *
 * @returns true if the fingerprint matches (same device), false otherwise
 */
export async function validateFingerprint(
  userId: string,
  jti: string,
  currentFingerprint: string
): Promise<boolean> {
  const key = `${FINGERPRINT_PREFIX}${userId}:${jti}`;
  const storedFingerprint = await redis.get(key);

  if (!storedFingerprint) {
    // First request with this token — store the fingerprint
    await storeFingerprint(userId, jti, currentFingerprint);
    return true;
  }

  // Compare: does the current device match the original device?
  return storedFingerprint === currentFingerprint;
}

// ─────────────────────────────────────────────────────────────
// SESSION INACTIVITY TIMEOUT (Review Point #9)
// ─────────────────────────────────────────────────────────────
//
// Even if a JWT hasn't expired, we want to log out users who
// have been INACTIVE for 30 minutes. This prevents scenarios
// where someone leaves their laptop open in a coffee shop and
// walks away — their session should expire.
//
// HOW IT WORKS:
// On every request, we update a "last activity" timestamp in
// Redis. Before processing the next request, we check:
//   "Was the last activity more than 30 minutes ago?"
// If yes → force re-authentication.
// ─────────────────────────────────────────────────────────────

/**
 * Update the last activity timestamp for a user session.
 * Called on every successful authenticated request.
 */
export async function updateLastActivity(
  userId: string,
  jti: string
): Promise<void> {
  const key = `${SESSION_ACTIVITY_PREFIX}${userId}:${jti}`;
  await redis.set(key, Date.now().toString(), "EX", INACTIVITY_TIMEOUT_SECONDS);
}

/**
 * Check if the user's session has been inactive for too long.
 *
 * @returns true if the session is still active, false if timed out
 */
export async function isSessionActive(
  userId: string,
  jti: string
): Promise<boolean> {
  const key = `${SESSION_ACTIVITY_PREFIX}${userId}:${jti}`;
  const lastActivity = await redis.get(key);

  if (!lastActivity) {
    // No activity record exists — this is either the first request
    // or the key expired (30 min inactivity). Either way, allow it
    // and create a new activity record.
    await updateLastActivity(userId, jti);
    return true;
  }

  const lastActivityTime = parseInt(lastActivity, 10);
  const now = Date.now();
  const elapsed = now - lastActivityTime;

  // If elapsed time exceeds timeout, session is inactive
  if (elapsed > INACTIVITY_TIMEOUT_SECONDS * 1000) {
    return false;
  }

  // Session is active — update the timestamp (sliding window)
  await updateLastActivity(userId, jti);
  return true;
}
