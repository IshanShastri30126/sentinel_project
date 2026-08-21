import { Request, Response, NextFunction } from "express";

/**
 * Middleware: WAF-lite — Suspicious Payload Detection
 *
 * Scans all incoming request bodies, query params, URL paths, and headers
 * for common attack patterns. Rejects with a generic 400 without revealing
 * which pattern was matched (prevents attacker feedback loops).
 *
 * Patterns detected:
 * - Path traversal:    ../  ..\  %2e%2e  %252e
 * - XSS probes:        <script, javascript:, onerror=, onload=, vbscript:
 * - SQLi probes:       ' OR 1=1, UNION SELECT, DROP TABLE, INSERT INTO,
 *                      DELETE FROM, --,  xp_cmdshell, EXEC(
 * - Null bytes:        %00, \x00
 * - SSRF/Open redirect: http://169.254 (AWS metadata), file://
 * - NoSQLi:            $where, $gt, $ne (MongoDB operator injection)
 */

// ─── Pattern Registry ───────────────────────────────────────────────────────

const ATTACK_PATTERNS: RegExp[] = [
  // Path traversal
  /\.\.[/\\]/,
  /%2e%2e[/\\%]/i,
  /%252e%252e/i,

  // Null bytes
  /\x00|%00/,

  // XSS probes
  /<script[\s>]/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /on(?:error|load|click|mouseover|focus|blur|input|change|submit|reset|keydown|keyup|keypress|dblclick|contextmenu)\s*=/i,
  /data\s*:\s*text\/html/i,

  // SQL injection
  /'\s*(?:or|and)\s+['"\d]/i,
  /union\s+(?:all\s+)?select/i,
  /(?:drop|truncate|delete\s+from|insert\s+into|update\s+\w+\s+set)\s+\w/i,
  /exec\s*\(/i,
  /xp_cmdshell/i,
  /(?:--|#)\s*$/m,
  /\/\*.*\*\//,

  // NoSQL injection (MongoDB)
  /\$(?:where|gt|lt|ne|gte|lte|in|nin|regex|exists|type|mod|all|size|elemMatch)\b/,

  // SSRF / AWS metadata endpoint
  /169\.254\.169\.254/,
  /file:\/\//i,
];

// ─── Scanner ────────────────────────────────────────────────────────────────

function isMalicious(value: unknown, depth = 0): boolean {
  // Prevent deeply nested object DoS
  if (depth > 10) return false;

  if (typeof value === "string") {
    // Decode common URL encodings before scanning
    let decoded = value;
    try { decoded = decodeURIComponent(value); } catch { /* leave as-is */ }

    return ATTACK_PATTERNS.some((pattern) => pattern.test(decoded) || pattern.test(value));
  }

  if (Array.isArray(value)) {
    return value.some((item) => isMalicious(item, depth + 1));
  }

  if (value !== null && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((v) => isMalicious(v, depth + 1));
  }

  return false;
}

// ─── Middleware ──────────────────────────────────────────────────────────────

export function suspiciousPayload(req: Request, res: Response, next: NextFunction): void {
  // Scan URL path
  if (isMalicious(req.path)) {
    res.status(400).json({ error: "Bad Request" });
    return;
  }

  // Scan query string parameters
  if (isMalicious(req.query)) {
    res.status(400).json({ error: "Bad Request" });
    return;
  }

  // Scan request body (only if already parsed by express.json)
  if (req.body && isMalicious(req.body)) {
    res.status(400).json({ error: "Bad Request" });
    return;
  }

  // Scan selected headers that users can control
  const controllableHeaders = ["x-forwarded-for", "referer", "user-agent", "x-club-slug"];
  for (const header of controllableHeaders) {
    if (isMalicious(req.headers[header])) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }
  }

  next();
}
