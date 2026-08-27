import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

/**
 * Middleware: Attach a unique X-Request-ID to every request and response.
 *
 * Benefits:
 * - Enables request tracing in logs without leaking sensitive context
 * - Client can correlate requests to error reports without seeing internal details
 * - Replaces the need to log file paths, DB names, or stack traces
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  // Honour an upstream proxy's request ID if present (e.g. Cloudflare, Vercel)
  const incomingId = req.headers["x-request-id"];
  const id = typeof incomingId === "string" && incomingId.length <= 64
    ? incomingId
    : uuidv4();

  // Attach to request object for use in logging
  (req as any).requestId = id;

  // Echo back in response headers for client-side correlation
  res.setHeader("X-Request-ID", id);

  next();
}
