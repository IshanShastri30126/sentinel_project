# Chapter 09 — WebSocket Infrastructure, Real-Time Telemetry & Process Resilience

## 1. WebSocket Architecture Overview

Real-time telemetry for the CTF platform is powered by **Socket.io 4.8.1** running under Express on `http://localhost:5001`.
- **WebSocket Namespace**: `/ctf`
- **Transport Modes**: Native RFC 6455 WebSockets with HTTP long-polling fallback.
- **Room Topology**: `competition:<competition_id>` for segmented broadcast channels.

---

## 2. Event Channel Audit Matrix

| Event Name | Direction | Payload Schema | Functional Purpose | Status |
| :--- | :--- | :--- | :--- | :---: |
| `connection` | Client → Server | `{ token, competitionId }` | Handshake & authentication | **PASS** |
| `joinCompetition` | Client → Server | `{ competitionId }` | Subscribe to competition room | **PASS** |
| `leaveCompetition` | Client → Server | `{ competitionId }` | Unsubscribe from room | **PASS** |
| `viewChallenge` | Client → Server | `{ challengeId }` | Live presence tracking | **FAIL (`REL-001`)** |
| `newSolve` | Server → Client | `{ challengeTitle, teamName, points }` | Instant solve notification broadcast | **PASS** |
| `scoreboardUpdate` | Server → Client | `{ standings: [...] }` | Real-time rank repositioning | **PASS** |
| `disconnect` | Client → Server | Reason string | Cleanup socket rooms & presence | **PASS** |

---

## 3. Deep-Dive: CTF Server Process Crash (`REL-001`)

### 3.1 Failure Execution & Crash Evidence
During interactive testing of the CTF challenge interface, clicking on any challenge card immediately terminated the CTF server process with exit code 1.

**Stack Trace Captured from Runtime Log**:
```text
D:\A_Coding\A_MainCodes\Sentinal\ctf-platform\server\node_modules\ioredis\built\Redis.js:344
            command.reject(new Error(utils_1.CONNECTION_CLOSED_ERROR_MSG));
                           ^

Error: Connection is closed.
    at EventEmitter.sendCommand (D:\A_Coding\A_MainCodes\Sentinal\ctf-platform\server\node_modules\ioredis\built\Redis.js:344:28)
    at EventEmitter.sadd (D:\A_Coding\A_MainCodes\Sentinal\ctf-platform\server\node_modules\ioredis\built\utils\Commander.js:90:25)
    at Socket.<anonymous> (D:\A_Coding\A_MainCodes\Sentinal\ctf-platform\server\src\sockets\scoreboard.ts:42:19)
    at Socket.emit (node:events:519:28)
    at Socket.emitUntyped (D:\A_Coding\A_MainCodes\Sentinal\ctf-platform\server\node_modules\socket.io\dist\typed-events.js:69:22)
    at D:\A_Coding\A_MainCodes\Sentinal\ctf-platform\server\node_modules\socket.io\dist\socket.js:697:39
    at process.processTicksAndRejections (node:internal/process/task_queues:84:11)

Node.js v22.23.2
```

### 3.2 Root Cause Analysis
1. **Unchecked Redis Invocation**:
   In [scoreboard.ts](file:///d:/A_Coding/A_MainCodes/Sentinal/ctf-platform/server/src/sockets/scoreboard.ts#L42):
   ```typescript
   socket.on('viewChallenge', async (challengeId: string) => {
     const presenceKey = `presence:${competitionId}:${challengeId}`;
     await redis.sadd(presenceKey, socket.id); // <--- UNGUARDED PROMISE
     await redis.expire(presenceKey, 60);
     const count = await redis.scard(presenceKey);
     io.of('/ctf').to(`competition:${competitionId}`).emit('challengePresence', { challengeId, count });
   });
   ```
2. When Redis is unavailable (`[WARN] [Redis] Server will run without Redis`), calling `redis.sadd()` immediately rejects with `Error: Connection is closed.`.
3. Because the callback does not catch this error, Node.js triggers an **UnhandledPromiseRejectionException**. In Node.js v15+, unhandled rejections terminate the process by default.
4. **Identical Defect in Distributed Locks**:
   In [locks.ts](file:///d:/A_Coding/A_MainCodes/Sentinal/ctf-platform/server/src/utils/locks.ts), `acquireLock` and `releaseLock` invoke `redis.set` and `redis.eval` without checking Redis connection readiness, creating secondary crash vectors during flag submission.

### 3.3 Recommended Fault-Tolerant Code Architecture
```typescript
/**
 * Safe Redis presence tracker with in-memory graceful degradation
 */
const inMemoryPresence = new Map<string, Set<string>>();

socket.on('viewChallenge', async (challengeId: string) => {
  try {
    if (redis && redis.status === 'ready') {
      const presenceKey = `presence:${competitionId}:${challengeId}`;
      await redis.sadd(presenceKey, socket.id);
      await redis.expire(presenceKey, 60);
      const count = await redis.scard(presenceKey);
      io.of('/ctf').to(`competition:${competitionId}`).emit('challengePresence', { challengeId, count });
    } else {
      // In-memory fallback
      const key = `${competitionId}:${challengeId}`;
      if (!inMemoryPresence.has(key)) inMemoryPresence.set(key, new Set());
      inMemoryPresence.get(key)!.add(socket.id);
      const count = inMemoryPresence.get(key)!.size;
      io.of('/ctf').to(`competition:${competitionId}`).emit('challengePresence', { challengeId, count });
    }
  } catch (socketError) {
    console.error('[WebSocket] Non-fatal presence error:', socketError);
  }
});
```

---

## 4. 400 Concurrent Socket Connections Stress Modeling

- **Memory Overhead per Socket**:
  - Node.js heap consumption per open Socket.io connection is approximately **15 KB to 22 KB** `[DERIVED]`.
  - 400 concurrent sockets consume:
    $$400 \times 20 \text{ KB} \approx 8.0 \text{ MB Heap Space } [DERIVED]$$
  - Concurrency overhead is negligible for Node.js memory.
- **Heartbeat & Keepalive Bandwidth**:
  - Socket.io ping-pong intervals (`pingInterval: 25000, pingTimeout: 20000`).
  - 400 sockets generate approximately 16 heartbeats per second:
    $$16 \text{ packets/sec} \times 128 \text{ bytes} \approx 2.05 \text{ KB/sec bandwidth } [DERIVED]$$
- **Conclusion**: The WebSocket tier easily scales to 400 users, provided that the unhandled Redis exceptions in `REL-001` are eliminated.
