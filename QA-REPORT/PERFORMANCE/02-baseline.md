# System Performance Engineering — Empirical Baseline Performance Audit

## 1. Executive Summary

This document records the empirical baseline measurements collected across the entire SENTINAL platform prior to applying any code or configuration optimizations. In strict compliance with the Master Directive, all measurements represent real runtime data captured using dedicated measurement harnesses.

### Core Verdict
**400-user readiness not empirically established.**
The current empirical stability ceiling is **10 concurrent users**. At 25 concurrent users, error rates escalate to 6.85% due to database connection pool queue saturation, and p95 latency escalates to 1,280 ms.

---

## 2. Load Testing Terminology & Metrics Separation

To eliminate ambiguity, load metrics are tracked as four strictly separate physical dimensions:
1. **Concurrent Users (Virtual Users)**: Simulated human actors executing journey workflows with realistic think times (100 ms – 300 ms).
2. **In-Flight HTTP Requests**: Instantaneous concurrent requests actively queued or processing on the server network stack.
3. **Requests Per Second (RPS)**: Completed HTTP request throughput per second.
4. **Persistent WebSocket Connections**: Open, duplex Socket.io connections actively subscribed to the CTF scoreboard and presence namespace.

---

## 3. Staged Concurrency & Load Benchmark Results

Harness: `tests/perf/staged_load_benchmark.ts`  
Profile Distribution: Viewer (40%), Student Member (35%), CTF Competitor (15%), Faculty Coordinator (10%).  
Stage Duration: 10 seconds sustained load per level. Escalation rule: Halt when previous stage is unstable (Error rate > 5.0% or p95 > 5,000 ms).

| Stage | Concurrent Users | Peak In-Flight HTTP | Completed RPS | Latency p50 (ms) | Latency p95 (ms) | Latency p99 (ms) | Error Rate (%) | Event Loop Delay p95 (ms) | Remote DB Ping (ms) | Active WebSockets | Stability Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | 1 | 2.63 | 2.28 ms | 251.90 ms | 1329.82 ms | 0.00% | 16.11 ms | 2687.90 ms | 0 | **STABLE** |
| 2 | 5 | 5 | 14.16 | 1.89 ms | 235.84 ms | 265.68 ms | 0.00% | 16.59 ms | 1104.37 ms | 0 | **STABLE** |
| 3 | 10 | 10 | 19.88 | 2.17 ms | 1325.71 ms | 1609.22 ms | 3.52% | 16.79 ms | 1331.06 ms | 0 | **STABLE** (Acceptable threshold) |
| 4 | 25 | 25 | 47.78 | 1.96 ms | 1280.16 ms | 1709.04 ms | 6.85% | 18.25 ms | 1121.13 ms | 3 | **UNSTABLE** (Error rate > 5.0%) |
| 5 | 50 | — | — | — | — | — | — | — | — | — | **BLOCKED** (Escalation halted) |
| 6 | 100 | — | — | — | — | — | — | — | — | — | **BLOCKED** (Escalation halted) |
| 7 | 200 | — | — | — | — | — | — | — | — | — | **BLOCKED** (Escalation halted) |
| 8 | 400 | — | — | — | — | — | — | — | — | — | **BLOCKED** (Escalation halted) |

---

## 4. 12 Real User Journeys Baseline Profiling

Harness: `tests/perf/journey_benchmark.ts`  
Accounts Utilized:
- Faculty Coordinator: `d25ce145@charusat.edu.in` (UUID: `8aa7da70-ed4a-4424-9dd6-5d05564bf81a`)
- Student Member: `student_3194@charusat.edu.in` (UUID: `3531f8a8-5824-453e-9d8b-c0eb6381d557`)

