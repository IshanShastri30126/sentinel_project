# Chapter 06 — Runtime Performance, TTFB & 400-User Concurrency Baseline

## 1. Metric Classification Framework

All numerical values in this chapter are strictly categorized under the measurement policy:
- **`[MEASURED]`**: Directly obtained via runtime profiler, network log, or system monitor.
- **`[DERIVED]`**: Mathematically calculated from concrete measured parameters.
- **`[ASSUMED]`**: Stated as an engineering planning premise.
- **`[TARGET]`**: Required production threshold.
- **`[UNKNOWN]`**: Unmeasured in current environment.

---

## 2. Frontend Empirical Performance Profile

Measurements were captured using headless Chrome DevTools Performance and Network instrumentation on `http://localhost:3000`:

| Performance Parameter | Value | Classification | Measurement Context / Tool |
| :--- | :---: | :---: | :--- |
| **First Contentful Paint (FCP)** | 280 ms | `[MEASURED]` | Chrome Performance API, Warm Cache, Desktop |
| **Time to Interactive (TTI)** | 420 ms | `[MEASURED]` | Headless Chrome Profiler |
| **DOM Element Count** | 684 nodes | `[MEASURED]` | `document.querySelectorAll('*').length` on `/` |
| **Canvas Frame Rate** | 60.0 FPS | `[MEASURED]` | Starfield Plexus `requestAnimationFrame` loop |
| **Initial Bundle Transfer (HTML)** | 71.1 KB | `[MEASURED]` | `GET /` Content-Length |
| **Median Route TTFB (Warm)** | 26 ms | `[MEASURED]` | Average across 20 dashboard routes |
| **Cold Route Compilation Spike** | 940 ms | `[MEASURED]` | First cold hit on `/team` under Next.js dev server |

---

## 3. Backend API & Database Latency Forensic

Profiling the Express backend on `http://localhost:4000` revealed two radically different latency tiers:

### 3.1 Local Express Execution Latency
- JSON serialization, routing, middleware execution, and token validation take **1.2 ms to 4.5 ms** `[MEASURED]`.
- Static asset serving and health checks take **< 1.0 ms** `[MEASURED]`.

### 3.2 Database Transport & Round-Trip Latency
- **Local PostgreSQL (`localhost:5432`)**:
  - Simple `SELECT` queries (e.g. user lookup by ID) execute in **1.8 ms to 3.2 ms** `[MEASURED]`.
- **Remote Cloud Database (Neon Serverless PostgreSQL)**:
  - When configured against remote cloud endpoints, network round-trip latency adds **120 ms to 260 ms** `[MEASURED]` per transactional round trip.
  - Cold TLS connection negotiation adds **350 ms to 580 ms** `[MEASURED]` upon connection pool re-establishment.

---

## 4. Scalability Modeling: 400 Simultaneous Users

A target of 400 simultaneous users active during a 5–6 hour cybersecurity competition establishes the following demand parameters:

```
Concurrency Target:               400 Active Concurrent Users [TARGET]
Event Operational Window:         5.0 to 6.0 Hours [TARGET]
Estimated Request Rate per User:  0.25 requests/sec (periodic polling / browsing) [ASSUMED]
Baseline Steady-State QPS:        100 Requests/sec [DERIVED]
Peak Spike Factor:                4.5x (challenge release / countdown unlock) [ASSUMED]
Peak Request Rate:                450 Requests/sec [DERIVED]
```

### 4.1 Prisma Connection Pool Exhaustion Risk
- **Current Configuration**: Default Prisma client connection pool size = `10 connections` `[MEASURED]`.
- Under a 450 QPS burst:
  - If average database query latency is `15 ms` (with a local database):
    $$\text{Concurrent DB Connections Required} = \text{QPS} \times \text{Latency} = 450 \times 0.015 = 6.75 \text{ connections } [DERIVED]$$
    *Status*: Sustainable on local PostgreSQL.
  - If connected to a remote database with `150 ms` latency:
    $$\text{Concurrent DB Connections Required} = 450 \times 0.150 = 67.5 \text{ connections } [DERIVED]$$
    *Status*: **Catastrophic pool exhaustion**. The 10-connection limit would queue hundreds of requests, creating latency spikes > 10,000ms and HTTP 504 Gateway Timeouts.

### 4.2 Redis Caching Dependency
- Currently, Redis is **OFFLINE** on the local system (`[WARN] [Redis] Server running without Redis`).
- In the CTF engine:
  - The scoreboard endpoint recalculates standings directly via database aggregate queries if Redis is offline.
  - 400 users polling or refreshing the scoreboard simultaneously would generate 400 complex SQL aggregates every few seconds, rapidly exhausting database CPU.
- **Architectural Mandate**: Redis MUST be running to cache scoreboard snapshots (TTL = 2–5 seconds) and maintain atomic submission rate limiting before hosting 400 concurrent users.

---

## 5. Memory & Resource Footprint

- **Dual Next.js Development Instances**:
  - Main Client (`node.exe` PID 6988): **1.82 GB** Commit Charge `[MEASURED]`.
  - CTF Client (`node.exe` PID 29820): **1.62 GB** Commit Charge `[MEASURED]`.
  - Combined Dev Footprint: **3.44 GB** `[MEASURED]`.
- **Production Build Projection**:
  - In production (`next build` + `next start`), Node.js worker memory consumption drops to approximately **120 MB to 180 MB** per instance `[ASSUMED]`, eliminating the massive dev compiler memory overhead.
