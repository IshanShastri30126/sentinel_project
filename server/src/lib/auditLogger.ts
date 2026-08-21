import { Request } from "express";
import prisma from "./prisma";

export type AuditSeverity = "INFO" | "WARN" | "CRITICAL" | "EMERGENCY" | "SECURITY_BLOCK";
export type AuditCategory = "AUTH" | "FIREWALL" | "WAF" | "DATABASE" | "USER_OPS" | "SYSTEM" | "NETWORK";

export interface AuditLogOptions {
  action: string;
  userId?: string | null;
  outcome?: "SUCCESS" | "FAILED" | "REJECTED";
  severity?: AuditSeverity;
  category?: AuditCategory;
  ruleId?: string;
  context?: Record<string, unknown>;
  req?: Request;
}

export function parseUserAgentDetails(uaString?: string | null, req?: Request) {
  const ua = uaString || "";

  // 1. Browser parsing
  let browser = "Unknown Browser";
  if (/edg\/([0-9.]+)/i.test(ua)) {
    const match = ua.match(/edg\/([0-9.]+)/i);
    browser = `Edge ${match ? match[1].split(".")[0] : ""}`.trim();
  } else if (/opr\/([0-9.]+)/i.test(ua) || /opera/i.test(ua)) {
    const match = ua.match(/opr\/([0-9.]+)/i);
    browser = `Opera ${match ? match[1].split(".")[0] : ""}`.trim();
  } else if (/chrome\/([0-9.]+)/i.test(ua)) {
    const match = ua.match(/chrome\/([0-9.]+)/i);
    browser = `Chrome ${match ? match[1].split(".")[0] : ""}`.trim();
  } else if (/firefox\/([0-9.]+)/i.test(ua)) {
    const match = ua.match(/firefox\/([0-9.]+)/i);
    browser = `Firefox ${match ? match[1].split(".")[0] : ""}`.trim();
  } else if (/version\/([0-9.]+).*safari/i.test(ua)) {
    const match = ua.match(/version\/([0-9.]+)/i);
    browser = `Safari ${match ? match[1].split(".")[0] : ""}`.trim();
  } else if (/safari/i.test(ua)) {
    browser = "Safari";
  } else if (ua) {
    browser = ua.split(" ")[0] || "Standard Client";
  }

  // 2. OS parsing
  let os = "Unknown OS";
  if (/windows nt 10/i.test(ua)) {
    os = "Windows 10/11";
  } else if (/windows nt 6.3/i.test(ua)) {
    os = "Windows 8.1";
  } else if (/windows nt 6.1/i.test(ua)) {
    os = "Windows 7";
  } else if (/windows/i.test(ua)) {
    os = "Windows OS";
  } else if (/mac os x ([0-9_]+)/i.test(ua)) {
    const match = ua.match(/mac os x ([0-9_]+)/i);
    os = `macOS ${match ? match[1].replace(/_/g, ".") : ""}`.trim();
  } else if (/macintosh/i.test(ua)) {
    os = "macOS";
  } else if (/android ([0-9.]+)/i.test(ua)) {
    const match = ua.match(/android ([0-9.]+)/i);
    os = `Android ${match ? match[1] : ""}`.trim();
  } else if (/iphone os ([0-9_]+)/i.test(ua) || /ipad/i.test(ua)) {
    const match = ua.match(/iphone os ([0-9_]+)/i);
    os = `iOS ${match ? match[1].replace(/_/g, ".") : ""}`.trim();
  } else if (/linux/i.test(ua)) {
    os = "Linux OS";
  }

  // 3. Device parsing
  let device = "Desktop";
  if (/ipad|tablet/i.test(ua)) {
    device = `Tablet (${os})`;
  } else if (/mobile|iphone|ipod|android/i.test(ua)) {
    device = `Mobile (${os})`;
  } else if (os !== "Unknown OS") {
    device = `Desktop (${os})`;
  }

  // 4. Network IPs & Device Fingerprint
  let publicIp = "127.0.0.1";
  let localIp = "192.168.1.100";
  let deviceId = "DEV_SYSTEM";

  if (req) {
    const forwarded = req.headers["x-forwarded-for"];
    publicIp = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.ip || req.socket.remoteAddress || "127.0.0.1";
    
    // Capture private/LAN IP from client headers
    if (req.headers["x-private-ip"] && typeof req.headers["x-private-ip"] === "string") {
      localIp = req.headers["x-private-ip"];
    } else if (req.headers["x-local-ip"] && typeof req.headers["x-local-ip"] === "string") {
      localIp = req.headers["x-local-ip"];
    }

    if (req.headers["x-device-fingerprint"] && typeof req.headers["x-device-fingerprint"] === "string") {
      deviceId = req.headers["x-device-fingerprint"];
    } else if (req.headers["x-device-id"] && typeof req.headers["x-device-id"] === "string") {
      deviceId = req.headers["x-device-id"];
    } else if ((req as any).user?.deviceFingerprint) {
      deviceId = (req as any).user.deviceFingerprint;
    }
  }

  return { browser, os, device, publicIp, localIp, deviceId };
}

