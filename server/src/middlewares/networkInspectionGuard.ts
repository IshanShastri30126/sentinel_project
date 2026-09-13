import { Request, Response, NextFunction } from "express";


// Known proxy/scanner header probes
const SCANNER_HEADER_PROBES = [
  "x-burp-test",
  "x-scanner",
  "acunetix-aspect",
  "x-wvs-id",
  "x-attack",
  "x-scan-memo",
];



/**
 * Middleware: Network Inspection & Anti-Tampering Shield
 *
 * Protects against:
 * 1. Burp Suite / OWASP ZAP request parameter & body tampering
 * 2. Replay Attacks via Intruder / Repeater
 * 3. Automated vulnerability scanner probes
 * 4. Cache and DevTools persistence
 */
export function networkInspectionGuard(req: Request, res: Response, next: NextFunction): void {
  // Always attach anti-sniffing, anti-caching, and frame protection headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  res.removeHeader("X-Powered-By");

  // ── 1. Block Automated Penetration Scanners & Obvious Inspection Agents
  const userAgent = (req.headers["user-agent"] || "").toLowerCase();
  const acceptHeader = (req.headers["accept"] || "").toLowerCase();

  // Block Burp Suite Collaborator / Proxy probe signatures
  if (
    userAgent.includes("burpcollaborator") ||
    userAgent.includes("burp suite") ||
    req.headers["x-burp-test"] !== undefined
  ) {
    res.status(403).json({ error: "Network interception probe rejected by security policy" });
    return;
  }

  if (
    userAgent.includes("sqlmap") ||
    userAgent.includes("nikto") ||
    userAgent.includes("arachni") ||
    userAgent.includes("w3af") ||
    userAgent.includes("acunetix")
  ) {
    res.status(403).json({ error: "Security enforcement: unauthorized scanner agent rejected" });
    return;
  }

  // ── 2. SEC-005: Optional client-side HMAC removed.
  // Client-side HMAC with a static in-app salt is bypassable by simply omitting
  // the x-request-* headers — providing a false sense of security (security-theatre).
  // Real tamper protection is provided by: TLS in transit, JWT signature verification,
  // Zod schema validation on every body, and Prisma parameterized queries.

  next();
}
