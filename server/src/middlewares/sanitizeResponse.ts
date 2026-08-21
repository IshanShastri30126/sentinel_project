import { Request, Response, NextFunction } from "express";

/**
 * Middleware: Sanitize API Responses
 *
 * Applied to all /api/* routes. Ensures:
 * 1. No sensitive data is ever cached by the browser or intermediary proxies
 * 2. Response ETags and Last-Modified headers are stripped (they leak data shape)
 * 3. Error responses never contain stack traces, file paths, or DB internals
 *
 * The Cache-Control: no-store header is the key defence against the DevTools
 * Network tab persisting API responses — it forces the browser to discard
 * response data after it has been consumed.
 */
export function sanitizeApiResponse(req: Request, res: Response, next: NextFunction): void {
  // Hook into res.json to sanitize all JSON error responses
  const originalJson = res.json.bind(res);

  res.json = function (body: unknown) {
    // ── Cache-Control: prevent browser/proxy caching of API responses ──────
    if (!res.headersSent) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      // Strip ETag and Last-Modified — they leak response structure/content hashes
      res.removeHeader("ETag");
      res.removeHeader("Last-Modified");
    }

    // ── Strip internal error details from 4xx/5xx responses ────────────────
    if (res.statusCode >= 400 && body && typeof body === "object") {
      const sanitized = sanitizeErrorBody(body as Record<string, unknown>);
      return originalJson(sanitized);
    }

    return originalJson(body);
  };

  next();
}

/**
 * Remove fields that leak internal implementation details from error responses.
 * Fields removed: stack, stacktrace, trace, code (DB error codes), detail,
 * query, hint, where, schema, table, column, constraint, file, line, routine.
 */
function sanitizeErrorBody(body: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE_FIELDS = new Set([
    "stack", "stacktrace", "trace", "stackTrace",
    // Prisma / PostgreSQL error fields
    "code", "meta", "detail", "query", "hint",
    "where", "schema", "table", "column", "constraint",
    "file", "line", "routine",
    // Generic internals
    "path", "internalMessage", "cause",
  ]);

  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (SENSITIVE_FIELDS.has(key)) continue;

    // Recursively clean nested objects (e.g. Zod validation errors array)
    if (value && typeof value === "object" && !Array.isArray(value)) {
      cleaned[key] = sanitizeErrorBody(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map((item) =>
        typeof item === "object" && item !== null
          ? sanitizeErrorBody(item as Record<string, unknown>)
          : item
      );
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}
