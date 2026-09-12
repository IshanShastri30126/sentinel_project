// Created: 2026-08-07 | Modified: 2026-08-14 — Added null-byte, path-traversal, and dangerous pattern blocking

import { Request, Response, NextFunction } from "express";

// ─────────────────────────────────────────────────────────────
// INPUT SANITIZER (Review Points #4, Test Cases 1.15, 1.16)
// ─────────────────────────────────────────────────────────────
//
// Defenses:
// 1. Strip HTML tags → Prevents Stored XSS (1.15)
// 2. Remove null bytes → Prevents null-byte injection (1.16)
// 3. Block path-traversal sequences → Prevents directory traversal (1.16)
// 4. Trim whitespace → Prevents accidental mismatches
// 5. Validate ASCII in headers → (Test case 1.9)
// ─────────────────────────────────────────────────────────────

/**
 * Strips HTML tags from a string.
 * Turns "<script>alert('xss')</script>" into "alert('xss')"
 */
function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Removes null bytes and path-traversal sequences from a string.
 * These are common injection vectors:
 * - %00 / \0 → null byte injection
 * - ../ or ..\ → directory traversal
 * - %0d, %0a → CRLF injection (HTTP header splitting)
 */
function removeHazardousPatterns(input: string): string {
  return input
    .replace(/\0/g, "")                // Null bytes
    .replace(/%00/gi, "")              // URL-encoded null bytes
    .replace(/%0d/gi, "")              // Carriage return
    .replace(/%0a/gi, "")              // Line feed
    .replace(/\r\n/g, " ")            // CRLF → space
    .replace(/\r/g, " ")              // CR → space
    .replace(/\n/g, " ")              // LF → space
    .replace(/\.\.\//g, "")           // Path traversal (unix)
    .replace(/\.\.\\/g, "");          // Path traversal (windows)
}

/**
 * Recursively sanitize all string values in an object or array.
 * Handles nested objects and arrays of any depth.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return removeHazardousPatterns(stripHtmlTags(value)).trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }

  // Numbers, booleans, null — pass through unchanged
  return value;
}

/**
 * Global input sanitizer middleware.
 * Sanitizes req.body, req.query, and req.params.
 *
 * This runs BEFORE any route handler processes the request body.
 * Defense-in-depth: even though Prisma uses parameterized queries,
 * we still sanitize all inputs as an extra layer.
 */
export function inputSanitizer(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // ── Check for non-ASCII in critical headers (Test case 1.9) ──
  const suspiciousHeaders = ["host", "referer", "origin"];
  for (const header of suspiciousHeaders) {
    const val = req.headers[header];
    if (typeof val === "string" && /[^\x20-\x7E]/.test(val)) {
      res.status(400).json({
        success: false,
        message: "Invalid characters in request header.",
      });
      return;
    }
  }

  // Sanitize request body (POST/PATCH/PUT data)
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }

  // Sanitize query parameters (?key=value)
  if (req.query && typeof req.query === "object") {
    for (const [key, val] of Object.entries(req.query)) {
      if (typeof val === "string") {
        (req.query as Record<string, unknown>)[key] = removeHazardousPatterns(
          stripHtmlTags(val)
        ).trim();
      }
    }
  }

  // Sanitize URL parameters (/:id)
  if (req.params && typeof req.params === "object") {
    for (const [key, val] of Object.entries(req.params)) {
      if (typeof val === "string") {
        req.params[key] = removeHazardousPatterns(stripHtmlTags(val)).trim();
      }
    }
  }

  next();
}
