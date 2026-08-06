import { Request } from "express";
import prisma from "./prisma";

export interface AuditLogOptions {
  action: string;
  userId?: string | null;
  outcome?: "SUCCESS" | "FAILED" | "REJECTED";
  context?: Record<string, unknown>;
  req?: Request;
}

/**
 * Centralized, secure Audit Logger.
 * Records User ID, Timestamp (UTC), IP Address, User-Agent, Action, Outcome, and Context.
 * Ensures logs are sanitized and stripped of sensitive payloads (passwords, tokens).
 */
export async function logAuditEvent(options: AuditLogOptions): Promise<void> {
  try {
    const { action, userId, outcome = "SUCCESS", context = {}, req } = options;

    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (req) {
      const forwarded = req.headers["x-forwarded-for"];
      ipAddress = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.ip || req.socket.remoteAddress;
      userAgent = req.headers["user-agent"];
    }

    // Sanitize context: Remove password, tokens, credentials
    const sanitizedContext = { ...context };
    delete sanitizedContext.password;
    delete sanitizedContext.newPassword;
    delete sanitizedContext.token;
    delete sanitizedContext.credential;
    delete sanitizedContext.refreshToken;
    delete sanitizedContext.accessToken;

    await prisma.auditLog.create({
      data: {
        action,
        outcome,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        userId: userId || null,
        context: sanitizedContext as any,
      },
    });
  } catch (err) {
    console.error("[AuditLogger] Failed to write audit log:", err);
  }
}
