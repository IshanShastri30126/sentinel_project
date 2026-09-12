# CTF Wars — Technology Stack Specification

> **Author:** Engineering Team (Dhairya Tanna)
> **Status:** APPROVED

---

## 1. Purpose

This document outlines the exact technologies we are using for the standalone CTF Wars platform. Because it is a separate application from Sentinel, it will have its own `package.json` files for both the frontend and backend.

---

## 2. Frontend Stack (The `client` folder)

We are building a highly responsive, hacker-themed UI.

*   **Framework:** Next.js 14 (App Router)
*   **UI Library:** React 18
*   **Styling:** Tailwind CSS v4
*   **Animations:** Framer Motion (for smooth transitions and the 5-second freeze pop-up)
*   **Components:** Shadcn UI (for clean forms/inputs) & Aceternity UI (for cyberpunk backgrounds)
*   **Real-time:** Socket.io-client (to receive live scoreboard updates)
*   **Language:** TypeScript

---

## 3. Backend Stack (The `server` folder)

We need a backend that can handle 150+ concurrent users spamming flags without crashing.

*   **Runtime:** Node.js
*   **Framework:** Express.js (Simple, fast, and reliable API routing)
*   **Database ORM:** Prisma (To talk to PostgreSQL safely)
*   **Real-time:** Socket.io (To broadcast events to the frontend)
*   **Caching/Queuing:** ioredis (A fast Redis client for Node.js, used for the JWT Blacklist and Concurrency Locks)
*   **Validation:** Zod (To ensure users don't submit malicious data)
*   **Language:** TypeScript

---

## 4. Shared Infrastructure

CTF Wars connects to the exact same databases as Sentinel to share user accounts and resources.

*   **Primary Database:** PostgreSQL 16 (Shared with Sentinel)
*   **In-Memory Database:** Redis 7 (Shared with Sentinel, but we use it heavily for Token Blacklists and locks)
