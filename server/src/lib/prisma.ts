import { PrismaClient } from "@prisma/client";

// Force connection pool settings regardless of what DATABASE_URL contains
let dbUrl = process.env.DATABASE_URL || "";

// Strip existing pool params and re-add with optimized values for PostgreSQL / Neon / Remote DBs
if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    // Remove old pool params
    url.searchParams.delete("connection_limit");
    url.searchParams.delete("pool_timeout");
    url.searchParams.delete("connect_timeout");
    url.searchParams.delete("keepalive");
    url.searchParams.delete("keepalive_idle");

    // Set optimized pool & TCP Keep-Alive parameters for PostgreSQL/Neon/Supabase
    url.searchParams.set("connection_limit", process.env.DB_CONNECTION_LIMIT || "10");
    url.searchParams.set("pool_timeout", "30");
    url.searchParams.set("connect_timeout", "30");
    url.searchParams.set("keepalive", "true");
    url.searchParams.set("keepalive_idle", "30");

    dbUrl = url.toString();
  } catch (e) {
    console.error("[Prisma] Failed to parse DATABASE_URL:", e);
  }
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
  log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
});

// Periodic Heartbeat Ping (keeps pooled TCP connections alive and prevents idle drops)
let heartbeatInterval: NodeJS.Timeout | null = null;

function startHeartbeat() {
  if (heartbeatInterval) return;
  heartbeatInterval = setInterval(async () => {
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
    } catch (err: any) {
      console.warn("[Prisma] Heartbeat ping failed, attempting reconnect...", err?.message || err);
      try {
        await prisma.$disconnect();
        await prisma.$connect();
        console.log("[Prisma] Database connection restored successfully via heartbeat.");
      } catch (reconnectErr) {
        console.error("[Prisma] Database reconnection failed:", reconnectErr);
      }
    }
  }, 45000); // 45 seconds interval to prevent idle socket timeouts
}

startHeartbeat();

// Gracefully handle disconnects on process exit
process.on("beforeExit", async () => {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  await prisma.$disconnect();
});

export default prisma;
