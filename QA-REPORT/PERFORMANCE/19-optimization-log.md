# SENTINAL Performance Optimization Change Log & Evidence Registry

## 1. Summary of Applied Optimizations

All optimizations were executed in strict adherence to the **MEASURE → PROFILE → ROOT-CAUSE → OPTIMIZE → VERIFY** lifecycle. Speculative optimizations (such as creating database indexes on single-page tables) were empirically audited and rejected.

---

## 2. Standardized Before / After Optimization Registry

### [OPT-001] Prisma Connection Pool Expansion
- **Component**: `server/.env` & `ctf-platform/server/.env`
- **Problem**: Connection pool starvation and queue timeouts under concurrent load exceeding 5 requests.
- **Root Cause**: Neon PgBouncer connection string restricted pool to `connection_limit=5`.
- **Change**: Updated connection pool configuration to `connection_limit=15&connect_timeout=15`.
- **Before Metric**: 3.96 QPS throughput, p50: 3,170 ms (saturation at 10 users).
- **After Metric**: **10.44 QPS throughput**, p50: **1,074 ms** (stable at 10 users).
- **Improvement**: **+163.6% Throughput increase**, **66.1% Latency reduction**.
- **Functional / Security Verification**: PASS (Zero regressions).
- **Classification**: [TEST INFRASTRUCTURE] + [APPLICATION]

---

### [OPT-002] Process-Local L1 Memory Cache with Invalidation Contracts
- **Component**: `server/src/lib/cache.ts`, `server/src/routes/events.ts`, `server/src/routes/clubs.ts`
- **Problem**: Every read of public events and club branding required an expensive trans-continental round trip to AWS us-east-1 Neon (~1,027 ms) or Upstash Redis (~238 ms).
- **Root Cause**: Absence of process-local memory caching layer.
- **Change**: Created `MemoryCache` engine with max 500 entries, LRU eviction, single-flight request coalescing, and explicit invalidation on mutations (CREATE, UPDATE, DELETE, PUBLISH, UNPUBLISH).
- **Before Metric**: Public events list: 2,618.64 ms.
- **After Metric**: Public events list L1 hit: **58.55 ms** (down to 0.005 ms for warm in-memory lookups).
- **Improvement**: **97.8% Latency reduction**.
- **Functional / Security Verification**: PASS. Invalidation hooks verified across all event lifecycle handlers.
- **Classification**: [APPLICATION]

---

### [OPT-003] Batched Event Lead Validation
- **Component**: `server/src/routes/events.ts` (`validateEventLeads`)
- **Problem**: When creating an event with multiple Event Leads, the system performed sequential `prisma.user.findUnique` queries.
- **Root Cause**: Looping `await findUnique` inside an iteration block, creating N sequential WAN round trips.
- **Change**: Extracted unique lead emails and issued a single batched query: `prisma.user.findMany({ where: { email: { in: leadEmails } } })`.
- **Before Metric**: N × 1,000 ms per lead (~2,000 ms to 3,000 ms for multiple leads).
- **After Metric**: Single round trip (1,020 ms total), or 0 ms if no leads present.
- **Improvement**: Eliminates up to 2,000 ms of blocking WAN latency.
- **Functional / Security Verification**: PASS. Registered and unregistered leads correctly validated.
- **Classification**: [APPLICATION]

---

### [OPT-004] Independent Redis Cache Clearing Parallelization
- **Component**: `server/src/routes/events.ts` (`clearEventsCache`)
- **Problem**: Event mutations sequentially awaited 5 separate Redis key deletions and a remote database findMany query.
- **Root Cause**: Serial `await redisDel` calls and synchronous cache warming blocking the HTTP response.
- **Change**: Parallelized independent deletions via `Promise.all` and moved cache warming into background `setImmediate`.
- **Before Metric**: Overall Event Creation latency: 7,290.87 ms.
- **After Metric**: Overall Event Creation latency: **3,459.92 ms**.
- **Improvement**: **52.5% Latency reduction** (saving 3.83 seconds per event creation).
- **Functional / Security Verification**: PASS. Cache coherence maintained.
- **Classification**: [APPLICATION] + [TEST INFRASTRUCTURE]

---

### [OPT-005] CTF WebSocket Fallback Presence Singleton Fix
- **Component**: `ctf-platform/server/src/sockets/scoreboard.ts`
- **Problem**: Fallback presence tracking map was instantiated inside the socket connection callback, isolating presence state per socket.
- **Root Cause**: Scoping error: `const memoryPresence = new Map()` inside `on("connection")`.
- **Change**: Moved `memoryPresence` to module-level singleton scope.
- **Before Metric**: Isolated presence state during Redis downtime.
- **After Metric**: Global process-wide presence shared across all 400 sockets during Redis outage.
- **Functional / Security Verification**: PASS.
- **Classification**: [APPLICATION]

---

### [OPT-006] Frontend Package Import Optimization & Tree-Shaking
- **Component**: `client/next.config.ts` & `ctf-platform/client/next.config.ts`
- **Problem**: Large bundle overhead from barrel exports in `lucide-react` and `framer-motion`.
- **Root Cause**: Unoptimized barrel file resolution on initial client hydration.
- **Change**: Configured `experimental: { optimizePackageImports: ["lucide-react", "framer-motion"] }`.
- **Before Metric**: Client production build time: ~70s.
- **After Metric**: Client production build time: **43s** (-38.5%), clean prerendering across all 26 routes.
- **Functional / Security Verification**: PASS.
- **Classification**: [APPLICATION]

---

### [OPT-007] Role-Based Profile Sanitation & Semester Removal
- **Component**: `client/src/app/dashboard/profile/page.tsx`
- **Problem**: TypeScript compilation error during build due to referencing removed `user.semester` field.
- **Root Cause**: Obsolete `semester` state and inputs left in profile component after schema migration.
- **Change**: Removed all `semester` references, updated Faculty ID handling to display `employeeId`, and enforced strict 10-digit numeric phone input.
- **Before Metric**: Production build failed with exit code 1.
- **After Metric**: Production build succeeded with exit code 0.
- **Functional / Security Verification**: PASS.
- **Classification**: [APPLICATION]
