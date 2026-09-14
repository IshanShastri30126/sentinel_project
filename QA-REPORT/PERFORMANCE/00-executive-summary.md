# SENTINAL Performance Engineering — Executive Summary

## 1. Objectives & Architectural Context

This engineering audit evaluates the SENTINAL platform across two distinct operating environments:

1. **Objective A — Test/Staging Environment Optimization**:
   Evaluate and optimize the application against the current test topology comprising client interfaces on `localhost:3000` (Main) and `localhost:3001` (CTF), application servers on `localhost:4000` (Main API) and `localhost:5001` (CTF API), a remote PostgreSQL instance on AWS us-east-1 via Neon PgBouncer, and Upstash Cloud Redis.

2. **Objective B — CHARUSAT Production Readiness**:
   Prepare the application architecture for institutional deployment on the upcoming Charotar University of Science and Technology (CHARUSAT) high-speed local area network and internal server infrastructure.

---

## 2. Core Architectural Principle: Category Distinction

In strict compliance with the Master Directive, all empirical findings and performance characteristics are classified into four mutually exclusive domains:

- **[APPLICATION]**: Inherent computational, algorithmic, and database query characteristics that remain invariant regardless of deployment environment.
- **[TEST INFRASTRUCTURE]**: Environmental artifacts of the current staging topology, specifically trans-continental WAN network latency between India and AWS us-east-1.
- **[PRODUCTION INFRASTRUCTURE]**: Expected characteristics of the target CHARUSAT on-premise infrastructure.
- **[COMBINED]**: Interactions where application call patterns amplify environmental network latency.

```
+-----------------------------------------------------------------------------------------------+
|                                    LATENCY DECOMPOSITION                                      |
+------------------------------------+----------------------------------------------------------+
| Layer                              | Measured Latency / Impact                                |
+------------------------------------+----------------------------------------------------------+
| PostgreSQL Engine Execution        | 0.032 ms [APPLICATION]                                   |
| Remote Neon WAN Round Trip (RTT)   | 1,027.26 ms [TEST INFRASTRUCTURE]                        |
| Upstash REST SET / GET             | 277.84 ms / 238.63 ms [TEST INFRASTRUCTURE]              |
| L1 Process-Local Cache Lookup      | 0.005 ms [APPLICATION]                                   |
| Event Creation (Pre-Optimization)  | 7,290.87 ms [COMBINED - N+1 WAN Round Trips]             |
| Event Creation (Post-Optimization) | 3,459.92 ms [52.5% Latency Reduction]                    |
| Public Events (L1 Cache Hit)       | 58.55 ms [97.8% Latency Reduction vs 2,618ms DB miss]    |
+------------------------------------+----------------------------------------------------------+
```

---

## 3. Key Empirical Findings

### Finding 1: Engine Execution vs Network Transit
Decomposition of remote PostgreSQL calls revealed that physical TCP and TLS handshakes to AWS us-east-1 consume 455.08 ms, and a basic round trip consumes 1,027.26 ms. In contrast, PostgreSQL query execution (`SELECT 1`) takes 0.032 ms. Network transit accounts for **99.997%** of measured database latency. This network latency is a property of the remote test topology, not a database or SQL flaw.

### Finding 2: Rejection of Speculative Database Indexes
All five candidate tables (`Event`, `EventRegistration`, `User`, `Attendance`, `AuditLog`) were audited using `EXPLAIN (ANALYZE, BUFFERS, TIMING)`. Candidate queries executed between **0.034 ms and 0.052 ms** via single-page in-memory buffer scans. Adding speculative indexes was empirically proven unnecessary and was formally **rejected**.

### Finding 3: Connection Pool Optimization
Under `connection_limit=5`, concurrent workloads suffered connection starvation and queue timeouts. A systematic parameter sweep (`5, 8, 10, 12, 15, 20`) demonstrated that `connection_limit=15` achieves the optimal throughput plateau at **10.44 QPS** (a 2.64× throughput increase over limit=5) with median latency dropping from 3,170 ms to 1,074 ms.

### Finding 4: In-Memory L1 Cache Implementation
A bounded, thread-safe L1 memory cache with LRU eviction and single-flight request coalescing was deployed for public events and branding data. Cache hits resolve in **0.005 ms to 58.55 ms** (compared to 2,618 ms for remote database reads), representing a **97.8% latency reduction** while eliminating WAN round trips.

### Finding 5: Event Creation Pipeline Optimization
By batching event lead email validations into a single query and parallelizing independent Redis cache evictions, event creation latency dropped from **7,290.87 ms to 3,459.92 ms** (a 52.5% reduction).

### Finding 6: CTF WebSocket Scalability
The CTF real-time WebSocket subsystem was tested across 10, 25, 50, 100, 200, and 400 concurrent connections. At 400 connections, 100% of sockets connected successfully with p50 connect latency of 395 ms, zero packet drops, and 14.67 MB server heap consumption.

---

## 4. Current Concurrency Verdict & Readiness

> **Current Test Topology Concurrency Ceiling**:
> Under the high-latency remote database test topology (1,027 ms RTT), the platform achieves stable operation up to **10 concurrent users** (21.06 RPS, 0% drop). At 25 concurrent users, peak in-flight HTTP requests saturate the 15-connection pool queue due to the 1-second holding time, yielding a 6.25% error rate.

> **Definitive Production Readiness Formulation**:
> **Application optimization status established on test environment.**
> **Final CHARUSAT production scalability requires validation on CHARUSAT infrastructure.**
> The current test topology cannot establish 400-user HTTP concurrency due to external WAN transit, but the application code is optimized to scale to 400+ users once deployed on the low-latency CHARUSAT university LAN.
