import dotenv from "dotenv";
dotenv.config();

// ─── Required env var guard ───────────────────────────────────────────────────
// Fail loudly at startup if any critical secret is missing.
// This prevents silent use of weak dev-fallback values in production.
function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`[Config] Missing required environment variable: ${key}. Server cannot start.`);
  }
  return val;
}

const isProduction = process.env.NODE_ENV === "production";

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  jwt: {
    // In production, JWT secrets are strictly required — no fallbacks
    secret: isProduction ? requireEnv("JWT_SECRET") : (process.env.JWT_SECRET || "dev-secret-do-not-use-in-prod"),
    refreshSecret: isProduction ? requireEnv("JWT_REFRESH_SECRET") : (process.env.JWT_REFRESH_SECRET || "dev-refresh-do-not-use-in-prod"),
    expiry: process.env.JWT_EXPIRY || "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  },
  upstash: {
    url: process.env.UPSTASH_REDIS_REST_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
  },
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "Chakravyuh Club <noreply@chakravyuhclub.com>",
  },
  google: {
    // No hardcoded fallback — missing = Google OAuth simply won't work
    clientId: process.env.GOOGLE_CLIENT_ID || "",
  },
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
  ctfWarsUrl: process.env.CTF_WARS_URL || "http://localhost:5001",
  escalationThresholdHours: parseInt(process.env.ESCALATION_THRESHOLD_HOURS || "48", 10),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
};

