# E2E Test Suite — Phase 1: Test Environment Initialization & Health Report

---

## 1. System Environment Configuration

| Parameter | Specification | Status |
| :--- | :--- | :--- |
| **Commit Hash** | `7d637dee94bbe7841a1ae0d4e491d0a14eb8ee91` | Verified |
| **Active Git Branch** | `Kush's-Work` (synced with `sentinel_project/Kush's-Work`) | Verified |
| **Node.js Runtime** | `v22.23.2` (win32-x64) | Active |
| **Chromium Engine** | `Chromium 148.0.7778.97` (via Puppeteer v24) | Verified |
| **Operating System** | Windows 11 Education (NT 10.0.26100) | Local Host |
| **Environment Mode** | `development` / Isolated Test Baseline | Verified |
| **Verification Timestamp** | `2026-09-14T12:12:00.000Z` / `2026-09-14 17:42:00` (IST) | Captured |

---

## 2. Running Services & Health Status

| Component | Port | Endpoint URL | Binding / Protocol | Health Response | Health Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sentinel Web Client** | `3000` | `http://localhost:3000` | HTTP / Next.js Turbopack | `HTTP 200 OK` | Healthy |
| **Sentinel API Server** | `4000` | `http://localhost:4000` | Express / Node.js | `GET /api/health` → `{"status":"ok"}` | Healthy |
| **CTF Web Client** | `3001` | `http://localhost:3001` | HTTP / Next.js Turbopack | `HTTP 200 OK` | Healthy |
| **CTF Backend Server** | `5001` | `http://localhost:5001` | Express / Node.js | `GET /api/health` → `{"status":"ok"}` | Healthy |
| **Database Cluster** | `5432` | `ep-small-art-apfniiyb-pooler...neon.tech` | PostgreSQL 16 (Neon Pooler) | `prisma.$queryRaw` → connected | Healthy |
| **Redis Cache** | `REST` | `https://big-minnow-137825.upstash.io` | Upstash HTTP Redis API | `PING` → `PONG` (HTTP 200) | Healthy |
| **Main WebSocket** | `4000` | `ws://localhost:4000` | Socket.io v4.8 | Transport upgrade handshake ok | Healthy |
| **CTF WebSocket** | `5001` | `ws://localhost:5001` | Socket.io v4.8 | Transport upgrade handshake ok | Healthy |

---

## 3. Resilience and Stability Check

→ **Service Crashes**: 0 detected across all background tasks.  
→ **Database Errors**: 0 Prisma connection or pool exhaustion errors.  
→ **Hydration / Console Exceptions**: 0 persistent uncaught exceptions.  
→ **Port Conflicts**: Ports 3000, 4000, 3001, and 5001 exclusively bound without collision.  
→ **Overall Phase 1 Status**: `PASS`
