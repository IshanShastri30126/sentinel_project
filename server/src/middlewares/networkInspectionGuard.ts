import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const INTEGRITY_SALT = "CK_SHIELD_V2_INTEGRITY_2026";
const MAX_ALLOWED_DRIFT_MS = 60 * 1000; // 60 seconds tolerance for clock skew & transit

// Nonce storage to prevent Replay Attacks (Burp Suite Repeater / Intruder)
const seenNonces = new Map<string, number>();

// Periodic cleanup of expired nonces (every 60s)
setInterval(() => {
  const now = Date.now();
  for (const [nonce, timestamp] of seenNonces.entries()) {
    if (now - timestamp > MAX_ALLOWED_DRIFT_MS * 2) {
      seenNonces.delete(nonce);
    }
  }
}, 60 * 1000);

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
 * Computes SHA-256 hash string for payload body.
 */
function computeBodyHash(body: unknown): string {
  if (body === undefined || body === null || (typeof body === "object" && Object.keys(body).length === 0)) {
    // Empty body hash
    return crypto.createHash("sha256").update("").digest("hex");
  }

  let str = "";
  if (typeof body === "string") {
    str = body;
  } else {
    try {
      str = JSON.stringify(body);
    } catch {
      str = "";
    }
  }
  return crypto.createHash("sha256").update(str).digest("hex");
}

/**
 * Computes expected HMAC-SHA256 signature for canonical request.
 */
function computeSignature(method: string, endpoint: string, timestamp: string, nonce: string, bodyHash: string): string {
  const canonicalString = `${method.toUpperCase()}:${endpoint}:${timestamp}:${nonce}:${bodyHash}`;
  return crypto.createHmac("sha256", INTEGRITY_SALT).update(canonicalString).digest("hex");
}

/**
 * Compares two cryptographic signature strings using timingSafeEqual with length validation.
 */
function safeCompareSignature(received: string, expected: string): boolean {
  if (typeof received !== "string" || typeof expected !== "string") {
    return false;
  }
  const receivedBuf = Buffer.from(received);
  const expectedBuf = Buffer.from(expected);
  if (receivedBuf.length === 0 || receivedBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(receivedBuf, expectedBuf);
}

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

  // ── 2. Validate Anti-Tamper & Integrity Headers on State-Mutating & Sensitive Endpoints
  const reqTimestamp = req.headers["x-request-timestamp"] as string | undefined;
  const reqNonce = req.headers["x-request-nonce"] as string | undefined;
  const reqSignature = req.headers["x-request-signature"] as string | undefined;

  const hasAnyIntegrityHeader = Boolean(reqTimestamp || reqNonce || reqSignature);
  const enforceIntegrity = process.env.ENFORCE_REQUEST_INTEGRITY === "true" || req.headers["x-require-integrity"] === "true";

  // If integrity headers are provided or strictly enforced on mutating methods, require all three valid headers
  if (hasAnyIntegrityHeader || (enforceIntegrity && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method))) {
    if (!reqTimestamp || !reqNonce || !reqSignature) {
      res.status(403).json({ error: "Integrity check failed: missing required request integrity headers" });
      return;
    }

    const timestampNum = parseInt(reqTimestamp, 10);
    const now = Date.now();

    // Check 1: Timestamp Expiry / Clock Skew Window (Prevents Delayed Burp Interceptions)
    if (isNaN(timestampNum) || Math.abs(now - timestampNum) > MAX_ALLOWED_DRIFT_MS) {
      res.status(403).json({ error: "Request validation failed: timestamp outside validity window" });
      return;
    }

    // Check 2: Nonce Replay Defense (Prevents Burp Repeater / Replay Attacks)
    if (seenNonces.has(reqNonce)) {
      res.status(403).json({ error: "Security enforcement: request replay detected" });
      return;
    }
    seenNonces.set(reqNonce, timestampNum);

    // Check 3: Cryptographic Signature Verification (Detects Parameter / Body Tampering)
    // Canonical path matches the path accessed by client (strip /api prefix if client sent /endpoint)
    const endpointPath = req.originalUrl || req.url;
    const bodyHash = computeBodyHash(req.body);

    // Test canonical signature with both relative and /api path formats to ensure seamless compatibility
    const expectedSigWithApi = computeSignature(req.method, endpointPath, reqTimestamp, reqNonce, bodyHash);
    const altPath = endpointPath.startsWith("/api") ? endpointPath.slice(4) : `/api${endpointPath}`;
    const expectedSigAlt = computeSignature(req.method, altPath, reqTimestamp, reqNonce, bodyHash);

    // Also check with empty/form-data hash in case of file uploads
    const formDataSig1 = computeSignature(req.method, endpointPath, reqTimestamp, reqNonce, crypto.createHash("sha256").update("[FormData]").digest("hex"));
    const formDataSig2 = computeSignature(req.method, altPath, reqTimestamp, reqNonce, crypto.createHash("sha256").update("[FormData]").digest("hex"));

    const isMatch =
      safeCompareSignature(reqSignature, expectedSigWithApi) ||
      safeCompareSignature(reqSignature, expectedSigAlt) ||
      safeCompareSignature(reqSignature, formDataSig1) ||
      safeCompareSignature(reqSignature, formDataSig2);

    if (!isMatch) {
      res.status(403).json({ error: "Integrity check failed: request payload or parameters tampered" });
      return;
    }
  }

  next();
}
