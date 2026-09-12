// Created: 2026-08-02 | Modified: Initial creation — Prisma client singleton

import { PrismaClient } from "@prisma/client";

// ─── Singleton Pattern ──────────────────────────────────────
// Without this, every time a file imports PrismaClient, Node.js
// would create a NEW database connection. With 20 route files,
// that's 20 connections — wasteful and dangerous.
//
// The singleton pattern ensures the ENTIRE server shares exactly
// ONE PrismaClient instance, no matter how many files import it.
// ─────────────────────────────────────────────────────────────

// In development, Next.js hot-reload re-imports files constantly.
// We store the client on `globalThis` so it survives hot-reloads.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export default db;
