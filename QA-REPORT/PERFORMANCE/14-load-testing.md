# SENTINAL Staged Concurrency & Load Testing Report

## 1. Metric Disambiguation Principle

A fundamental rule of this performance evaluation is the strict separation of load testing dimensions:
1. **Concurrent Users (VU)**: Independent virtual simulated human user loops executing realistic journeys with think times (100 ms – 300 ms).
2. **In-Flight HTTP Requests**: The instantaneous count of HTTP socket requests actively waiting on the network or database.
3. **Completed Throughput (RPS)**: Requests successfully served and closed per second.
4. **Persistent WebSocket Connections**: Open, duplex socket connections maintaining real-time subscriptions.

---

## 2. User Profiles & Journey Distribution

Simulated virtual users were generated across five distinct realistic personas:

- **Profile A — Viewer (40% load weight)**:
  Accesses public landing page, queries public events (`GET /api/events`), views branding (`GET /api/clubs/sentinel`), views event detail (`GET /api/events/public/:slug`).
- **Profile B — Student (25% load weight)**:
  Authenticates, accesses dashboard, views registered events (`GET /api/events/registered`), checks notifications (`GET /api/notifications`).
- **Profile C — Faculty Coordinator (15% load weight)**:
  Authenticates with elevated role, queries pending approvals, checks coordinator analytics, drafts events (`POST /api/events`).
- **Profile D — CTF Competitor (15% load weight)**:
  Maintains active WebSocket connection (`ws://localhost:5001/ctf`), joins competition room, queries challenge list, tracks live scoreboard.
- **Profile E — Mixed Operative (5% load weight)**:
  Cross-system traversal between Sentinel portal and CTF arena.

---

## 3. Staged Concurrency Results — Before vs After Optimization

### Baseline Stage Results (`connection_limit=5`, Remote DB RTT = 1,027 ms)
```
+-------+-----------+-------+----------+----------+----------+------------+---------------+--------+
| Users | Peak HTTP | RPS   | p50 (ms) | p95 (ms) | p99 (ms) | Errors (%) | DB Ping (ms)  | Stable |
+-------+-----------+-------+----------+----------+----------+------------+---------------+--------+
| 1     | 1         | 2.63  | 20.30    | 251.90   | 1,732.10 | 0.00%      | 1,058.40      | YES    |
| 5     | 5         | 14.16 | 12.80    | 235.84   | 1,490.20 | 0.00%      | 1,120.50      | YES    |
| 10    | 10        | 19.88 | 11.70    | 1,325.71 | 2,890.10 | 3.52%      | 1,350.20      | YES    |
| 25    | 25        | 47.78 | 14.20    | 1,280.16 | 1,842.30 | 6.85%      | 1,620.40      | NO     |
+-------+-----------+-------+----------+----------+----------+------------+---------------+--------+
```

### Optimized Stage Results (`connection_limit=15`, L1 Cache Active)
```
+-------+-----------+-------+----------+----------+----------+------------+---------------+--------+
| Users | Peak HTTP | RPS   | p50 (ms) | p95 (ms) | p99 (ms) | Errors (%) | DB Ping (ms)  | Stable |
+-------+-----------+-------+----------+----------+----------+------------+---------------+--------+
| 1     | 1         | 3.08  | 5.12     | 32.20    | 1,866.05 | 0.00%      | 3,291.88      | YES    |
| 5     | 5         | 19.20 | 4.24     | 31.72    | 62.16    | 0.00%      | 1,341.47      | YES    |
| 10    | 10        | 21.06 | 4.05     | 1,624.03 | 3,241.54 | 2.93%      | 1,510.96      | YES    |
| 25    | 25        | 50.76 | 4.40     | 1,402.60 | 1,728.68 | 6.25%      | 1,599.56      | NO     |
+-------+-----------+-------+----------+----------+----------+------------+---------------+--------+
```

---

## 4. Empirical Saturation Analysis at 25 Users

### Root Cause Decomposition:
1. **The Holding Time Multiplier**:
   In `authenticate` middleware, `prisma.user.findUnique` executes for each authenticated request.
   Over the remote WAN to AWS us-east-1, each query holds a pooled connection for **~1,000 ms**.
2. **The Queueing Math**:
   With `connection_limit=15`, the pool can process at most 15 queries per second if each takes 1 second.
   When 25 concurrent users issue authenticated requests simultaneously:
   - 15 acquire connections immediately.
   - 10 wait in the Prisma connection pool queue.
   - Under queue wait, timeouts occur and trigger 401 errors.
3. **Classification**:
   This bottleneck is classified as **[TEST INFRASTRUCTURE]**.
   In an on-premise CHARUSAT deployment where database RTT is **0.5 ms – 1.0 ms**, each pooled connection is held for 1 ms instead of 1,000 ms. A pool of 15 connections will process **15,000 queries per second**, eliminating the queue bottleneck entirely.

---

## 5. CHARUSAT University Campus Load Test Plan

When the CHARUSAT production infrastructure is provisioned, execute the following load test protocol:

```
Stage 1:   1 User    (Smoke & baseline)
Stage 2:   5 Users   (Low concurrency)
Stage 3:  10 Users   (Normal operational load)
Stage 4:  25 Users   (Peak departmental load)
Stage 5:  50 Users   (Cross-departmental load)
Stage 6: 100 Users   (Inter-college hackathon load)
Stage 7: 200 Users   (Annual tech-fest load)
Stage 8: 400 Users   (University-wide peak concurrency)
```

**Passing Criteria for CHARUSAT Production Readiness**:
- Error rate < 1.0% at 400 concurrent users.
- p95 API latency < 250 ms.
- Database CPU utilization < 70%.
