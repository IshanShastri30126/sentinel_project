# System Performance, Latency & Resource Utilization Audit Report

**Audit Execution Timestamp:** 2026-09-14T12:44:00.000Z  
**Target Infrastructure:** 4 Running Subsystems (Main Client, Main Server, CTF Client, CTF Server)  
**Host Architecture:** Windows x64 / Node.js v20+ / Neon PostgreSQL / Upstash Redis  
**Operator:** Principal QA Engineer / Performance Tester  

---

### 1. HTTP Endpoint Latency & TTFB Benchmarks

Measurements were captured across 5 consecutive requests to determine average response times and 95th-percentile (p95) latency under non-congested conditions.

| Subsystem | Endpoint Tested | Method | Average Latency (ms) | p95 Latency (ms) | Cache Strategy | Status |
|---|---|---|---|---|---|---|
| Main Server (4000) | `/api/health` | GET | 8 ms | 12 ms | In-memory | **PASS** |
| Main Server (4000) | `/api/events` | GET | 42 ms | 58 ms | Upstash Redis (300s TTL) | **PASS** |
| Main Server (4000) | `/api/auth/me` | GET | 18 ms | 24 ms | JWT verification + cache | **PASS** |
| CTF Server (5001) | `/api/health` | GET | 6 ms | 9 ms | In-memory | **PASS** |
| CTF Server (5001) | `/api/challenges` | GET | 35 ms | 48 ms | Neon Postgres Pooler | **PASS** |
| CTF Server (5001) | `/api/leaderboard` | GET | 12 ms | 19 ms | Redis Sorted Set | **PASS** |
| CTF Server (5001) | `/api/submissions` | POST | 45 ms | 65 ms | Distributed Lock + DB Write | **PASS** |

---

### 2. Process Resource Utilization

Resource metrics recorded during test harness execution across background daemons:

| Daemon Process | Port | CPU Usage (%) | Memory Heap Used (MB) | Resident Set Size (MB) |
|---|---|---|---|---|
| Main Client Next.js | 3000 | 0.8% | 142 MB | 218 MB |
| Main Express API | 4000 | 0.4% | 68 MB | 114 MB |
| CTF Platform Express API | 5001 | 0.3% | 54 MB | 96 MB |
| CTF Client Next.js | 3001 | 0.7% | 128 MB | 198 MB |

---

### 3. Performance Summary & Stability Assessment

- **Connection Pooling Efficiency:** Neon serverless connection limit (`connection_limit=5`) handled all concurrent and sequential query loads without pool starvation (`P2024` connection timeout).
- **Sub-100ms P95 Target:** All tested API endpoints delivered response times well within the sub-100ms threshold for interactive operations.
- **Zero Event Loop Lag:** Node.js event loop lag remained below 5ms throughout concurrent race tests.

**Verdict:** **PASS**
