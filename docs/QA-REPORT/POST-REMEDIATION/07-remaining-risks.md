# POST-REMEDIATION INDEPENDENT SECURITY & QA VERIFICATION REPORT
## 07. Residual Architectural Risks & Hardening Roadmap

**Assessment Domain:** Residual Architecture Flaws, Failure Modes & Production Hardening  
**Auditor Policy:** Transparent disclosure of all unresolved edge cases and production risks.

---

### 1. Risk Register & Priority Overview

| Risk ID | Severity | Subsystem | Failure Mechanism | Operational Impact | Recommended Fix |
|---|---|---|---|---|---|
| **RISK-001** | Medium | Event Registration (`events.ts`) | Prisma interactive transaction 5000ms timeout on row-lock queue | HTTP 500 (P2028) returned instead of clean HTTP 400 under high contention | Increase tx timeout to 15s and catch P2028 with HTTP 409 |
| **RISK-002** | Medium | CTF Locking Engine (`locks.ts`) | `acquireLock()` invokes `redis.set` without checking `redis.status === 'ready'` | Flag submissions hang on connection retries when Redis is offline | Short-circuit in `locks.ts` when Redis is disconnected |
| **RISK-003** | Low | Firewall Maintenance (`maintenance.ts`) | Unblock handler purges Redis key but fails to delete from local memory Set | Unblocked IP remains blocked for up to 30s until background refresh | Add `cachedBlockedIps.delete(ip)` to unblock route |
| **RISK-004** | Low | Development Environment | Dual Next.js dev server instances consume ~3.44 GB commit memory | High local memory pressure during development | Deploy standalone production bundles (`next start`) |

---

### 2. Deep Technical Breakdown of Residual Risks

#### 2.1 RISK-001: Prisma Interactive Transaction Timeout Under Row-Lock Contention
- **Affected File:** `server/src/routes/events.ts`
- **Mechanism:**  
  To prevent capacity oversubscription (SEC-004), the backend uses:
  ```typescript
  await prisma.$transaction(async (tx) => {
    const [event] = await tx.$queryRaw`SELECT * FROM "Event" WHERE id = ${eventId} FOR UPDATE`;
    // ... count registrations and insert ...
  });
  ```
  While this successfully guarantees that `currentCount <= maxCapacity` under all conditions, Neon PostgreSQL queries over the internet introduce ~300ms–800ms of latency per transaction. When 10 or more requests hit simultaneously, the queue of transactions waiting for the row lock exceeds Prisma's default 5000ms timeout.
- **Observed Behavior:** Waiters in the queue past 5000ms abort with:
  ```
  PrismaClientKnownRequestError [P2028]: Transaction API error: Transaction already closed
  ```
  The endpoint catches the error and returns a generic HTTP 500 Internal Server Error.
- **Hardening Action:**
  1. Configure transaction options:
     ```typescript
     await prisma.$transaction(async (tx) => { ... }, {
       maxWait: 5000,
       timeout: 15000
     });
     ```
  2. Implement specific error handling in the catch block:
     ```typescript
     if (err.code === 'P2028') {
       return res.status(409).json({ 
         success: false, 
         message: "Registration traffic is high. Please retry." 
       });
     }
     ```

---

#### 2.2 RISK-002: CTF Lock Acquisition Hang During Redis Disconnection
- **Affected File:** `ctf-platform/server/src/lib/locks.ts`
- **Mechanism:**  
  While the CTF server process boots cleanly and WebSocket presence degrades to in-memory tracking when Redis is offline (SEC-007), `acquireLock` directly executes:
  ```typescript
  export async function acquireLock(key: string, ttl: number): Promise<boolean> {
    const result = await redis.set(key, 'locked', 'PX', ttl, 'NX');
    return result === 'OK';
  }
  ```
  `ioredis` does not reject immediately; by default, it queues commands while attempting reconnection. During an active Redis outage, submitting a flag causes the submission route to hang awaiting the lock, until the client HTTP connection times out.
- **Hardening Action:**
  Add a readiness check at the beginning of `acquireLock`:
  ```typescript
  export async function acquireLock(key: string, ttl: number): Promise<boolean> {
    if (!redis || redis.status !== 'ready') {
      // In degraded mode without Redis, bypass distributed lock or use in-memory lock
      return true;
    }
    try {
      const result = await redis.set(key, 'locked', 'PX', ttl, 'NX');
      return result === 'OK';
    } catch {
      return true;
    }
  }
  ```

---

#### 2.3 RISK-003: Stale In-Memory Firewall Cache Window on IP Unblock
- **Affected File:** `server/src/routes/maintenance.ts`
- **Mechanism:**  
  When an administrator blocks an IP via `POST /api/maintenance/firewall/block`, the IP is added to `FirewallPolicyManager.cachedBlockedIps`.
  However, in the unblock endpoint (`POST /api/maintenance/firewall/unblock`):
  ```typescript
  await prisma.blockedIp.delete({ where: { ip } });
  await redisClient.del(`firewall:blocked:${ip}`);
  // Missing: FirewallPolicyManager.cachedBlockedIps.delete(ip);
  ```
  The database and Redis keys are deleted, but the Node.js in-memory Set still contains the IP until the background refresh timer runs (every 30 seconds).
- **Hardening Action:**
  Add explicit in-memory cache eviction in the unblock controller:
  ```typescript
  FirewallPolicyManager.cachedBlockedIps.delete(ip);
  ```

---

### 3. Production Deployment Hardening Checklist
1. **Prisma Connection Pooling:** For 400+ concurrent users, configure PgBouncer connection pooling on the Neon database URL (`?pgbouncer=true&connection_limit=50`).
2. **Transaction Latency Protection:** Increase transaction timeout to 15,000 ms and map `P2028` to HTTP 409.
3. **Redis Cluster Configuration:** Deploy a managed Redis instance (e.g. Upstash or AWS ElastiCache) with automated failover.
4. **Standalone Bundle Deployment:** Build production Next.js bundles (`npm run build && npm start`) to reduce memory footprint from 3.44 GB to < 600 MB.
