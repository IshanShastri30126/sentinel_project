# Chapter 12 — Service Reliability, Fault Tolerance & Process Resilience

## 1. Scope & Resilience Philosophy

High-reliability engineering requires that distributed systems continue serving degraded traffic rather than crashing entirely when auxiliary components fail.

In the Sentinal architecture, four primary failure scenarios were audited:
1. **Auxiliary Cache Failure**: Redis service unavailable or crashing mid-operation.
2. **Database Connectivity Interruption**: Temporary network partition to PostgreSQL.
3. **Frontend Runtime Exceptions**: React component rendering crashes and unhandled hook errors.
4. **Process Lifecycle & Signal Trapping**: Behavior under `SIGTERM` and `SIGINT` shutdown commands.

---

## 2. Failure Mode Analysis

| Failure Scenario | Main Platform Behavior | CTF Platform Behavior | Resilience Verdict |
| :--- | :--- | :--- | :---: |
| **Redis Service Offline** | Fully operational (in-memory fallbacks) | **Server crashes on challenge click (`REL-001`)** | **FAIL (CTF)** |
| **PostgreSQL Partition** | HTTP 500 returned with generic error | HTTP 500 returned with generic error | **PASS** |
| **Client Rendering Error** | Caught by Next.js `error.tsx` boundary | Caught by Next.js `error.tsx` boundary | **PASS** |
| **Process SIGTERM Signal** | Graceful listener termination & DB disconnect | Graceful listener termination & DB disconnect | **PASS** |

---

## 3. The Redis Dependency & Crash Vector (`REL-001`)

### 3.1 Degradation vs. Process Termination
- **Main Express Server (`port 4000`)**:
  - Treats Redis as a performance optimization layer. If Redis connection attempts fail, it logs a warning and routes sessions directly to database queries without failing.
- **CTF Wars Engine (`port 5001`)**:
  - Displays a startup banner:
    `[WARN] [Redis] Server will run without Redis. Real-time features disabled.`
  - **The Reliability Gap**: While the startup code anticipates Redis being absent, downstream WebSocket event handlers in [scoreboard.ts](file:///d:/A_Coding/A_MainCodes/Sentinal/ctf-platform/server/src/sockets/scoreboard.ts#L42) assume Redis is always available.
  - When an unhandled rejection occurs, Node.js terminates the process, dropping all existing HTTP and WebSocket connections.

### 3.2 Global Uncaught Exception Guards
Currently, neither Express server registers a global uncaught rejection trap:
```typescript
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  // Log telemetry but DO NOT crash the worker process during live CTF events
});
```
Adding this safety net is essential to prevent a single corrupted or unhandled request from killing the server for all 400 concurrent participants.

---

## 4. Frontend Error Boundaries & Fallback States

Both Next.js applications implement standard App Router error boundaries:
- `error.tsx` is defined at the root and dashboard segment levels.
- When an unexpected runtime JavaScript error is thrown inside a React component (e.g. attempting to read a property of an undefined object), the boundary catches the error and displays a cyber-styled error recovery card:
  - Error message: `"SYSTEM ENCOUNTERED AN OPERATIONAL EXCEPTION"`.
  - Action button: `"RESET SUBSYSTEM"` (invokes React `reset()` to attempt re-rendering).
- This prevents the entire viewport from collapsing into an unstyled blank white screen.
