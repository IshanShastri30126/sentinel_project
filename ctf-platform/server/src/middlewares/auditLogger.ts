// Created: 2026-08-07 | Modified: 2026-08-14 — Added admin action names, severity, input validation logging

import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import db from "../lib/db";

// ─────────────────────────────────────────────────────────────
// AUDIT LOGGER (Review Point #6, Test Cases 7.7–7.24)
// ─────────────────────────────────────────────────────────────
//
// Every critical API action is logged to the `ctf_audit_logs`
// database table with (per Test Case 7.9):
//   - Timestamp from trusted system (server's Date.now())
//   - Severity rating (INFO, WARNING, CRITICAL)
//   - User ID (who did it)
//   - IP Address (from where)
//   - Action (human-readable name)
//   - Event outcome (success/failure via HTTP status code)
//   - Description (method + path)
//   - User Agent (device/browser)
//
// PERFORMANCE NOTE:
// We use a "fire-and-forget" pattern — the log write happens
// asynchronously and does NOT block the response. If the log
// write fails, the user's request still succeeds (7.4).
// ─────────────────────────────────────────────────────────────

// Routes that should be logged (we don't log GET requests for
// challenges/competitions because they happen too frequently)
const LOGGED_METHODS = ["POST", "PATCH", "PUT", "DELETE"];

// Specific GET routes that ARE logged (security-sensitive reads)
const LOGGED_GET_PATHS = [
  "/api/health",
  "/api/admin",  // All admin reads are security-sensitive (7.21)
];

/**
 * Determines the human-readable action name from the request.
 * This makes audit logs readable by non-technical admins.
 */
function getActionName(method: string, path: string): string {
  // Normalize path (remove UUID params for cleaner action names)
  const cleanPath = path.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    ":id"
  );

  const actionMap: Record<string, string> = {
    // Player actions
    "POST /api/submissions": "FLAG_SUBMIT",
    "POST /api/competitions/:id/join": "COMPETITION_JOIN",
    "PATCH /api/challenges/:id": "CHALLENGE_UPDATE",

    // Admin actions (7.21: Log all administrative functions)
    "GET /api/admin/stats": "ADMIN_VIEW_STATS",
    "GET /api/admin/competitions": "ADMIN_VIEW_COMPETITIONS",
    "POST /api/admin/competitions": "ADMIN_CREATE_COMPETITION",
    "PATCH /api/admin/competitions/:id": "ADMIN_UPDATE_COMPETITION",
    "POST /api/admin/challenges": "ADMIN_CREATE_CHALLENGE",
    "GET /api/admin/submissions": "ADMIN_VIEW_SUBMISSIONS",
    "GET /api/admin/heatmap": "ADMIN_VIEW_HEATMAP",
  };

  const key = `${method} ${cleanPath}`;
  return actionMap[key] || `${method} ${cleanPath}`;
}

/**
 * Determines the severity level of the action (7.9).
 * - CRITICAL: State-changing admin actions, security config changes
 * - WARNING: Failed attempts, suspicious activity
 * - INFO: Normal operations
 */
function getSeverity(action: string, statusCode: number): string {
  // Any failed auth/access = WARNING
  if (statusCode === 401 || statusCode === 403 || statusCode === 429) {
    return "WARNING";
  }

  // Admin state changes = CRITICAL
  if (
    action.startsWith("ADMIN_CREATE") ||
    action.startsWith("ADMIN_UPDATE") ||
    action === "CHALLENGE_UPDATE"
  ) {
    return "CRITICAL";
  }

  // Server errors = WARNING
  if (statusCode >= 500) {
    return "WARNING";
  }

  return "INFO";
}

/**
 * Extracts the real client IP address.
 * Handles reverse proxies (nginx, load balancers) that set
 * the X-Forwarded-For header.
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

/**
 * Audit logger middleware.
 *
 * Runs AFTER the response is sent (using the `finish` event)
 * so it captures the response status code without blocking
 * the user's request.
 */
export function auditLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const method = req.method.toUpperCase();

  // Only log write operations + specific security-sensitive reads
  const shouldLog =
    LOGGED_METHODS.includes(method) ||
    LOGGED_GET_PATHS.some((p) => req.path.startsWith(p));

  if (!shouldLog) {
    next();
    return;
  }

  // Capture the start time for response duration calculation
  const startTime = Date.now();

  // Listen for the response to finish, THEN log
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const userId = req.user?.id || null;
    const action = getActionName(method, req.path);
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"] || null;
    const severity = getSeverity(action, res.statusCode);

    // Build metadata object with contextual info (7.9)
    const metadata: Record<string, unknown> = {
      statusCode: res.statusCode,
      durationMs: duration,
      severity,
      outcome: res.statusCode < 400 ? "SUCCESS" : "FAILURE",
    };

    // Add request body fields for specific actions (sanitized)
    if (action === "FLAG_SUBMIT") {
      metadata.challengeId = req.body?.challengeId || null;
      // NEVER log the actual flag guess — that's sensitive (7.13)
      metadata.result = res.statusCode === 200 ? "CORRECT" : "INCORRECT";
    }

    if (action === "COMPETITION_JOIN") {
      metadata.competitionId = req.params?.id || null;
    }

    if (action === "CHALLENGE_UPDATE") {
      metadata.challengeId = req.params?.id || null;
      metadata.updatedFields = req.body ? Object.keys(req.body) : [];
    }

    // Admin action metadata (7.21)
    if (action.startsWith("ADMIN_")) {
      metadata.adminUserId = userId;
      metadata.adminAction = action;
      if (req.params?.id) {
        metadata.targetResourceId = req.params.id;
      }
    }

    // Log input validation failures (7.15)
    if (res.statusCode === 400) {
      metadata.inputValidationFailure = true;
      metadata.path = req.path;
    }

    // Log access control failures (7.17)
    if (res.statusCode === 403) {
      metadata.accessControlFailure = true;
      metadata.attemptedRole = req.user?.role || "unknown";
    }

    // Log expired/invalid token attempts (7.19)
    if (res.statusCode === 401) {
      metadata.authFailure = true;
    }

    // Fire-and-forget: don't await, don't block
    db.ctfAuditLog
      .create({
        data: {
          userId,
          action,
          method,
          path: req.path,
          ipAddress,
          userAgent,
          metadata: metadata as Prisma.InputJsonValue,
        },
      })
      .catch((err: Error) => {
        // Log failures go to console as a fallback — never crash the server
        console.error("⚠️ [Audit Logger] Failed to write log:", err.message);
      });
  });

  next();
}
