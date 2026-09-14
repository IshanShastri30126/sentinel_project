# SENTINAL — CHARUSAT Production Certification & On-Premises Load Testing Plan

**Document Identification**: `24-production-certification-plan.md`  
**Target Environment**: CHARUSAT University Institutional Infrastructure  
**Certification Standard**: IEEE / OWASP / SRE Enterprise Load Testing Standard  
**Test Environment Status**: Application performance optimizations have been empirically verified against the current test topology.  
**Production Readiness Status**: Production scalability certification is pending physical validation on CHARUSAT infrastructure.  

---

## 1. Objectives & Scope

This document specifies the exact, non-negotiable verification and certification protocol required when SENTINAL is physically deployed on CHARUSAT campus hardware. 

Certification for **400 Simultaneous Integrated Users** cannot be declared on the staging environment due to remote trans-continental database transit. It must be proven on the target infrastructure prior to opening event registrations to the university student body.

---

## 2. On-Campus Physical Infrastructure Prerequisites

```
+--------------------------+------------------------------------+---------------------------------------------+
| Infrastructure Component | Minimum Required Specification     | Target Configuration                        |
+--------------------------+------------------------------------+---------------------------------------------+
| Application Server       | 8 Physical Cores, 16 GB RAM        | Ubuntu 24.04 LTS, Node.js v22 LTS, PM2/K8s  |
| Database Server          | 4 Physical Cores, 16 GB RAM, NVMe  | PostgreSQL 16 on Local University Subnet    |
| In-Memory Cache          | 2 Cores, 4 GB RAM                  | Redis 7.2 TCP Socket on Application Host    |
| Reverse Proxy            | Nginx 1.24+ / HAProxy              | HTTP/2, WebSocket Upgrade, Strict TLS 1.3  |
| Internal Campus Network  | 1 Gbps Full-Duplex Ethernet        | Low-latency LAN (Sub-millisecond RTT)       |
+--------------------------+------------------------------------+---------------------------------------------+
```

---

## 3. Pre-Launch Verification Checklist (Phase 1)

Before launching any virtual user tests, the following baseline measurements must be recorded on-site:

1. **Network Latency Audits**:
   - `Application Server → PostgreSQL RTT`: Must measure **< 1.0 ms** via ICMP ping and TCP SYN.
   - `Application Server → Redis RTT`: Must measure **< 0.5 ms** via TCP benchmark.
   - `Client (Campus WiFi / Lab) → Application Server RTT`: Must measure **< 15.0 ms**.
2. **Database Engine & Connection Pool Calibration**:
   - Connection pool evaluation: Test `connection_limit` at values 5, 10, 15, 20, 25.
   - Select configuration where acquisition queue latency remains **< 5.0 ms**.
   - Verify PostgreSQL `shared_buffers = 4GB`, `work_mem = 64MB`, `max_connections = 100`.
3. **Redis Native TCP Performance**:
   - Benchmark native TCP SET/GET latency: Must achieve **> 50,000 ops/sec** at **< 0.5 ms**.

---

## 4. Staged 400-User Load Testing Protocol (Phase 2)

Load testing must proceed through discrete stages. Progression to the next stage is blocked if the current stage exhibits errors or latency degradation beyond targets.

```
+-------+--------------------+---------------------+-------------------------------------------------------+
| Stage | Concurrent Users   | Hold Duration       | Simulated Activity Mix                                |
+-------+--------------------+---------------------+-------------------------------------------------------+
| S1    | 1 User             | 2 Minutes           | Smoke test baseline (Login, Event View, CTF Join)     |
| S2    | 10 Users           | 5 Minutes           | Team creation, registration, profile editing          |
| S3    | 25 Users           | 5 Minutes           | Multi-user event registration, notifications polling   |
| S4    | 50 Users           | 5 Minutes           | Live CTF competition start, challenge unlocking       |
| S5    | 100 Users          | 10 Minutes          | Real-time flag submission, live scoreboard broadcast  |
| S6    | 200 Users          | 10 Minutes          | Mixed browsing, CTF solving, dashboard refreshes      |
| S7    | 400 Users          | 15 Minutes          | Full peak tournament simulation (All 400 Active)      |
+-------+--------------------+---------------------+-------------------------------------------------------+
```

### Required User Journey Distribution (400 Users)
- **150 Competitors (CTF Wars)**: Submitting flags, unlocking hints, polling scores via WebSocket.
- **150 General Students (Portal)**: Browsing events, viewing schedules, downloading certificates.
- **50 Team Leaders**: Managing team rosters, generating join codes, updating member readiness.
- **30 Coordinators**: Scanning QR attendance, monitoring approvals, reviewing live dashboards.
- **20 Faculty Coordinators**: Overseeing audit logs, approving events, managing clearances.

---

## 5. 400-User Production Certification Acceptance Criteria

The system will receive formal certification **ONLY IF ALL 14 CRITERIA ARE MET SIMULTANEOUSLY**:

```
+-----+---------------------------------------------+-----------------------+-------------------------+
| #   | Evaluation Criteria                         | Required Threshold    | Verification Method     |
+-----+---------------------------------------------+-----------------------+-------------------------+
| 1   | 400 Concurrent Active User Success Rate     | > 99.5%               | HTTP/WS Access Logs     |
| 2   | Cached Route p95 Latency                    | < 150 ms              | APM Telemetry           |
| 3   | Authenticated Read Route p95 Latency        | < 350 ms              | APM Telemetry           |
| 4   | Mutation / Write Route p95 Latency          | < 600 ms              | APM Telemetry           |
| 5   | Real-Time Scoreboard Propagation Delay      | < 500 ms              | WebSocket Event Timing  |
| 6   | Database Connection Acquisition Wait Time   | < 10 ms (p95)         | Prisma Metrics          |
| 7   | Database Deadlocks or Rollbacks             | 0 Deadlocks           | PostgreSQL pg_stat      |
| 8   | Node.js Process Memory Leakage              | 0 Unbounded Growth    | Memory Snapshot Delta   |
| 9   | Node.js Event Loop Delay Under 400 Load     | < 50 ms (p99)         | perf_hooks Telemetry    |
| 10  | Redis Memory / Queue Stability              | 0 Uncontrolled Growth | INFO Memory Telemetry   |
| 11  | Dropped WebSocket Messages                  | 0 Dropped Messages    | Socket.io Ack Audit     |
| 12  | Data Consistency (Overbooking / Duplicate)  | 0 Inconsistencies     | SQL Integrity Invariant |
| 13  | Security Regression (SEC-001 to SEC-008)    | 100% PASS             | Security Regression Run |
| 14  | Error Rate Under Sustained 400 Peak         | < 0.1%                | Status Code Analysis    |
+-----+---------------------------------------------+-----------------------+-------------------------+
```

---

## 6. Formal Certification Language Contract

Until the Phase 2 test protocol is physically executed and approved on CHARUSAT campus hardware, all public documentation, reports, and architecture specifications must maintain this exact certification boundary:

> **"Application performance optimizations have been empirically verified against the current test topology."**

> **"Production scalability certification is pending physical validation on CHARUSAT infrastructure."**
