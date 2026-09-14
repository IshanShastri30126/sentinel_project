# System Performance Engineering — CHARUSAT Deployment Readiness Specification

## 1. Executive Summary

This document defines the production deployment readiness criteria, institutional infrastructure requirements, operational baselines, and pre-launch verification protocols for the SENTINAL platform on CHARUSAT university infrastructure.

The currently measured Neon PostgreSQL and Upstash Cloud Redis environments represent **test/staging infrastructure only**. Final scalability validation, connection pool sizing, and sub-millisecond response SLAs are contingent upon deployment on the physical or private-cloud CHARUSAT server network.

---

## 2. Infrastructure Inventory: Known vs Unknown

### 2.1 Known Parameters (Established on Test Environment)
- Application Architecture: Express 4.21.1 REST API + Next.js 16.2.x Frontend + Socket.io 4.8.1 real-time CTF engine.
- Runtimes: Node.js v22.x LTS, React 19.x, Prisma ORM 6.x.
- Core Business Boundaries: Strict RBAC hierarchy, HMAC data signing, IP-based rate limiting, audit logging.
- Microsecond SQL Engine Execution: Internal PostgreSQL queries execute in `0.032 ms – 0.052 ms`.

### 2.2 Unknown Parameters (To Be Verified Upon CHARUSAT Provisioning)
- Host Server Hardware: Physical cores, vCPUs, RAM, storage IOPS.
- Database Server Topology: Localhost vs dedicated institutional database VM vs managed PostgreSQL.
- Database Engine Limits: `max_connections` parameter, shared buffer memory (`shared_buffers`), effective cache size.
- Internal Network Latency: Sub-millisecond LAN RTT vs routed inter-VLAN delay across campus subnets.
- Reverse Proxy Configuration: Nginx/HAProxy timeouts for HTTP long-polling and WebSocket upgrades (`proxy_read_timeout`, `proxy_set_header Upgrade $http_upgrade`).
- Redis Deployment Mode: Co-located on app server vs separate LAN host vs disabled (in-memory fallback mode).

---

## 3. CHARUSAT Deployment Readiness Checklist

### 3.1 Network Infrastructure Checklist
- [ ] **Server-to-Database RTT**: Must measure `< 2.0 ms` over institutional LAN (eliminates 1,000 ms trans-continental WAN delay).
- [ ] **Server-to-Redis RTT**: Must measure `< 1.0 ms` for local/LAN Redis (eliminates 250 ms Upstash REST delay).
- [ ] **Client-to-Server RTT**: Must measure `< 20.0 ms` over campus Wi-Fi and wired lab LANs.
- [ ] **Bandwidth**: Minimum 100 Mbps duplex dedicated link to handle simultaneous image asset and certificate downloads.
- [ ] **Institutional DNS**: Internal DNS resolution for `sentinel.charusat.ac.in` resolving in `< 10 ms`.
- [ ] **TLS Termination**: Hardware or reverse-proxy TLS 1.3 termination with valid university SSL/TLS certificate.

### 3.2 Database Server Checklist (PostgreSQL)
- [ ] **PostgreSQL Engine Version**: PostgreSQL 15.x or 16.x 64-bit.
- [ ] **Maximum Connections (`max_connections`)**: Minimum `100` connections configured in `postgresql.conf`.
- [ ] **Connection Pooling (PgBouncer)**: Recommended if application processes exceed 4 worker instances.
- [ ] **Resource Allocation**: Minimum 4 dedicated CPU cores, 8 GB RAM, NVMe SSD storage.
- [ ] **Query Latency Verification**: Run `EXPLAIN ANALYZE` on production schema to verify `p95 < 5.0 ms`.
- [ ] **Automated Backup**: Nightly pg_dump or continuous WAL archiving to institutional backup storage.

### 3.3 Application Server Checklist (Node.js & Express)
- [ ] **Node.js Runtime**: Node.js v20.x or v22.x LTS 64-bit.
- [ ] **Process Management**: PM2 cluster mode or Docker container orchestration (`instances: 'max'` or 2–4 workers).
- [ ] **Memory Ceiling**: Minimum 4 GB RAM allocated per application instance (`--max-old-space-size=2048`).
- [ ] **Reverse Proxy**: Nginx or Caddy configured with:
  - `client_max_body_size 10M;`
  - Gzip / Brotli compression enabled.
  - Security headers (HSTS, CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff).

### 3.4 Redis & Distributed Caching Checklist
- [ ] **Deployment Location**: Same machine (`localhost:6379`) or dedicated LAN host.
- [ ] **Transport Protocol**: Native Redis TCP protocol (not HTTP REST).
- [ ] **Memory Ceiling**: `maxmemory 512mb` with `maxmemory-policy allkeys-lru`.
- [ ] **Persistence**: RDB snapshotting or AOF (append-only file) for session resilience.
- [ ] **High-Availability**: Verify application behavior when Redis process is stopped (must fail open gracefully without crashing).

### 3.5 WebSocket Infrastructure Checklist
- [ ] **Concurrent Connection Capacity**: Reverse proxy configured for minimum `1,000` concurrent WebSocket connections.
- [ ] **Proxy Upgrade Support**: Nginx `Upgrade` and `Connection "upgrade"` headers passed to port 5001.
- [ ] **Proxy Timeout**: `proxy_read_timeout 3600s;` to prevent disconnections during idle CTF phases.
- [ ] **Heartbeat Interval**: Client ping interval 25s, ping timeout 20s to detect dropped Wi-Fi clients.

### 3.6 Operational Observability & Health Checklist
- [ ] **Health Endpoints**: `/api/health` monitored by campus uptime system (e.g. Uptime Kuma, Zabbix).
- [ ] **Audit Logging**: Write audit records to database and daily rotated log files outside container root.
- [ ] **Log Retention**: Minimum 90 days audit log retention for institutional compliance.
- [ ] **Alerting Thresholds**: Automated alert trigger if error rate exceeds 2.0% or memory exceeds 85%.

---

## 4. Required On-Site Measurements Prior to Official Launch

Before signing off on production go-live at CHARUSAT:
1. **Network Probe**: Execute decomposed ping/TCP/TLS measurement between application VM and database server.
2. **Staged Load Execution**: Run `tests/perf/staged_load_benchmark.ts` against the live CHARUSAT deployment across stages: `1 → 5 → 10 → 25 → 50 → 100 → 200 → 400`.
3. **Database Correctness Check**: Verify zero duplicate registrations, zero corrupted scores, and accurate capacity locking under full campus load.
4. **Final Scalability Statement**: Document empirical throughput and establish verified concurrent user capacity.
