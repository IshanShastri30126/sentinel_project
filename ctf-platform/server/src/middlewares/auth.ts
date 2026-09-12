// Created: 2026-08-02 | Modified: Security Hardening — added device fingerprint + inactivity timeout

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { isTokenBlacklisted } from "../lib/ctfRedis";
import db from "../lib/db";
import {
  computeFingerprint,
  validateFingerprint,
  isSessionActive,
  updateLastActivity,
} from "../lib/sessionGuard";

// ─── Extend Express Request ────────────────────────────────
// By default, Express's Request object has no concept of a "user".
// We extend it so that after auth verification, every downstream
// route handler can access `req.user` with full type safety.
// ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ─── JWT Payload Shape ──────────────────────────────────────
// This is what Sentinel encodes inside the JWT token.
// The `jti` (JWT ID) is a unique identifier per token — used
// to check the Redis blacklist.
// ─────────────────────────────────────────────────────────────

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  jti: string;      // Unique token ID (for blacklist lookup)
  iat: number;      // Issued At (Unix timestamp)
  exp: number;      // Expiry (Unix timestamp)
}

// ─── The Auth Middleware ────────────────────────────────────
// This function runs on EVERY protected request. It does 3 things:
//
// Step 1: Extract the JWT from the HttpOnly cookie.
// Step 2: Verify the cryptographic signature (is the token real?).
// Step 3: Check the Redis blacklist (has this token been revoked?).
//
// If all 3 pass, it attaches the user's info to `req.user` and
// calls `next()` to let the request continue to the route handler.
// ─────────────────────────────────────────────────────────────

const JWT_SECRET: string = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
  throw new Error("[ERROR] FATAL: JWT_SECRET is not defined in .env");
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // ── Step 1: Extract token from cookie ───────────────────
    // The cookie name must match what Sentinel sets on login.
    // HttpOnly means JavaScript in the browser CANNOT read it —
    // only the server can. This kills XSS token theft.
    const token = req.cookies?.token;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Not authenticated. No token cookie found.",
      });
      return;
    }

    // ── Step 2: Verify signature ────────────────────────────
    // jwt.verify() does TWO things at once:
    //   a) Checks the HMAC-SHA256 signature (was this token created
    //      by OUR server using OUR secret key?)
    //   b) Checks the `exp` field (has this token expired?)
    // If either fails, it throws an error.
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;

    // ── Step 3: Check Redis blacklist ───────────────────────
    // Even if the signature is valid, the user may have LOGGED OUT.
    // On logout, we store their token's unique `jti` in Redis.
    // This O(1) lookup takes < 1ms (sub-millisecond).
    if (decoded.jti) {
      const isRevoked = await isTokenBlacklisted(decoded.jti);
      if (isRevoked) {
        res.status(401).json({
          success: false,
          message: "Token has been revoked. Please log in again.",
        });
        return;
      }
    }

    // ── Step 4: Fetch fresh user data from DB ───────────────
    // We don't blindly trust the JWT's role claim. We fetch the
    // LATEST user record from the database. Why?
    // If an admin demotes a user from ADMIN to STUDENT, the old
    // JWT still says ADMIN. By checking the DB, we catch this.
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User account not found.",
      });
      return;
    }

    // ── Step 5: Device Fingerprint Check (Review Point #5 + #10)
    // Compute a fingerprint from the request's browser characteristics.
    // If this doesn't match the fingerprint stored when the token was
    // first used, someone stole the cookie and is using it on a
    // different device → REJECT.
    if (decoded.jti) {
      const fingerprint = computeFingerprint(req);
      const isValidDevice = await validateFingerprint(
        decoded.userId,
        decoded.jti,
        fingerprint
      );

      if (!isValidDevice) {
        console.warn(
          `[WARN] [Auth] Device fingerprint mismatch for user ${decoded.email}. Possible session hijacking.`
        );
        res.status(401).json({
          success: false,
          message: "Session invalid. Please log in again.",
        });
        return;
      }

      // ── Step 6: Inactivity Timeout Check (Review Point #9)
      // Even if the JWT hasn't expired, check if the user has been
      // inactive for more than 30 minutes. If so, force re-auth.
      const sessionActive = await isSessionActive(
        decoded.userId,
        decoded.jti
      );

      if (!sessionActive) {
        res.status(401).json({
          success: false,
          message: "Session expired due to inactivity. Please log in again.",
        });
        return;
      }
    }

    // ── Attach user to request ──────────────────────────────
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // ── Step 7: Update last activity timestamp (Review Point #9)
    // Refresh the sliding window so the 30-minute inactivity
    // timeout resets on every successful request.
    if (decoded.jti) {
      // Fire-and-forget: don't block the request for a Redis write
      updateLastActivity(decoded.userId, decoded.jti).catch(() => { });
    }

    next();
  } catch (error) {
    // jwt.verify() throws specific error types:
    // - TokenExpiredError: Token's `exp` timestamp has passed
    // - JsonWebTokenError: Signature is invalid (tampered token)
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid token signature.",
      });
      return;
    }

    // Unexpected error (DB down, Redis down, etc.)
    console.error("[ERROR] [Auth Middleware] Unexpected error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
    });
  }
}
