# System Performance Engineering — Network Topology, Latency Decomposition & Production Modeling

## 1. Executive Summary

This document establishes the empirical network characterization of the SENTINAL platform. In strict accordance with the Master Directive, we delineate between:
- `[APPLICATION]`: Software-level execution cost inherent to SENTINAL code (Node.js runtime, routing, parsing, serialization).
- `[TEST INFRASTRUCTURE]`: Temporary testing topology cost (India-to-US-East-1 WAN transit to Neon PostgreSQL and Upstash Cloud Redis).
- `[PRODUCTION INFRASTRUCTURE]`: Future institutional deployment topology on the CHARUSAT campus network.
- `[COMBINED]`: End-to-end user-perceived performance resulting from application execution across the active transport infrastructure.

---

## 2. Infrastructure Comparison: Test Environment vs CHARUSAT Production

| Architectural Dimension | Current Test Environment (Model A) | Expected CHARUSAT Production (Model B) | Classification |
|---|---|---|---|
| Application Host | Local Workstation (`localhost:4000`, `localhost:5001`) | CHARUSAT Application Server / Container Cluster | `[COMBINED]` |
| Primary Database | Remote Neon Serverless PostgreSQL (`us-east-1`) | CHARUSAT Campus PostgreSQL Instance | `[TEST INFRASTRUCTURE]` vs `[PRODUCTION INFRASTRUCTURE]` |
| Connection Pooler | Remote PgBouncer (`ep-small-art-apfniiyb-pooler...`) | Local PgBouncer or Direct Connection Pool on LAN | `[TEST INFRASTRUCTURE]` vs `[PRODUCTION INFRASTRUCTURE]` |
| Database Network RTT | 210.58 ms (TCP) / 455.08 ms (TCP+TLS) | Anticipated < 1.0 ms (Same LAN / Campus Network) | `[TEST INFRASTRUCTURE]` vs `[PRODUCTION INFRASTRUCTURE]` |
| Cache Engine | Upstash Cloud Redis (REST HTTPS Mode) | CHARUSAT On-Premise Redis (TCP Mode) | `[TEST INFRASTRUCTURE]` vs `[PRODUCTION INFRASTRUCTURE]` |
| Redis Network RTT | ~240 ms – 280 ms per REST request | Anticipated < 0.5 ms (Localhost or Campus LAN) | `[TEST INFRASTRUCTURE]` vs `[PRODUCTION INFRASTRUCTURE]` |
| Database Engine Execution | 0.032 ms (`SELECT 1`) | Expected < 0.050 ms | `[APPLICATION]` |
| Client-to-Server Transit | Local loopback (`localhost`, ~0.5 ms) | Campus Wi-Fi / Intranet (~2 ms – 15 ms) | `[PRODUCTION INFRASTRUCTURE]` |

---

## 3. Decomposed Latency Measurements (Test Environment)

### 3.1 Neon PostgreSQL Decomposition
Source Host: Local Dev Environment (Gujarat, India)  
Target Host: `ep-small-art-apfniiyb-pooler.c-7.us-east-1.aws.neon.tech` (AWS us-east-1, N. Virginia)

```
[Local Client]
      │
      ├─ DNS Lookup:           25.79 ms   [TEST INFRASTRUCTURE]
      ├─ TCP 3-Way Handshake: 210.58 ms   [TEST INFRASTRUCTURE]
      ├─ TLS 1.3 Handshake:   218.71 ms   [TEST INFRASTRUCTURE]
      │   (Total Handshake =  455.08 ms)
      │
      ├─ Network Roundtrip:  1027.23 ms   [TEST INFRASTRUCTURE]
      ├─ SQL Engine Exec:       0.032 ms  [APPLICATION]
      │
      ▼
[PostgreSQL 16 Engine] (Query finished in 32 microseconds)
```

- **Ratio of Network Transit to Database Compute**: `32,101 : 1`.
- **Classification**: `[TEST INFRASTRUCTURE]` dominates `99.997%` of database query latency in the test environment.

### 3.2 Upstash Cloud Redis Decomposition
Source Host: Local Dev Environment  
Target Host: `big-minnow-137825.upstash.io` (Global Edge REST)

- DNS Resolution: `12.36 ms` `[TEST INFRASTRUCTURE]`
- TCP Handshake: `17.55 ms` `[TEST INFRASTRUCTURE]`
- TLS 1.3 Handshake: `22.42 ms` `[TEST INFRASTRUCTURE]`
- REST `SET` Latency: `277.84 ms` `[TEST INFRASTRUCTURE]`
- REST `GET` Latency: `238.63 ms` `[TEST INFRASTRUCTURE]`
- Node.js In-Memory Map Lookup: `0.005 ms` `[APPLICATION]`

---

## 4. CHARUSAT Deployment Modeling (Model B)

When deployed on CHARUSAT infrastructure, the network delay will undergo an order-of-magnitude reduction:
1. **Database RTT Reduction**:
   - Test environment: `~1000 ms` per query.
   - CHARUSAT campus LAN: `~0.5 ms – 2 ms` per query (`> 500×` reduction).
2. **Redis RTT Reduction**:
   - Test environment: `~250 ms` per REST command.
   - CHARUSAT on-premise Redis (TCP): `~0.1 ms – 0.5 ms` (`> 500×` reduction).
3. **Application Optimization Goal**:
   - Do NOT optimize solely for remote test latency.
   - Optimize application-intrinsic patterns (eliminating sequential waterfalls, N+1 queries, duplicate authorizations, and unbounded connection waiting) that improve performance across BOTH test and production topologies.