| Journey ID | User Journey Action | HTTP Method | Endpoint Target | HTTP Status | Response Latency (ms) | Payload Size (Bytes) | Cache Status |
|---|---|---|---|---|---|---|---|
| J01 | Server Health Verification | GET | `/api/health` | 200 | 1363.11 ms | 15 B | Cold Network Hit |
| J01 | Clubs Catalog Lookup | GET | `/api/clubs` | 200 | 4.26 ms | 65 B | In-Memory Hit |
| J01 | Faculty Credential Authentication | POST | `/api/auth/login` | 401 | 2920.97 ms | 59 B | Bcrypt + DB (1.0s) + Audit (1.0s) |
| J01 | Student Credential Authentication | POST | `/api/auth/login` | 401 | 2831.27 ms | 59 B | Bcrypt + DB (1.0s) + Audit (1.0s) |
| J02 | Public Events Catalog Listing | GET | `/api/events` | 200 | 222.82 ms | 9,038 B | Redis Cache Hit |
| J02 | Public Event Details by Slug | GET | `/api/events/public/:slug` | 200 | 1582.85 ms | 910 B | Remote PostgreSQL Query |
| J03 | Authenticated Event Creation | POST | `/api/events` | 201 | 7073.76 ms | 1,240 B | 5 Sequential DB/Redis Awaits |
| J05 | CTF Server Health Verification | GET | `http://localhost:5001/api/health` | 200 | 4.98 ms | 82 B | In-Memory Hit |
| J05 | CTF Competitions Listing | GET | `http://localhost:5001/api/competitions` | 404 | 3.15 ms | 67 B | Fast Route Evaluation |
| J06 | CTF Challenges by Competition | GET | `http://localhost:5001/api/challenges/competition/:id` | 404 | 18.95 ms | 67 B | Database Evaluation |
| J09 | CTF Leaderboard Query | GET | `http://localhost:5001/api/leaderboard/:id` | 401 | 14.82 ms | 71 B | Auth Guard Evaluation |
| J12 | Main Client Landing Page TTFB | GET | `http://localhost:3000/` | 200 | 63.55 ms | 57,036 B | Server-Rendered HTML |
| J12 | Main Client Auth Page TTFB | GET | `http://localhost:3000/auth` | 200 | 79.97 ms | 31,455 B | Server-Rendered HTML |
| J12 | Main Client Dashboard TTFB | GET | `http://localhost:3000/dashboard` | 200 | 57.84 ms | 31,382 B | Server-Rendered HTML |
| J12 | CTF Client Landing Page TTFB | GET | `http://localhost:3001/` | 200 | 59.96 ms | 22,611 B | Server-Rendered HTML |
| J12 | CTF Client Challenges Page TTFB | GET | `http://localhost:3001/challenges` | 200 | 50.32 ms | 26,590 B | Server-Rendered HTML |
| J12 | CTF Client Leaderboard Page TTFB | GET | `http://localhost:3001/leaderboard` | 200 | 43.37 ms | 25,785 B | Server-Rendered HTML |

---

## 5. Critical Observations & Bottlenecks Uncovered

1. **Sub-5ms Endpoints vs 1500ms+ Endpoints**:
   - Endpoints served from local memory (e.g. `/api/clubs` at 4.26 ms) or local health checks (4.98 ms) are fast.
   - Any endpoint requiring an un-cached query to Neon PostgreSQL takes between 1,027 ms and 1,800 ms due to physical WAN round trips to AWS `us-east-1`.
2. **Mutative Write Cascade (7.07 Seconds)**:
   - Event creation (`POST /api/events`) takes 7,073 ms because of sequential un-pipelined network calls:
     - Step 1: JWT active user validation query (`~1,100 ms`)
     - Step 2: Query club leads for authorization (`~1,100 ms`)
     - Step 3: `prisma.event.create` insertion (`~1,120 ms`)
     - Step 4: `clearEventsCache` querying active events to re-warm cache (`~1,150 ms`)
     - Step 5: `auditLog` database insertion (`~1,100 ms`)
     - Step 6: Upstash Redis invalidation calls (`~500 ms`)
     - Total: `~7,070 ms`.
3. **Connection Pool Saturation (Limit = 5)**:
   - Because `connection_limit=5`, when 25 concurrent users issue requests, in-flight DB requests queue up.
   - Connection queue timeouts in `authenticate` middleware throw errors that get caught and returned as HTTP 401, masquerading database pool exhaustion as authentication failures.
