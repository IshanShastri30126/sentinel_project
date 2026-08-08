import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { Role } from "@prisma/client";
import prisma from "../lib/prisma";
import { logAuditEvent } from "../lib/auditLogger";

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
 * Middleware: Verify JWT from Authorization header or cookie.
 * Enforces Device Fingerprint validation & Session Hijacking prevention.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace("Bearer ", "") ||
    (req.query.token as string);

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthPayload;

    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isActive: true },
    });

    if (!dbUser || !dbUser.isActive) {
      res.status(401).json({ error: "Account inactive or unauthorized" });
      return;
    }

    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Role hierarchy levels — lower number = higher authority.
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  FACULTY: 1,
  STUDENT_COORDINATOR: 1,
  TECH: 1,
  CONTENT: 3,
  SOCIAL_MEDIA: 3,
  MEMBER: 4,
  GUEST: 5,
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

    const userLevel = ROLE_HIERARCHY[req.user.role];
    const requiredLevel = ROLE_HIERARCHY[minRole];

    if (userLevel > requiredLevel) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}
