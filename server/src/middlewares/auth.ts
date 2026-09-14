import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { Role } from "@prisma/client";
import prisma from "../lib/prisma";
import { logAuditEvent } from "../lib/auditLogger";
import { redisGet, redisSet } from "../lib/redis";

export interface AuthPayload {
  userId: string;
  email: string;
  role: Role;
  deviceFingerprint?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Middleware: Verify JWT from Authorization header or HttpOnly cookie.
 *
 * Security notes:
 * - Token-from-query-string (?token=...) is intentionally NOT supported.
 *   Query params appear in server logs, browser history, and Referer headers.
 * - All JWT verification errors are normalised to a single generic message
 *   to prevent error-oracle attacks (distinguishing "expired" vs "malformed").
 * - jwt.verify() uses hmac timing-safe comparison internally — no additional
 *   constant-time guard needed at this layer.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Only accept token from HttpOnly cookie OR Authorization header — never from query string
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthPayload;

    // Cache isActive check in Redis (60s TTL) to avoid a Neon round-trip on every request.
    // The cache key is scoped to the userId so deactivations propagate within 60s.
    const cacheKey = `auth:active:${payload.userId}`;
    const cached = await redisGet(cacheKey);

    if (cached === null) {
      // Cache miss — hit the DB and populate cache
      // SEC-001 residual fix: also check isApproved so unapproved GUESTs cannot
      // access authenticated routes even before an admin approves their account.
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { isActive: true, isApproved: true, role: true },
      });

      // Allow access only when active AND (approved OR is a high-trust role that
      // was created directly by an admin, e.g. FACULTY_COORDINATOR/DEVELOPMENT_TEAM).
      // GUEST and MEMBER must be explicitly approved.
      const highTrustRoles: Role[] = ["FACULTY_COORDINATOR", "DEVELOPMENT_TEAM", "STUDENT_COORDINATOR", "SOCIAL_MEDIA_COORDINATOR"];
      const approvalRequired = dbUser && !highTrustRoles.includes(dbUser.role);

      if (!dbUser || !dbUser.isActive || (approvalRequired && !dbUser.isApproved)) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      await redisSet(cacheKey, "1", 60);
    } else if (cached === "0") {
      // Cached as inactive or unapproved
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    // cached === "1" → active and approved, proceed without DB hit

    req.user = payload;
    next();
  } catch {
    // Normalise ALL jwt errors (expired, malformed, invalid signature, etc.)
    // to a single generic message — prevents distinguishing token states
    res.status(401).json({ error: "Authentication required" });
  }
}

/**
 * Role hierarchy levels — lower number = higher authority.
 * EXACT 5 USER ROLES.
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  FACULTY_COORDINATOR: 1,
  DEVELOPMENT_TEAM: 2,
  STUDENT_COORDINATOR: 3,
  SOCIAL_MEDIA_COORDINATOR: 4,
  MEMBER: 5,
};

/**
 * Middleware factory: Require that the authenticated user has one of the allowed roles.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}

/**
 * Middleware: Require minimum role level (hierarchy-based).
 */
export function requireMinRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] ?? 99;
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 99;

    if (userLevel > requiredLevel) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}
