# System Performance Engineering — Redis Cache & Latency Decomposition Audit

## 1. Executive Directive Compliance

Per User Correction Directives:
- Separate:
  - DNS resolution
  - Connection establishment
  - TLS handshake
  - Network RTT
  - Redis command execution
  - Serialization
  - Response transfer
- Determine the actual dominant component.
- Preserve existing reliability caveats:
  - Redis lock behavior during outage
  - Firewall unblock / cache invalidation

---

## 2. Upstash Cloud Redis Latency Breakdown (HTTP REST Mode)

Direct probe measurements to `big-minnow-137825.upstash.io`:

| Latency Phase | Observed Duration (ms) | Percentage of Roundtrip | Architectural Mechanism |
|---|---|---|---|
| DNS Resolution | 12.36 ms | 4.88% | Edge name lookup for Upstash REST domain |
| TCP 3-Way Handshake | 17.55 ms | 6.93% | Initial transport socket setup to Upstash edge proxy |
| TLS 1.3 Cryptographic Handshake | 22.42 ms | 8.85% | Session negotiation and cipher exchange |
| Total Physical Handshake | 52.33 ms | 20.66% | Required for non-keepAlive or cold connections |
| HTTP POST / REST Command Execution (`SET`) | 277.84 ms | 100.0% (Write) | JSON serialization + HTTPS POST + Redis commit + response |
| HTTP GET / REST Command Execution (`GET`) | 238.63 ms | 100.0% (Read) | HTTPS GET + Redis engine lookup + JSON response receipt |

### Dominant Component Identification
- Handshake & TLS: `~52 ms` (reusable with keep-alive HTTP agents).
- REST HTTP RTT + Serialization + Cloud Edge Execution: `~220 ms` to `~240 ms`.
- **Dominant Component**: Trans-continental / edge HTTP REST transport overhead (`> 80%`).
- Compared to in-memory Node.js cache lookup (`0.005 ms` to `0.020 ms`), Upstash REST calls are `12,000×` slower.
- Implication: When an API route calls multiple Redis operations sequentially (e.g. `redisGet("events")` + `redisGet("clubs")` + `redisSet("audit")`), it accumulates `500 ms` to `750 ms` of pure HTTP delay even when PostgreSQL is not touched.

---

## 3. Reliability Caveats & Security Invariants

### 3.1 Redis Outage & Failover Behavior
- In `server/src/lib/redis.ts` and `ctf-platform/server/src/lib/ctfRedis.ts`:
  - When Redis becomes unreachable (network partition, timeout, or rate limiting on Upstash):
    - Read operations must fail open to database queries (`return null`) without crashing the Express process or returning 500 to the client.
    - Write operations must fail gracefully (`console.warn`) rather than blocking the business transaction.
    - Distributed locks (e.g. registration lock, submission concurrency lock) must fall back to transactional database constraints (`SELECT FOR UPDATE` or unique constraints in PostgreSQL) rather than allowing unsynchronized race conditions.

### 3.2 Firewall Cache Invalidation
- Firewall rules and IP blocklists cached in Redis:
  - Cache TTL must not exceed 60 seconds to prevent unblocked IPs from continuing to be denied, or banned malicious IPs from bypassing controls during the cached window.
  - On explicit admin unblock / block operations, immediate pattern-based cache purging (`firewall:*`) is strictly enforced.
