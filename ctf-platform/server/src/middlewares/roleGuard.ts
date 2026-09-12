// Created: 2026-08-02 | Modified: Initial creation — Role-based access control middleware

import { Request, Response, NextFunction } from "express";

// ─── Role Guard Middleware Factory ──────────────────────────
// This is a "Higher-Order Function" — a function that RETURNS
// another function. We use this pattern so we can configure
// WHICH roles are allowed per route.
//
// Usage:
//   roleGuard(["SUPER_ADMIN", "ADMIN"])    → Only admins
//   roleGuard(["STUDENT", "MEMBER"])       → Only participants
//   roleGuard(["SUPER_ADMIN", "ADMIN", "FACULTY"]) → Admins + Question Setters
//
// This middleware MUST run AFTER authMiddleware, because it
// reads `req.user.role` which auth.ts sets.
// ─────────────────────────────────────────────────────────────

export function roleGuard(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // If auth middleware didn't attach a user, reject immediately.
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated.",
      });
      return;
    }

    // Check if the user's role is in the allowed list.
    // Array.includes() is O(n) but our role array has max 4 items,
    // so performance is not a concern here.
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${req.user.role}.`,
      });
      return;
    }

    // Role is valid — let the request continue.
    next();
  };
}
