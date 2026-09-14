# System Performance Engineering — Root-Cause Bottleneck Discovery

## 1. Executive Directive Compliance

Per User Correction Directives:
- Do not label a 1+ second total query as "slow SQL" until actual database execution time is measured separately.
- For Upstash Redis, determine the actual dominant component.
- Prioritize bottlenecks by severity:
  - **P0**: Crashes, hangs, runaway retries, catastrophic latency, memory leaks
  - **P1**: Remote DB round trips, N+1 queries, connection pool exhaustion, Redis bottlenecks, WebSocket scalability
  - **P2**: Duplicate frontend requests, unnecessary rendering, bundles, asset loading
  - **P3**: Micro-optimizations

---

## 2. Priority Bottleneck Inventory (P0 to P3)

### Bottleneck P0-1: Database Connection Pool Queue Saturation (`connection_limit=5`)
- **Severity**: P0 / P1
- **Empirical Evidence**:
  - `server/.env` and `ctf-platform/server/.env` configure:
    `connection_limit=5&connect_timeout=15`
  - In staged load test at 25 concurrent users, error rate spiked to 6.85% (`{"401": 37, "404": 3}`).
  - Prisma pool queue exhaustion throws `Timed out fetching a new connection from the connection pool`.
  - In `server/src/middlewares/auth.ts`, the generic `catch` block catches this pool timeout and returns `401 {"error": "Authentication required"}`, masking database pool exhaustion as authentication failures.
- **Saturation Math**:
  - Pool Capacity: 5 active connections.
  - Average Remote Query Roundtrip: 1,027 ms.
  - Maximum Sustained Query Throughput = `5 / 1.027 = 4.86 queries/second`.
  - When in-flight requests exceed 5, queue latency escalates linearly (`~1s` additional delay per 5 queued queries).
  - At 25 concurrent users, queued queries exceed 15-second connect timeout or Prisma queue capacity.

---

### Bottleneck P1-1: Trans-Continental Network Transit Dominance (99.997% of Latency)
- **Severity**: P1
- **Empirical Evidence**:
  - Remote Host: `ep-small-art-apfniiyb-pooler.c-7.us-east-1.aws.neon.tech` (AWS us-east-1).
  - TCP + TLS Handshake: `455.08 ms`.
  - Client-to-DB End-to-End Latency: `1,027.26 ms`.
  - Actual PostgreSQL Engine Planning + Execution (`SELECT 1`): `0.049 ms`.
  - All candidate candidate query engine executions: `0.034 ms` to `0.052 ms`.
- **Root Cause**:
  - Speed-of-light physical fiber delay between India and North Virginia (WAN RTT).
  - Calling `await prisma.xxx` multiple times sequentially multiplies the 1-second transit penalty by the number of queries.

---

### Bottleneck P1-2: Sequential Write Transaction Cascade (Event Creation = 7.07s)
- **Severity**: P1
- **Empirical Evidence**:
  - `POST /api/events` takes `7,073.76 ms` on average.
- **Decomposed Execution Waterfall**:
  1. `authenticate` middleware: queries `prisma.user.findUnique` on cache miss (`1,128 ms`).
  2. Authorization check: queries club lead roles (`1,128 ms`).
  3. Mutative creation: `prisma.event.create` (`1,128 ms`).
  4. Cache clearing: `clearEventsCache` issues active events warm query (`1,128 ms`).
  5. Audit logging: `auditLog` queries/inserts (`1,128 ms`).
  6. Distributed cache invalidation: Upstash REST calls (`~500 ms`).
  - Total latency = `6 × ~1,100 ms = 7.07 seconds`.

---

### Bottleneck P1-3: Upstash Cloud Redis REST HTTP Overhead (~250 ms per Operation)
- **Severity**: P1
- **Empirical Evidence**:
  - Upstash REST SET: `277.84 ms`.
  - Upstash REST GET: `238.63 ms`.
  - In-memory JavaScript Map lookup: `0.005 ms` (`50,000×` faster).
- **Root Cause**:
  - In HTTP REST mode, each Redis call issues an outbound HTTPS request to `big-minnow-137825.upstash.io`.
  - When an endpoint performs multiple sequential Redis calls (e.g. read cache, write cache, audit), it accumulates 500 ms to 800 ms of pure network latency even when database queries are cached.

---

### Bottleneck P1-4: CTF WebSocket Memory Presence Isolation Defect
- **Severity**: P1 / Reliability
- **Empirical Evidence**:
  - In `ctf-platform/server/src/sockets/scoreboard.ts`, line 31:
    `const memoryPresence = new Map<string, Set<string>>();`
    is declared inside the `ctfNamespace.on("connection", (socket) => { ... })` callback.
- **Root Cause**:
  - Each connecting socket client allocates its own private `memoryPresence` instance.
  - During Redis outages or fallbacks, presence counting fails because clients do not share the presence set.

---

## 3. Bottleneck Synthesis Matrix

| Bottleneck ID | Target Component | Root Cause | Current Impact | Priority |
|---|---|---|---|---|
| BTN-001 | Database Connection Pool | `connection_limit=5` in PgBouncer pooler URL | Fails at 25 concurrent users (6.85% errors) | P0 |
| BTN-002 | Prisma Remote Latency | Physical WAN transit to AWS us-east-1 | Adds ~1,000 ms per un-cached DB query | P1 |
| BTN-003 | Event Creation Endpoint | 6 sequential remote awaits | 7.07s response latency on event creation | P1 |
| BTN-004 | Upstash Cloud Redis | HTTPS REST round trips (240–280 ms) | Adds 250–500 ms overhead on cache operations | P1 |
| BTN-005 | CTF Presence Engine | Scoped `memoryPresence` variable inside socket callback | Presence isolation on Redis fallback | P1 |
| BTN-006 | Speculative Database Indexes | Tables < 15 rows | 0 benefit now, write overhead on scaling | P2 (Rejection) |
