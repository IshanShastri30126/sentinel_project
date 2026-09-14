# System Performance Engineering — CTF WebSocket Architecture & Scalability Audit

## 1. Executive Summary

This document details the real-time WebSocket communication layer of the SENTINAL platform. The CTF wargame engine operates on `http://localhost:5001` with an isolated Socket.io namespace (`/ctf`). In this audit, we evaluate connection establishment latency, message broadcast fanout, presence tracking scalability, memory overhead per socket, and reverse-proxy upgrade requirements.

---

## 2. Real-Time WebSocket Architecture

```
[CTF Competitor Clients]
      │
      │ ws:// / wss:// transport
      ▼
┌──────────────────────────────────────┐
│  Socket.io Server (Port 5001)        │
│  Namespace: `/ctf`                   │
│  CORS: Origin-Restricted             │
└──────────────────┬───────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌─────────────────┐ ┌────────────────────────┐
│ Competition Room│ │ Challenge Room         │
│ (Scoreboard &   │ │ (Live Viewer Presence) │
│ Admin Freezes)  │ │                        │
└─────────────────┘ └────────────────────────┘
```

### Event Specifications
1. `joinCompetition(competitionId)`: Client subscribes to real-time scoreboard point changes and admin freeze/unfreeze alerts.
2. `leaveCompetition(competitionId)`: Client un-subscribes from competition room.
3. `viewChallenge(challengeId)`: Client registers presence in challenge room. Server increments viewer count and broadcasts `challengePresence` to room.
4. `leaveChallenge(challengeId)`: Client decrements presence and leaves challenge room.

---

## 3. Presence Engine: Redis vs In-Memory Fallback

- **Distributed Presence (Redis Active)**:
  - Key: `ctf:presence:${challengeId}` (Redis Set)
  - Method: `SADD` on view, `EXPIRE 300`, `SCARD` for count, `SREM` on leave/disconnect.
  - Latency: `~240 ms` per Upstash REST call.
- **In-Memory Fallback (Redis Outage)**:
  - Structure: Process-local `Map<string, Set<string>>` mapping `challengeId` to set of active socket IDs.
  - Latency: `< 0.01 ms`.
  - **Surgical Reliability Fix Applied**: Variable moved from inner socket connection callback to module scope to prevent presence isolation across clients.

---

## 4. Empirical WebSocket Scaling Benchmark Results

Harness: [`tests/perf/websocket_benchmark.ts`](file:///d:/A_Coding/A_MainCodes/Sentinal/tests/perf/websocket_benchmark.ts)  
Raw Data: [`QA-REPORT/PERFORMANCE/experiments/websocket_scale_experiment.json`](file:///d:/A_Coding/A_MainCodes/Sentinal/QA-REPORT/PERFORMANCE/experiments/websocket_scale_experiment.json)

| Target Connections | Connected Sockets | Success Rate (%) | Connect Latency p50 (ms) | Connect Latency p95 (ms) | Broadcast Fanout p50 (ms) | Memory RSS (MB) | Memory Heap (MB) | Stability Verdict |
|---|---|---|---|---|---|---|---|---|
| **10** | 10 | 100.0% | 19.34 ms | 41.25 ms | 0.00 ms | 99.84 MB | 12.59 MB | **STABLE** |
| **25** | 25 | 100.0% | 18.91 ms | 21.27 ms | 0.00 ms | 96.23 MB | 11.01 MB | **STABLE** |
| **50** | 50 | 100.0% | 37.35 ms | 38.66 ms | 0.00 ms | 98.78 MB | 12.34 MB | **STABLE** |
| **100** | 100 | 100.0% | 75.39 ms | 80.60 ms | 0.00 ms | 102.05 MB | 15.36 MB | **STABLE** |
| **200** | 200 | 100.0% | 144.54 ms | 152.74 ms | 0.00 ms | 111.08 MB | 16.80 MB | **STABLE** |
| **400** | 400 | 100.0% | 395.29 ms | 408.06 ms | 0.00 ms | 102.92 MB | 14.67 MB | **STABLE** |

### Critical Finding: Transport Scalability vs Database Saturation
- **WebSocket Transport Scalability**: The Node.js Socket.io service handles **400 simultaneous connections** with zero packet drops, 100% success rate, and only **14.67 MB** of process heap utilization.
- **Comparison to HTTP API**: While the HTTP API experienced pool queue starvation at 25 concurrent users due to remote database round trips, the persistent WebSocket layer scales cleanly to 400 connections because connected sockets do not hold active database pool handles.

---

## 5. Reverse Proxy & CHARUSAT Production Deployment Requirements

To ensure 400+ simultaneous CTF competitors maintain stable real-time connections through institutional firewalls:
1. **Nginx WebSocket Upgrade Directives**:
   ```nginx
   location /ctf/ {
       proxy_pass http://127.0.0.1:5001/ctf/;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_read_timeout 3600s;
       proxy_send_timeout 3600s;
   }
   ```
2. **Worker Connection Ceiling**:
   - `events { worker_connections 2048; }` to handle 400+ concurrent competitors with multiple active browser tabs.
3. **Heartbeat Tuning**:
   - Ping interval: 25 seconds.
   - Ping timeout: 20 seconds.
   - Automatically reclaims memory from dropped Wi-Fi connections within 45 seconds.