/**
 * Automatically infers Level 2 severity from action and outcome
 */
function inferSeverity(action: string, outcome: string): AuditSeverity {
  const upperAction = action.toUpperCase();
  if (upperAction.includes("BLOCK") || upperAction.includes("BAN") || upperAction.includes("ATTACK") || upperAction.includes("WAF_")) {
    return "SECURITY_BLOCK";
  }
  if (upperAction.includes("MAINTENANCE_MODE") || upperAction.includes("ROLE_ESCALATION") || upperAction.includes("UNAUTHORIZED")) {
    return "EMERGENCY";
  }
  if (outcome === "REJECTED" || upperAction.includes("FAILED") || upperAction.includes("DENIED") || upperAction.includes("SUSPICIOUS")) {
    return "CRITICAL";
  }
  if (upperAction.includes("WARN") || upperAction.includes("BUG_") || outcome === "FAILED") {
    return "WARN";
  }
  return "INFO";
}

/**
 * Automatically infers Level 2 Category
 */
function inferCategory(action: string): AuditCategory {
  const upper = action.toUpperCase();
  if (upper.includes("FIREWALL") || upper.includes("IP_BLOCK") || upper.includes("IP_UNBLOCK")) return "FIREWALL";
  if (upper.includes("WAF") || upper.includes("SQLI") || upper.includes("XSS") || upper.includes("PAYLOAD")) return "WAF";
  if (upper.includes("LOGIN") || upper.includes("AUTH") || upper.includes("REGISTER") || upper.includes("PASSWORD") || upper.includes("LOGOUT")) return "AUTH";
  if (upper.includes("DATABASE") || upper.includes("MIGRATION") || upper.includes("PRISMA")) return "DATABASE";
  if (upper.includes("NETWORK") || upper.includes("SOCKET") || upper.includes("RATE_LIMIT")) return "NETWORK";
  if (upper.includes("MAINTENANCE") || upper.includes("SETTING") || upper.includes("SYSTEM")) return "SYSTEM";
  return "USER_OPS";
}

/**
 * Centralized, Level 2 Enterprise Audit Logger.
 * Records User ID, Timestamp (UTC), Public IP, Private/LAN IP, Device Fingerprint, Severity, Category, Action, Outcome, and Context.
 */
export async function logAuditEvent(options: AuditLogOptions): Promise<void> {
  try {
    const { action, userId, outcome = "SUCCESS", severity, category, ruleId, context = {}, req } = options;

    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (req) {
      const forwarded = req.headers["x-forwarded-for"];
      ipAddress = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.ip || req.socket.remoteAddress;
      userAgent = req.headers["user-agent"];
    }

    const details = parseUserAgentDetails(userAgent, req);
    const computedSeverity = severity || inferSeverity(action, outcome);
    const computedCategory = category || inferCategory(action);

    // Sanitize context: Remove passwords, tokens, credentials
    const sanitizedContext: Record<string, any> = {
      ...context,
      severity: computedSeverity,
      category: computedCategory,
      ruleId: ruleId || context.ruleId,
      browser: context.browser || details.browser,
      os: context.os || details.os,
      device: context.device || details.device,
      deviceId: context.deviceId || details.deviceId || context.deviceFingerprint,
      localIp: context.localIp || details.localIp,
      privateIp: context.privateIp || details.localIp,
      publicIp: context.publicIp || details.publicIp || ipAddress || "127.0.0.1",
    };

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
        ipAddress: ipAddress || details.publicIp || null,
        userAgent: userAgent || null,
        userId: userId || null,
        context: sanitizedContext as any,
      },
    });
  } catch (err) {
    console.error("[AuditLogger Level 2] Failed to write audit log:", err);
  }
}
