# POST-REMEDIATION INDEPENDENT SECURITY & QA VERIFICATION REPORT
## 05. Reliability & Concurrency Status Report

**Assessment Domain:** Database Row-Level Locking, Race Conditions, Concurrency Scaling & Infrastructure Failure Resilience  
**Target Subsystems:**
- Event Registration Concurrency (`server/src/routes/events.ts`)
- CTF Distributed State, Caching & Locking (`ctf-platform/server/src/lib/*`, `sockets/scoreboard.ts`)

---

### 1. SEC-004: Event Capacity Concurrency & Race Condition Verification

#### 1.1 Defect Description & Baseline Condition
In the pre-remediation baseline, event registration routes queried the current registration count with a standard `SELECT COUNT(*)` and then executed an `INSERT`, allowing concurrent HTTP requests dispatched simultaneously to bypass capacity limits (time-of-check to time-of-use race condition), resulting in oversold events.

#### 1.2 Remediation Architecture
The backend implemented PostgreSQL row-level locking within an interactive Prisma transaction:
```typescript
await prisma.$transaction(async (tx) => {
  // Acquire exclusive row lock on the Event record
  const [event] = await tx.$queryRaw<Event[]>`
    SELECT * FROM "Event" WHERE id = ${eventId} FOR UPDATE
  `;
  
  const currentCount = await tx.eventRegistration.count({
    where: { eventId, status: 'CONFIRMED' }
  });
  
  if (currentCount >= event.maxCapacity) {
    throw new Error('EVENT_CAPACITY_EXCEEDED');
  }
  
  return await tx.eventRegistration.create({ ... });
});
```

#### 1.3 Independent Verification Methodology
Using an automated concurrent dispatcher (`scratch/run_sec004_fixed.js`), requests were fired simultaneously using `Promise.all` across multiple capacity thresholds:

| Run # | Event Capacity Limit | Concurrent Racers | Expected Max Registrations | Actual Registrations in DB | Violations Observed |
|---|---|---|---|---|---|
| **Run 1** | 1 | 2 simultaneous | 1 | **1** | **0** |
| **Run 2** | 1 | 2 simultaneous | 1 | **1** | **0** |
| **Run 3** | 2 | 3 simultaneous | 2 | **2** | **0** |
| **Run 4** | 2 | 3 simultaneous | 2 | **2** | **0** |
| **Run 5** | 5 | 10 simultaneous | <= 5 | **2** | **0** |

#### 1.4 Detailed Findings & Concurrency Bottleneck Analysis
1. **Zero Oversubscription:** Across all 5 test runs, the database count never exceeded `maxCapacity`. The row lock serialized access to the capacity check.
2. **Behavior Under Low Contention (Runs 1 - 4):**
   - Succeeded racers received HTTP 201 Created.
   - Rejected racers received HTTP 400 Bad Request ("Event is at maximum capacity").
3. **Behavior Under High Contention (Run 5):**
   - When 10 concurrent requests hit the row lock simultaneously on Neon PostgreSQL (network-attached database), the serialization queue lengthened.
   - Prisma interactive transactions have a default timeout of **5000 ms** (`maxWait: 2000, timeout: 5000`).
   - Requests waiting in the queue past 5000ms failed with:
     ```
     PrismaClientKnownRequestError [P2028]: Transaction API error: Transaction already closed: 
     Transaction is no longer usable.
     ```
   - These timed-out requests returned HTTP 500 Internal Server Error instead of a graceful HTTP 400 Bad Request.

#### 1.5 Defect Status: CLOSED [With Architectural Note]
The capacity race condition is strictly closed. Capacity cannot be breached. However, under high concurrency spikes, Prisma interactive transaction timeouts must be tuned (`timeout: 15000`) or paired with client retry logic to avoid HTTP 500 errors.

---

### 2. SEC-007 / REL-001: Redis Disconnection Resilience

#### 2.1 Defect Description & Baseline Flaw
When the Redis cache instance on port 6379 was offline, incoming WebSocket connections and flag submissions triggered unhandled promise rejections (`Error: Connection is closed`), crashing the Node.js process and terminating all active participant connections.

#### 2.2 Independent Verification Methodology
1. **Process Boot Without Redis:**
   - The CTF backend (`ctf-platform/server`) was started with Redis offline.
   - The process remained running (`task-8022`) and did not terminate.
   - Console logs confirmed graceful fallback:
     ```
     [WARN] Redis connection failed - running in degraded memory mode.
     [INFO] Socket.IO presence initialized with in-memory adapter.
     ```
2. **Health Check Endpoint:**
   - `GET http://localhost:5001/api/health` was queried with Redis offline.
   - Response: HTTP 200 OK (`{ "status": "ok", "redis": "degraded" }`).
3. **Locking Mechanism Inspection (`ctf-platform/server/src/lib/locks.ts`):**
   - Code review of `acquireLock()` revealed:
     ```typescript
     export async function acquireLock(key: string, ttl: number): Promise<boolean> {
       const result = await redis.set(key, 'locked', 'PX', ttl, 'NX');
       return result === 'OK';
     }
     ```
   - While `scoreboard.ts` guards its calls, `locks.ts` directly invokes `redis.set()` without evaluating `redisReady`.
   - When Redis is down, `acquireLock()` does not crash the server (due to outer try-catch blocks), but it causes the flag submission route to hang while ioredis attempts reconnect retries, delaying the HTTP response until the HTTP request times out.

#### 2.3 Defect Status: PARTIALLY FIXED
The catastrophic server crash (REL-001) has been eliminated; the process boots and maintains WebSocket connectivity in degraded memory mode. However, a residual reliability bug exists in `locks.ts` where lock acquisition does not short-circuit when Redis is disconnected.
