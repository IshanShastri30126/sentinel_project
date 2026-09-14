# System Performance Engineering — Environment Specification & Topology Audit

## 1. Executive Overview

This document establishes the verified architectural topology, physical infrastructure, runtime parameters, and physical network decomposition for the SENTINAL platform performance engineering evaluation. All metrics are derived from runtime measurements on the active production-mirrored test environment.

---

## 2. Infrastructure & Service Inventory

| Service Component | Technology / Framework | Host / Port | Environment / Runtime Mode |
|---|---|---|---|
| Main Client | Next.js 16.2.6 / React 19.2.4 | `http://localhost:3000` | Development Server (Next Turbopack / Webpack) |
| Main API Server | Express 4.21.1 / Node.js v22.23.2 | `http://localhost:4000` | Express REST API / tsx watch |
| CTF Client | Next.js 16.2.12 / React 19.2.4 | `http://localhost:3001` | Development Server (Next Turbopack / Webpack) |
| CTF Server | Express 4.21.1 / Socket.io 4.8.1 | `http://localhost:5001` | Express REST + Socket.io Namespace (`/ctf`) |
| Primary Database | PostgreSQL 16.x (Neon Serverless) | AWS `us-east-1` (N. Virginia) | PgBouncer Pooler (`connection_limit=5`, `connect_timeout=15`) |
| Distributed Cache | Upstash Cloud Redis | Global Serverless | REST HTTP API / WebSocket TLS Mode |
| Host Operating System | Microsoft Windows 11 Enterprise | Local Workstation | Node.js v22.23.2 64-bit |

---

## 3. Remote Database Latency Decomposition (Neon PostgreSQL)

Direct probe measurements to `ep-small-art-apfniiyb-pooler.c-7.us-east-1.aws.neon.tech`:

| Measurement Stage | Observed Duration (ms) | Percentage of Total Roundtrip | Root Phenomenon |
|---|---|---|---|
| DNS Resolution | 25.79 ms | 2.51% | Upstream recursive DNS lookup to AWS Route 53 |
| TCP 3-Way Handshake | 210.58 ms | 20.50% | Physical Speed-of-Light India-to-US-East RTT |
| TLS 1.3 Handshake | 218.71 ms | 21.29% | Cryptographic key exchange across trans-continental WAN |
| Total Network Handshake | 455.08 ms | 44.30% | Physical connection establishment overhead |
| Prisma Pool Connection | 1462.80 ms | N/A (One-time / Cold) | PgBouncer backend serverless compute wake + pool allocate |
| PostgreSQL Engine Execution (`SELECT 1`) | 0.032 ms | 0.003% | Actual query planning and execution inside PostgreSQL |
| Client-to-DB End-to-End Roundtrip | 1027.26 ms | 100.0% | Combined WAN transit + PostgreSQL execution + result transfer |

### Critical Finding: The Remote Network Bottleneck
- Database engine planning time: `0.017 ms`.
- Database engine execution time: `0.032 ms`.
- Network transit time: `1027.23 ms`.
- **Verdict**: 99.997% of total database latency is attributable to physical trans-continental WAN transit from the local testing environment to the AWS `us-east-1` data center. The internal PostgreSQL query engine executes in microseconds.

---

## 4. Distributed Cache Latency Decomposition (Upstash Redis)

Direct probe measurements to `big-minnow-137825.upstash.io`:

| Metric Stage | Observed Latency (ms) | Description |
|---|---|---|
| DNS Resolution | 12.36 ms | Name resolution for Upstash edge endpoint |
| TCP Handshake | 17.55 ms | Edge connection handshake |
| TLS Handshake | 22.42 ms | TLS 1.3 session establishment |
| Total Connection Setup | 52.33 ms | Combined TCP/TLS overhead |
| REST API `SET` Operation | 277.84 ms | HTTP POST payload transmission + Redis engine commit |
| REST API `GET` Operation | 238.63 ms | HTTP GET query + JSON serialization + response receipt |

### Critical Finding: Upstash HTTP Roundtrip vs In-Memory Execution
- In-memory Node.js cache lookup: `0.005 ms` to `0.020 ms`.
- Upstash REST roundtrip: `~240 ms` to `~280 ms`.
- Each remote Redis cache hit incurs `~250 ms` of network delay if not cached in a local in-memory L1 cache.

---

## 5. Active Connection Pool Constraints

- Express Server (`server/.env`):
  `connection_limit=5&connect_timeout=15`
- CTF Server (`ctf-platform/server/.env`):
  `connection_limit=5&connect_timeout=15`
- **Implication**: At most 5 concurrent database operations can be in-flight simultaneously per service. With average query latency of `~1000 ms`, each server can sustain a maximum of `5 queries/second` without queuing. Any concurrency exceeding 5 in-flight DB operations will experience linear queue latency escalation.
