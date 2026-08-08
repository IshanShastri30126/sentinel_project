import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
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

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// ─── Global Middleware ─────────────────────────────────────

// 1. CORS MUST BE FIRST to intercept all requests (including preflight OPTIONS)
const allowedOrigins = config.clientUrl.split(",").map((s) => s.trim());

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
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
    // Return false instead of Error to avoid crashing express middleware pipeline without CORS headers
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Club-Slug",
    "X-Device-Fingerprint",
    "X-Local-IP",
    "X-Requested-With",
    "Accept",
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// 2. Security headers (disable COOP restrictive header so Google OAuth postMessage is not blocked)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // needed to serve images/files
  crossOriginOpenerPolicy: false, // allows Google Sign-In popup postMessage across origins
}));

// 3. Rate limiting (skip OPTIONS preflight requests)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 auth requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: { error: "Too many login/register attempts from this IP, please try again after an hour" }
});

app.use("/api/", apiLimiter);
app.use("/api/auth", authLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Serve uploaded files statically
app.use("/uploads", express.static(path.resolve(config.uploadDir)));

// ─── Health Check ──────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "2.0.0", timestamp: new Date().toISOString() });
});

// ─── API Routes ────────────────────────────────────────────
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

// ─── Global Error Handler ──────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Server] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Start Server ──────────────────────────────────────────
httpServer.listen(config.port, () => {
  console.log(`\n🛡️  Chakravyuh Club API Server running on http://localhost:${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/api/health`);
  console.log(`   Socket.io: ws://localhost:${config.port}\n`);
});

export default app;
// Trigger dev server reload for Redis config update.

