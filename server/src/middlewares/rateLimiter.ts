import rateLimit from "express-rate-limit";

/**
 * Targeted Rate Limiters for Critical Operations Only
 *
 * Basic requests (browsing events, loading dashboards, checking login status,
 * fetching user profiles, reading analytics) are NOT rate-limited to ensure
 * smooth, uninterrupted user experience and developer workflows.
 *
 * Rate limiting is strictly applied only to sensitive/critical operations:
 * - Login attempts (anti-brute-force)
 * - Registration/Signup (anti-account-creation-spam)
 * - Email operations: Password reset, verification, broadcast (anti-email-bombing)
 * - Event Registration (anti-sniping/race-condition abuse)
 * - Team Creation (anti-spam)
 */

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 login submissions per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: { error: "Too many login attempts from this IP. Please try again after 15 minutes." },
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 account registrations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: { error: "Too many account registrations from this IP. Please try again later." },
});

export const mailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 email triggers per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: { error: "Email request limit reached. Please try again after 15 minutes." },
});

export const eventRegistrationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 25, // 25 event registrations per 10 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: { error: "Too many event registrations. Please wait a moment before trying again." },
});

export const teamCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 team creation operations per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: { error: "Too many team creation requests. Please try again after 15 minutes." },
});
