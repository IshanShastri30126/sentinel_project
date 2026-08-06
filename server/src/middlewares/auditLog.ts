import { Request, Response, NextFunction } from "express";
import { logAuditEvent } from "../lib/auditLogger";

export function auditLog(action: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on("finish", async () => {
      try {
        const outcome = res.statusCode < 400 ? "SUCCESS" : "FAILED";
        await logAuditEvent({
          action,
          userId: req.user?.userId || null,
          outcome,
          context: {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
          },
          req,
        });
      } catch (err) {
        console.error("[AuditLog Middleware] Error:", err);
      }
    });
    next();
  };
}
