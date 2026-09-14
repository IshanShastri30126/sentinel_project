# SENTINAL — CHARUSAT University Deployment Readiness Specification & Infrastructure Sizing

**Document Identification**: `21-charusat-deployment-readiness.md`  
**Target Environment**: CHARUSAT University Institutional Data Center / Campus Cloud  
**Test Environment Status**: Application performance optimizations have been empirically verified against the current test topology.  
**Production Readiness Status**: Production scalability certification is pending physical validation on CHARUSAT infrastructure.  

---

## 1. Executive Summary

This specification defines the production readiness requirements, institutional infrastructure prerequisites, operational baselines, and on-premises load verification protocols for the deployment of SENTINAL on CHARUSAT university infrastructure.

The currently measured Neon PostgreSQL and Upstash Cloud Redis environments represent **test/staging infrastructure only**. The physical trans-continental WAN network delay (~1,027 ms) observed in staging will be eliminated upon deployment on the campus gigabit network. Final 400-user scalability certification is strictly contingent upon physical validation on the target hardware.

---

## 2. Target Campus Infrastructure Architecture

```
+--------------------------+------------------------------------+---------------------------------------------+
| Architectural Layer      | Institutional Specification        | Production Function                         |
+--------------------------+------------------------------------+---------------------------------------------+
| Edge Reverse Proxy       | Nginx 1.24+ / HAProxy              | TLS 1.3 Termination, HTTP/2, WS Upgrade    |
| Core App Server (Port 4000)| 8 Physical CPU Cores, 16 GB RAM  | Node.js v22 LTS Cluster (PM2 / Docker)      |
| CTF Wargames Server (5001)| Co-located or Containerized Host  | Socket.io Real-Time Engine, Challenge APIs  |
| Database Host            | PostgreSQL 16 (Campus Subnet)      | Dedicated NVMe Storage, Parameterized ORM   |
| In-Memory Cache          | Redis 7.2 Native TCP (Campus Subnet)| L2 Shared Cache, Room Sessions, Locks      |
| Institutional Relays     | mail.charusat.ac.in                | Internal SMTP Relay for Notifications       |
+--------------------------+------------------------------------+---------------------------------------------+
```

---

## 3. Parameter Comparison: Staging vs CHARUSAT Campus

```
+------------------------------------+-----------------------+-----------------------+-------------------------+
| Performance Parameter             | Staging (Measured)    | CHARUSAT (Projected)  | Improvement Factor      |
+------------------------------------+-----------------------+-----------------------+-------------------------+
| Server → Database RTT              | 1,027.26 ms (WAN)     | 0.20 ms – 1.00 ms     | ~1,000× to 5,000× faster|
| Server → Redis RTT                 | 304.25 ms (REST WAN)  | < 0.50 ms (Native TCP)| ~600× faster            |
| Client → Server RTT (Campus WiFi)  | Variable (Public WAN) | 5.00 ms – 15.00 ms    | Consistent Low Latency  |
| Database Connection Acquisition    | 534 ms – 2,910 ms     | < 5.00 ms             | Near-Instantaneous      |
| Database Query Execution           | 0.034 ms              | 0.034 ms              | Identical Engine Speed  |
| Event Creation Total Latency       | 1,829.02 ms           | < 15.00 ms            | ~120× faster            |
| Maximum DB Throughput (15 Conns)   | ~12 QPS               | ~15,000 QPS           | Over 1,200× Capacity    |
+------------------------------------+-----------------------+-------------------------+
```

---

## 4. Connection Pool Calibration Protocol for CHARUSAT

The connection pool limit (`connection_limit=15`) was derived specifically for the high-latency staging environment. It must NOT be assumed optimal for CHARUSAT without on-site testing.

### On-Site Calibration Procedure
Upon provisioning the campus PostgreSQL server, execute concurrent synthetic load testing with `connection_limit` set to:
- **Test A**: `connection_limit = 5`
- **Test B**: `connection_limit = 10`
- **Test C**: `connection_limit = 15`
- **Test D**: `connection_limit = 20`
- **Test E**: `connection_limit = 25`

### Selection Criteria
Select the lowest connection pool value that satisfies:
1. `Queue Wait Time (p95)` < 5.0 ms.
2. Zero `PrismaClientKnownRequestError: P2024` connection timeouts under 400 virtual users.
3. PostgreSQL server connection count remains below 80% of `max_connections`.

---

## 5. Pre-Launch Verification Gate (Non-Negotiable)

Prior to opening the platform to the 400+ student competitor body at CHARUSAT:
1. **Physical Network Verification**: Record decomposed TCP and ping latencies between Application Server, PostgreSQL, and Redis.
2. **Staged Load Execution**: Run `tests/perf/staged_load_benchmark.ts` against the live local deployment across stages 1, 5, 10, 25, 50, 100, 200, and 400 users.
3. **Data Integrity Audit**: Confirm zero race-condition overbooking on events, zero corrupted flag solves, and zero duplicate registrations.
4. **Security Audit**: Confirm SEC-001 through SEC-008 remain 100% PASS on campus infrastructure.

---

## 6. Official Readiness & Certification Formulation

In accordance with Section 39 of the Master Directive:

> **"Application performance optimizations have been empirically verified against the current test topology."**

> **"Production scalability certification is pending physical validation on CHARUSAT infrastructure."**
