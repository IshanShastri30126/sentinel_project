import { Request, Response, NextFunction } from "express";
import { FirewallPolicyManager } from "../lib/firewallRules";
import { logAuditEvent } from "../lib/auditLogger";

/**
 * Middleware: Level 2 Dynamic WAF & Firewall Policy Enforcement
 *
 * 1. Checks Public IP Ban List.
 * 2. Scans Request Paths, Query Params, Bodies, and Headers against Level 2 Threat Patterns.
 * 3. Evaluates custom dynamic firewall rules.
 * 4. Logs forensic audit events with SECURITY_BLOCK severity.
 */

// ─── Core Pattern Registry ───────────────────────────────────────────────────

const ATTACK_PATTERNS: Array<{ id: string; category: string; regex: RegExp }> = [
  // Path traversal
  { id: "FW-RULE-003", category: "PATH_TRAVERSAL", regex: /\.\.[/\\]|%2e%2e[/\\%]|%252e%252e/i },
  // Null bytes
  { id: "FW-RULE-003", category: "PATH_TRAVERSAL", regex: /\x00|%00/ },
  // XSS probes
  { id: "FW-RULE-002", category: "XSS", regex: /<script[\s>]|javascript\s*:|vbscript\s*:|on(?:error|load|click|mouseover|focus|blur|input|change|submit|reset|keydown|keyup|keypress|dblclick|contextmenu)\s*=|data\s*:\s*text\/html/i },
  // SQL injection
  { id: "FW-RULE-001", category: "SQLI", regex: /'\s*(?:or|and)\s+['"\d]|union\s+(?:all\s+)?select|(?:drop|truncate|delete\s+from|insert\s+into|update\s+\w+\s+set)\s+\w|exec\s*\(|xp_cmdshell|(?:\/\*.*\*\/)/i },
  // NoSQL injection (MongoDB)
  { id: "FW-RULE-007", category: "SQLI", regex: /\$(?:where|gt|lt|ne|gte|lte|in|nin|regex|exists|type|mod|all|size|elemMatch)\b/ },
  // OS Command Injection
  { id: "FW-RULE-008", category: "COMMAND_INJECTION", regex: /;\s*(?:cat|ls|dir|whoami|id|uname|curl|wget|bash|sh|nc|powershell|cmd)\b|\|\s*(?:cat|whoami|bash|powershell)|\$\([^)]+\)|`[^`]+`/i },
  // Prototype Pollution
  { id: "FW-RULE-009", category: "PROTOTYPE_POLLUTION", regex: /__proto__|constructor\s*\.\s*prototype/i },
  // XXE (XML External Entity)
  { id: "FW-RULE-010", category: "XXE", regex: /<!DOCTYPE[^>]*SYSTEM|<!ENTITY[^>]*SYSTEM/i },
  // CRLF Injection / HTTP Response Splitting
  { id: "FW-RULE-011", category: "CRLF_INJECTION", regex: /(?:\r\n|%0d%0a)(?:Set-Cookie|Location|Content-Type):/i },
  // SSRF / AWS metadata / Internal Protocols
  { id: "FW-RULE-005", category: "DOS", regex: /169\.254\.169\.254|metadata\.google\.internal|file:\/\/|gopher:\/\/|dict:\/\//i },
  // Attack tools / Scanners
  { id: "FW-RULE-006", category: "BAD_BOT", regex: /sqlmap|nikto|dirbuster|gobuster|nmap|masscan|wpscan|hydra|acunetix/i },
];

function checkValueMalicious(value: unknown, depth = 0): { malicious: boolean; ruleId?: string; category?: string } {
  if (depth > 10) return { malicious: false };

  if (typeof value === "string") {
    let decoded = value;
    try { decoded = decodeURIComponent(value); } catch {}

    for (const rule of ATTACK_PATTERNS) {
      if (rule.regex.test(decoded) || rule.regex.test(value)) {
        return { malicious: true, ruleId: rule.id, category: rule.category };
      }
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const res = checkValueMalicious(item, depth + 1);
      if (res.malicious) return res;
    }
  }

  if (value !== null && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      const res = checkValueMalicious(v, depth + 1);
      if (res.malicious) return res;
    }
  }

  return { malicious: false };
}

// ─── Middleware Execution ────────────────────────────────────────────────────

export async function suspiciousPayload(req: Request, res: Response, next: NextFunction): Promise<void> {
  const forwarded = req.headers["x-forwarded-for"];
  const publicIp = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.ip || req.socket.remoteAddress || "127.0.0.1";

  // 1. Check Public Network IP Blacklist
  try {
    const isBlocked = await FirewallPolicyManager.isPublicIpBlocked(publicIp);
    if (isBlocked) {
      logAuditEvent({
        action: "FIREWALL_BLOCKED_IP_REJECTED",
        outcome: "REJECTED",
        severity: "SECURITY_BLOCK",
        category: "FIREWALL",
        ruleId: "FW-RULE-004",
        context: {
          publicIp,
          path: req.path,
          method: req.method,
          reason: "Public Network IP is blocked in Firewall Policy",
        },
        req,
      }).catch(() => {});

      res.status(403).json({ error: "Access Denied: Your IP address is blocked by security policy." });
      return;
    }
  } catch {}

  // 2. Scan Path, Query, Body, Headers
  let violation = checkValueMalicious(req.path);
  if (!violation.malicious) violation = checkValueMalicious(req.query);
  if (!violation.malicious && req.body) violation = checkValueMalicious(req.body);

  if (!violation.malicious) {
    const checkHeaders = ["user-agent", "x-forwarded-for", "referer", "x-club-slug"];
    for (const h of checkHeaders) {
      if (req.headers[h]) {
        violation = checkValueMalicious(req.headers[h]);
        if (violation.malicious) break;
      }
    }
  }

  if (violation.malicious) {
    if (violation.ruleId) {
      FirewallPolicyManager.recordHit(violation.ruleId);
    }

    logAuditEvent({
      action: "WAF_ATTACK_BLOCKED",
      outcome: "REJECTED",
      severity: "SECURITY_BLOCK",
      category: "WAF",
      ruleId: violation.ruleId || "FW-RULE-WAF",
      context: {
        publicIp,
        path: req.path,
        method: req.method,
        category: violation.category,
        ruleId: violation.ruleId,
      },
      req,
    }).catch(() => {});

    res.status(400).json({ error: "Bad Request" });
    return;
  }

  next();
}
