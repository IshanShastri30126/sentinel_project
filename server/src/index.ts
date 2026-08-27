import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import { createServer } from "http";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { initSocket } from "./lib/socket";

// Route imports
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import approvalRoutes from "./routes/approvals";
import eventRoutes from "./routes/events";
import teamRoutes from "./routes/teams";
import attendanceRoutes from "./routes/attendance";
import certificateRoutes from "./routes/certificates";
import appreciationRoutes from "./routes/appreciation";
import analyticsRoutes from "./routes/analytics";
import notificationRoutes from "./routes/notifications";
import settingsRoutes from "./routes/settings";
import clubRoutes from "./routes/clubs";
import maintenanceRoutes from "./routes/maintenance";
import oauthRoutes from "./routes/oauth";

// Security middleware imports
import { requestId } from "./middlewares/requestId";
import { suspiciousPayload } from "./middlewares/suspiciousPayload";
import { sanitizeApiResponse } from "./middlewares/sanitizeResponse";
import { networkInspectionGuard } from "./middlewares/networkInspectionGuard";

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// ─── Global Middleware Stack ────────────────────────────────────────────────

// 1. Compression
app.use(compression());

// 2. Attach X-Request-ID to every request and response (traceability)
app.use(requestId);

// 3. CORS — must be early to intercept preflight OPTIONS
const allowedOrigins = config.clientUrl.split(",").map((s) => s.trim());

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.includes("vercel.app") ||
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    ) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Club-Slug",
    "X-Device-Fingerprint",
    "X-Device-ID",
    "X-Local-IP",
    "X-Private-IP",
    "X-Requested-With",
    "X-Request-Timestamp",
    "X-Request-Nonce",
    "X-Request-Signature",
    "X-Client-Integrity",
    "Accept",
  ],
  // Do NOT expose internal headers in CORS Allow headers
  exposedHeaders: ["X-Request-ID"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// 4. Helmet — hardened security headers
app.use(
  helmet({
    // Allow Google OAuth popup postMessage
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    // Serve images/files cross-origin (Cloudinary CDN)
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Strict HSTS — 2 years, preload eligible
    strictTransportSecurity: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    // Deny framing — prevent clickjacking
    frameguard: { action: "deny" },
    // Prevent MIME sniffing
    noSniff: true,
    // Disable browser DNS prefetch
    dnsPrefetchControl: { allow: false },
    // Hide server fingerprint header
    hidePoweredBy: true,
    // Referrer policy
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    // Content Security Policy for API server (minimal — no HTML served)
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);

// 5. Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: { error: "Too many requests, please try again later" },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: { error: "Too many requests, please try again later" },
});

app.use("/api/", apiLimiter);
app.use("/api/auth", authLimiter);

// 6. Body parsing — 1mb limit for non-upload routes (tightened from 10mb)
//    Upload routes use multer and bypass this limit via multipart/form-data
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());

// 7. WAF-lite: scan all parsed bodies, query params, and paths for attack patterns
//    Applied AFTER body parsing so req.body is available for scanning
app.use("/api/", suspiciousPayload);

// 8. Network Inspection & Anti-Tampering Shield (Blocks Burp Suite / Replays / Scanners)
app.use("/api/", networkInspectionGuard);

// 9. API response sanitization — adds Cache-Control: no-store + strips error internals
app.use("/api/", sanitizeApiResponse);

// 9. Serve uploaded files statically — restricted headers, no caching of sensitive files
app.use("/uploads", express.static(path.resolve(config.uploadDir), {
  maxAge: "7d",
  etag: true,
  lastModified: true,
  // Disable directory listing
  index: false,
}));

// ─── Health Check ────────────────────────────────────────────────────────────
// Deliberately minimal — does NOT expose version, env, uptime, or config details
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/appreciation", appreciationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/oauth", oauthRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
// Catch all unmatched routes — return generic error without revealing route structure
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// OWASP: never expose stack traces, file paths, or DB internals to clients
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Log internally with request ID for traceability — never log to client
  const rid = (req as any).requestId || "unknown";
  // Use process.stderr directly to avoid any logger that might forward to client
  process.stderr.write(`[${new Date().toISOString()}] [${rid}] Unhandled error: ${err.message}\n`);

  if (res.headersSent) return;

  // Generic response — no stack trace, no internal details
  res.status(500).json({ error: "An unexpected error occurred" });
});

// ─── TCP / SYN Flood Hardening ────────────────────────────────────────────────
httpServer.headersTimeout = 10000;  // 10s header read limit
httpServer.requestTimeout = 15000;  // 15s overall request processing limit
httpServer.keepAliveTimeout = 5000; // 5s idle socket keep-alive timeout
httpServer.maxHeadersCount = 50;    // Reduced from 100 — limits header injection surface

const activeConnectionsByIp = new Map<string, number>();

httpServer.on("connection", (socket) => {
  const ip = socket.remoteAddress || "127.0.0.1";
  const count = (activeConnectionsByIp.get(ip) || 0) + 1;
  activeConnectionsByIp.set(ip, count);

  if (count > 50) {
    socket.destroy();
    return;
  }

  socket.on("close", () => {
    const current = activeConnectionsByIp.get(ip) || 1;
    if (current <= 1) {
      activeConnectionsByIp.delete(ip);
    } else {
      activeConnectionsByIp.set(ip, current - 1);
    }
  });
});

httpServer.listen(config.port, () => {
  process.stdout.write(`\n🛡️  Chakravyuh Club API Server running on http://localhost:${config.port}\n`);
  process.stdout.write(`   Health: http://localhost:${config.port}/api/health\n`);
  process.stdout.write(`   Socket.io: ws://localhost:${config.port}\n`);
  process.stdout.write(`   Security: WAF + RequestID + ResponseSanitization + TCP Hardening ACTIVE\n\n`);
});

export default app;
