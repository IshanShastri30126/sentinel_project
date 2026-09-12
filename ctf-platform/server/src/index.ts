// Created: 2026-08-02 | Modified: 2026-08-14 — Full 67-page security compliance hardening

import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";
import redis from "./lib/ctfRedis";

// ─── Security Middleware Imports ────────────────────────────
import { globalLimiter, submissionLimiter } from "./middlewares/security";
import { auditLogger } from "./middlewares/auditLogger";
import { inputSanitizer } from "./middlewares/sanitizer";

// ─── Environment Variables ──────────────────────────────────
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3001";

// ─── Express App Setup ──────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Remove X-Powered-By header (Test case 10.12) ───────────
// Prevents attackers from fingerprinting the server framework.
app.disable("x-powered-by");

// ─── Response Compression (Test case 9.7, Review Point #7) ──
// gzip/brotli compression for all responses (reduces bandwidth ~70%)
app.use(compression());

// ─── Security Headers (Review Point #4, Test cases 10.12) ───
// Helmet sets ~15 HTTP headers that protect against common attacks.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: [
          "'self'",
          CLIENT_URL,
          CLIENT_URL.replace("http", "ws"), // WebSocket for Socket.io
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],       // Prevent base tag injection
        formAction: ["'self'"],    // Prevent form hijacking
      },
    },
    crossOriginEmbedderPolicy: false, // Allow Socket.io to work
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }, // (9.8)
  })
);

// ─── Cache-Control for API responses (Test case 8.10) ────────
// Prevent browsers from caching sensitive API responses.
app.use("/api", (_req: Request, res: Response, next: NextFunction) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// ─── HTTP Method Restriction (Test cases 10.9, 10.10) ────────
// Only allow methods that our API actually uses. Block everything
// else (PUT, HEAD, OPTIONS handled by CORS, TRACE, TRACK, etc.)
app.use((req: Request, res: Response, next: NextFunction) => {
  const allowed = ["GET", "POST", "PATCH", "DELETE", "OPTIONS"];
  if (!allowed.includes(req.method.toUpperCase())) {
    res.status(405).json({
      success: false,
      message: `HTTP method ${req.method} is not allowed.`,
    });
    return;
  }
  next();
});

// ─── CORS (Strict Origin) ───────────────────────────────────
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true, // Allow cookies to be sent cross-origin
    methods: ["GET", "POST", "PATCH", "DELETE"], // No PUT, HEAD, OPTIONS abuse
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Core Middleware ────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: "1mb" })); // Reduced from 10mb (Review Point #7)

// ─── Reverse Proxy Trust (Review Point #6) ──────────────────
// If behind nginx/Cloudflare, trust the X-Forwarded-For header
// so we get the real client IP instead of the proxy's IP.
app.set("trust proxy", 1);

// ─── Security Pipeline (Review Points #4, #6, #7) ──────────
// Order matters! These run in sequence on every request:
// 1. Rate limiter → Block abusive IPs before any processing
// 2. Sanitizer → Clean inputs before any route handler reads them
// 3. Audit logger → Log the action after the response is sent
app.use(globalLimiter);
app.use(inputSanitizer);
app.use(auditLogger);

// ─── Socket.io Setup (CTF Namespace) ────────────────────────
// Isolated /ctf namespace so CTF WebSocket events don't interfere
// with any other WebSocket traffic.
// ─────────────────────────────────────────────────────────────
const io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

import { setupScoreboardSockets } from "./sockets/scoreboard";

const ctfNamespace = io.of("/ctf");

// Attach all CTF real-time event handlers
setupScoreboardSockets(ctfNamespace);

// ─── API Routes ─────────────────────────────────────────────
// Each route file is an Express Router. We mount them here
// at their base paths. The middleware chain (auth → roleGuard)
// runs inside each router, NOT globally.
// ─────────────────────────────────────────────────────────────
import competitionRoutes from "./routes/competitions";
import challengeRoutes from "./routes/challenges";
import submissionRoutes from "./routes/submissions";
import leaderboardRoutes from "./routes/leaderboard";
import myScoresRoutes from "./routes/myScores";
import adminRoutes from "./routes/admin";

app.use("/api/competitions", competitionRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/my-scores", myScoresRoutes);
app.use("/api/admin", adminRoutes);
// Submission route gets an EXTRA rate limiter (anti brute-force)
app.use("/api/submissions", submissionLimiter, submissionRoutes);

// ─── Health Check Route ─────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ctf-wars-server",
    timestamp: new Date().toISOString(),
  });
});

// ─── OAuth Auth Routes (SSO with Chakravyuh) ────────────────
import authRoutes from "./routes/auth";
app.use("/api/auth", authRoutes);

// ─── Global Error Handler (Test cases 7.1-7.3, 10.5) ────────
// Catches unhandled errors so they don't leak stack traces.
// Returns a generic message to the client per test case 7.1.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ [Server] Unhandled error:", err.message);
  res.status(500).json({
    success: false,
    message: "An internal server error occurred. Please try again later.",
  });
});

// ─── 404 Handler (Test case 7.3 — custom error pages) ────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "The requested resource was not found.",
  });
});

// ─── Start Server ───────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n CTF Wars Server running on http://localhost:${PORT}`);
  console.log(` WebSocket namespace: /ctf`);
  console.log(` Security: Rate limiting ✅ | Audit logging ✅ | Input sanitization ✅`);
  console.log(` Security: Compression ✅ | Cache-Control ✅ | CSP ✅ | Method restriction ✅`);
  console.log(` Health check: http://localhost:${PORT}/api/health\n`);
});

export { app, server, io, ctfNamespace };
