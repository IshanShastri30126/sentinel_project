import { Request } from "express";
import prisma from "./prisma";

export interface AuditLogOptions {
  action: string;
  userId?: string | null;
  outcome?: "SUCCESS" | "FAILED" | "REJECTED";
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
    if (req.headers["x-local-ip"] && typeof req.headers["x-local-ip"] === "string") {
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

    const details = parseUserAgentDetails(userAgent, req);

    // Sanitize context: Remove password, tokens, credentials
    const sanitizedContext: Record<string, any> = {
      ...context,
      browser: context.browser || details.browser,
      os: context.os || details.os,
      device: context.device || details.device,
      deviceId: context.deviceId || details.deviceId || context.deviceFingerprint,
      localIp: context.localIp || details.localIp,
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
    console.error("[AuditLogger] Failed to write audit log:", err);
  }
}

