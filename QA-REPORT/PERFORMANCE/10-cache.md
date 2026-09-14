# System Performance Engineering — In-Memory L1 Cache Design & Invalidation Specification

## 1. Executive Directive Compliance

Per User Correction Directives:
- Before implementing event/club/global L1 caches, document:
  - Cache key
  - TTL
  - Maximum size
  - Insertion mechanism
  - Lookup mechanism
  - Invalidation mechanism
  - Mutation invalidation lifecycle
  - Restart behavior
  - Multi-instance behavior
  - Stale-data window
  - Failure behavior
- Explicitly verify and test:
  `CREATE`, `UPDATE`, `DELETE`, `PUBLISH`, `UNPUBLISH`, `LIST`, `DETAIL`.
- Do not optimize latency by allowing stale security or business data.

---

## 2. Multi-Tiered Cache Architecture

```
[Incoming Request]
        │
        ▼
┌──────────────────────────────────────┐
│  Tier 1: Process-Local L1 Cache      │  < 0.02 ms (Localhost Memory Map)
│  (Bounded LRU, 500 entries max)      │
└──────────────────┬───────────────────┘
                   │ Cache Miss
                   ▼
┌──────────────────────────────────────┐
│  Tier 2: Distributed Upstash Redis   │  ~240 ms (REST API Transit)
│  (Shared across all node instances)  │
└──────────────────┬───────────────────┘
                   │ Cache Miss
                   ▼
┌──────────────────────────────────────┐
│  Tier 3: Neon Serverless PostgreSQL  │  ~1,027 ms (AWS us-east-1 WAN RTT)
│  (PostgreSQL 16 Engine)              │
└──────────────────────────────────────┘
```

---

## 3. Detailed Cache Contracts

### 3.1 Public Events Catalog (`l1:events:public:list`)
- **Key**: `l1:events:public:list`
- **TTL**: `30 seconds`
- **Maximum Size**: Single aggregate payload entry (`~12 KB` serialized JSON)
- **Insertion**: On cache miss, after retrieving active events from Redis or PostgreSQL.
- **Lookup**: Synchronous Map lookup on `GET /api/events`. Returns in `< 0.02 ms`.
- **Invalidation Triggers**:
  - `CREATE`: When coordinator creates an event, immediately delete `l1:events:public:list`.
  - `UPDATE`: When event metadata or dates change, immediately delete `l1:events:public:list`.
  - `DELETE`: When event is cancelled/deleted, immediately delete `l1:events:public:list`.
  - `PUBLISH`: When draft event is published, immediately delete `l1:events:public:list`.
  - `UNPUBLISH`: When event is un-published, immediately delete `l1:events:public:list`.
- **Restart Behavior**: Map initialized empty on process boot; warms on first request.
- **Multi-Instance Behavior**: Process A invalidates locally and calls `clearEventsCache()` in Redis. Process B will serve cached data for at most 30 seconds before expiring and re-syncing with Redis.
- **Stale-Data Window**:
  - Local process: `0.0 seconds` (synchronous deletion).
  - Cross-instance: Maximum `30.0 seconds` (bounded by TTL).
- **Failure Mode**: Non-throwing memory operations.

### 3.2 Public Event Detail (`l1:events:detail:<idOrSlug>`)
- **Key**: `l1:events:detail:<idOrSlug>`
- **TTL**: `30 seconds`
- **Maximum Size**: Up to 100 recent event details (`~150 KB` RAM)
- **Insertion**: On cache miss in `GET /api/events/public/:slug` or `GET /api/events/:id`.
- **Lookup**: Synchronous Map lookup before hitting database.
- **Invalidation Triggers**:
  - `UPDATE`: Evicts both `id` and `slug` keys.
  - `DELETE`: Evicts both `id` and `slug` keys.
  - `PUBLISH` / `UNPUBLISH`: Evicts both keys.
- **Stale-Data Window**: Max `30 seconds` across cluster.

### 3.3 Clubs Catalog (`l1:clubs:list`)
- **Key**: `l1:clubs:list`
- **TTL**: `300 seconds` (5 minutes)
- **Maximum Size**: Single catalog payload (`~2 KB`)
- **Insertion**: On cache miss in `GET /api/clubs`.
- **Lookup**: Synchronous Map lookup.
- **Invalidation**: On club metadata or lead change.

---

## 4. Mutation Lifecycle Invalidation Matrix

| Lifecycle Action | API Route | L1 Cache Action | L2 Redis Action | DB Persistence | Correctness Guarantee |
|---|---|---|---|---|---|
| `LIST` | `GET /api/events` | Read `l1:events:public:list` | Read `events:public:list` | Query active events | Fast read |
| `DETAIL` | `GET /api/events/public/:slug` | Read `l1:events:detail:<slug>` | Fallback to DB | Query event + lead | Fast read |
| `CREATE` | `POST /api/events` | Delete `l1:events:public:list` | Delete `events:*` | `prisma.event.create` | Instant local invalidation |
| `UPDATE` | `PATCH /api/events/:id` | Delete `l1:events:public:list` & `l1:events:detail:*` | Delete `events:*` | `prisma.event.update` | Instant local invalidation |
| `DELETE` | `DELETE /api/events/:id` | Delete `l1:events:public:list` & `l1:events:detail:*` | Delete `events:*` | `prisma.event.delete` | Instant local invalidation |
| `PUBLISH` | `PATCH /api/events/:id/publish` | Delete `l1:events:public:list` & `l1:events:detail:*` | Delete `events:*` | `prisma.event.update` | Instant local invalidation |
| `UNPUBLISH` | `PATCH /api/events/:id/unpublish` | Delete `l1:events:public:list` & `l1:events:detail:*` | Delete `events:*` | `prisma.event.update` | Instant local invalidation |

---

## 5. Cache Stampede (Thundering Herd) Mitigation

To prevent 20+ concurrent requests from simultaneously hitting the remote database when a cache key expires:
1. **Single-Flight Promise Coalescing**:
   - When a cache miss occurs, the asynchronous fetch promise is stored in an in-flight map (`inFlightFetches.set(key, promise)`).
   - Any concurrent requests arriving while the fetch is pending subscribe to the existing promise rather than launching redundant remote database queries.
   - Upon resolution, the in-flight entry is removed and the result is cached.
2. **Empirical Stampede Test**:
   - Execute 25 simultaneous requests against a cold cache.
   - Verify that exactly **1** query hits PostgreSQL, and the remaining 24 resolve from the coalesced result.
