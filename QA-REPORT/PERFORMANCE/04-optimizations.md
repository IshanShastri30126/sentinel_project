# System Performance Engineering — Proposed Targeted Optimizations & Contracts

## 1. Executive Directive Compliance

Per User Correction Directives:
- **DO NOT IMPLEMENT OPTIMIZATIONS YET**.
- Document exact cache contracts, parallelization safety checks, and before/after verification methodology prior to any code edit.
- Absolute preservation of:
  - Security Boundary: `SEC-001` through `SEC-008`.
  - Reliability Caveats: Redis lock failure open/secure semantics, firewall unblock cache invalidation.
  - Database Correctness: No duplicate events, no duplicate registrations, no incorrect capacity, no duplicate hint charges, no incorrect scores.

---

## 2. Targeted Optimization Specifications

### OPT-001: Prisma Connection Pool Scaling (P0)
- **Target**: `server/.env` and `ctf-platform/server/.env` (`DATABASE_URL`)
- **Problem**: Default `connection_limit=5` causes queue saturation at concurrency 10–25, leading to pool timeouts that masquerade as HTTP 401 errors.
- **Root Cause**: Neon PgBouncer pooler accepts up to 50–100 client connections, but Prisma was artificially constrained to 5.
- **Proposed Change**:
  - Update `connection_limit=5` to `connection_limit=20` and `pool_timeout=20`.
- **Pre-Implementation Validation Requirements**:
  - Verify PgBouncer connection limits on Neon serverless instance.
  - Verify memory consumption impact on local Node.js process (`~1 MB` per connection).
  - Verify database error rate under concurrency 25.

---

### OPT-002: In-Memory L1 Cache with Strict Invalidation Contract (P1)
- **Target**: `server/src/lib/cache.ts` (Events, Clubs, Public Catalogs)
- **User Correction Directive #3 Compliance**:

| Architectural Dimension | Specification Contract |
|---|---|
| **Cache Key Schema** | `l1:events:public:list`<br>`l1:events:detail:<idOrSlug>`<br>`l1:clubs:list` |
| **TTL** | Public Events List: `30 seconds`<br>Event Detail: `30 seconds`<br>Clubs Catalog: `300 seconds` |
| **Maximum Cache Size** | `500 entries` (Bounded LRU eviction to prevent heap bloat) |
| **Insertion Mechanism** | Synchronous insertion on cache miss after successful DB / Redis read |
| **Lookup Mechanism** | Synchronous Map lookup (`O(1)` time, `< 0.02 ms` latency) before Redis or DB |
| **Mutation Invalidation** | Explicit multi-key purge on all state changes |
| **Restart Behavior** | Cache initialized as empty Map on server boot; naturally self-warms on initial queries |
| **Multi-Instance Behavior** | L2 Upstash Redis remains authoritative source of truth. L1 bounded by 30s TTL |
| **Stale-Data Window** | Same-instance: `0 seconds` (synchronous local invalidation on mutation)<br>Cross-instance: maximum `30 seconds` |
| **Failure Behavior** | Map operations cannot throw network or I/O exceptions; if heap threshold reached, oldest LRU key dropped |

#### Explicit Lifecycle Mutation Invalidation Contract:
- **CREATE**: Invalidate `l1:events:public:list` and trigger L2 `clearEventsCache()`.
- **UPDATE**: Invalidate `l1:events:public:list`, `l1:events:detail:<id>`, `l1:events:detail:<slug>`.
- **DELETE**: Invalidate `l1:events:public:list`, `l1:events:detail:<id>`, `l1:events:detail:<slug>`.
- **PUBLISH**: Invalidate `l1:events:public:list`, `l1:events:detail:<id>`, `l1:events:detail:<slug>`.
- **UNPUBLISH**: Invalidate `l1:events:public:list`, `l1:events:detail:<id>`, `l1:events:detail:<slug>`.
- **LIST**: Read from `l1:events:public:list`; if miss, read from Redis/DB and insert.
- **DETAIL**: Read from `l1:events:detail:<idOrSlug>`; if miss, read from Redis/DB and insert.

---

### OPT-003: Safe Independent Operation Pipelining (`Promise.all`) (P1)
- **Target**: `server/src/routes/events.ts` (Event Creation Post-Commit Pipeline)
- **User Correction Directive #2 Compliance**:
  - Do not mechanically parallelize database calls.
  - Only parallelize operations that are genuinely independent.
- **Independence Analysis**:
  - Step 1 (`prisma.event.create`): Dependent on role check. **Must remain sequential**.
  - Step 2 (`auditLog` database insert) AND Step 3 (`clearEventsCache` / Redis invalidations):
    - Independent side effects occurring **after** `prisma.event.create` has committed.
    - Neither depends on the other's return value.
- **Connection Pool & Load Impact**:
  - Sequential execution takes `~2,250 ms` (1,120 ms DB audit + 1,130 ms cache query).
  - Parallel execution takes `~1,130 ms` (1 DB connection + 1 Redis call in parallel).
  - Saves 1 full trans-continental round trip (`~1,100 ms`) without adding nested DB transactions.

---

### OPT-004: CTF WebSocket Presence Singleton Scope Fix (P1)
- **Target**: `ctf-platform/server/src/sockets/scoreboard.ts`
- **Problem**: `memoryPresence` Map is declared inside `ctfNamespace.on("connection")`, creating isolated state per socket.
- **Proposed Change**: Move `const memoryPresence = new Map<string, Set<string>>();` outside connection handler to module level.
- **Verification**: Connect two distinct sockets, invoke `viewChallenge`, verify viewer count equals 2 instead of 1.

---

## 3. Database Indexes — Strict Rejection & Review (P2)

Per User Correction Directive #1:
- All 5 candidate queries (`event_registrations`, `ctf_submissions`, `ctf_challenges`, `ctf_participants`, `certificates`) were profiled using `EXPLAIN (ANALYZE, BUFFERS, TIMING)`.
- Internal PostgreSQL engine execution time across all queries is **0.034 ms to 0.052 ms**.
- Datasets are contained within 1 to 4 memory buffer pages.
- Adding speculative B-tree indexes now provides 0 ms of latency improvement while creating write amplification.
- **Verdict**: **REJECT ALL SPECULATIVE INDEXES**. Documented in `06-database.md`.

---

## 4. Verification & Regression Protocol

Before declaring any optimization complete:
1. Rerun the 12 User Journeys suite (`tests/perf/journey_benchmark.ts`).
2. Rerun the Staged Concurrency & Load test (`tests/perf/staged_load_benchmark.ts`).
3. Verify all 16 Functional Regression checks:
   - Login, logout, dashboard, event creation, event registration, CTF transition, challenge access, hint unlock, flag submission, scoreboard, notifications, role-based access, refresh, back, forward.
4. Verify Database Correctness:
   - No duplicate events, no duplicate registrations, no incorrect capacity, no duplicate hint charges, no incorrect scores.
5. Generate Before/After comparison matrix with empirical percentages.
