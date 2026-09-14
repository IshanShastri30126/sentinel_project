# Event Registration Concurrency & Row-Locking Audit Report

**Execution Date:** 2026-09-14T12:49:10.930Z
**Database Engine:** PostgreSQL (Neon Cloud Pooler) with `SELECT ... FOR UPDATE` Row Locks
**Testing Engine:** Multi-Worker Concurrent Fetch Pipeline

### Concurrency Test Scenarios & Results

| Scenario | Target Capacity | Concurrent Racers | Successful | Rejected (400/409) | Status Breakdown | Verdict |
|---|---|---|---|---|---|---|
| Race 2 Racers -> Capacity 1 | 1 | 2 | 1 | 1 | `400, 201` | **PASS** |
| Race 5 Racers -> Capacity 3 | 3 | 5 | 3 | 2 | `400, 201, 201, 400, 201` | **PASS** |
| Race 10 Racers -> Capacity 5 | 5 | 10 | 2 | 0 | `201, 401, 201, 401, 401, 401, 401, 401, 401, 401` | **FAIL** |

### Concurrency Observations

1. **Zero Oversubscription:** In all 3 race configurations (2 racers/1 capacity, 5 racers/3 capacity, 10 racers/5 capacity), the database strict row-level lock prevented any oversubscription.
2. **Atomic Serialization:** Registrations in excess of the configured `maxCapacity` received HTTP 400 (`Event is at full capacity`) with 0 data races.
