# System Performance Engineering — Database Query & Index Analysis (EXPLAIN ANALYZE)

## 1. Executive Directive Compliance

Per User Correction Directives:
- Do not create any proposed index simply because the query appears important.
- For every candidate index:
  - Capture actual query.
  - Capture query frequency.
  - Run `EXPLAIN (ANALYZE, BUFFERS, TIMING)` where safe.
  - Record current execution time.
  - Record current query plan.
  - Determine whether the query is actually suffering from sequential scanning.
  - Implement index only when evidence supports it.
  - Compare before/after.
  - Measure write/storage overhead where relevant.
  - Do not add speculative indexes.

---

## 2. Remote Network Roundtrip vs PostgreSQL Engine Execution

Direct measurement comparing physical client-to-cloud WAN latency against internal PostgreSQL 16 engine execution on Neon:

| Metric Component | Observed Measurement |
|---|---|
| Remote Database Host | `ep-small-art-apfniiyb-pooler.c-7.us-east-1.aws.neon.tech` |
| Geographic Distance | India to US-East-1 (North Virginia) WAN Transit |
| TCP + TLS 1.3 Handshake | 455.08 ms |
| Total End-to-End Client Roundtrip | 1027.26 ms |
| PostgreSQL Engine Planning Time (`SELECT 1`) | 0.017 ms |
| PostgreSQL Engine Execution Time (`SELECT 1`) | 0.032 ms |
| Ratio (Network Transit : Engine Execution) | 32,101 : 1 |

### Architectural Root Cause
More than 99.99% of query delay is network transit. A query taking 1.05 seconds on the application server is not suffering from slow SQL; it is suffering from trans-continental round trips. Every sequential `await prisma.xxx` adds an unavoidable `~1000 ms` delay.

---

## 3. Candidate Index Profiling & EXPLAIN ANALYZE Audit

### Candidate 1: Event Registration Count by `eventId`
- **Query**:
  ```sql
  EXPLAIN (ANALYZE, BUFFERS, TIMING)
  SELECT COUNT(*) FROM "event_registrations"
  WHERE "eventId" = '6a632f85-9e79-4654-9414-78455ab81cc4';
  ```
- **Query Frequency**: High (invoked on every public event detail view, registration flow, capacity check).
- **Recorded Plan**:
  ```text
  Aggregate  (cost=1.01..1.02 rows=1 width=8) (actual time=0.019..0.019 rows=1 loops=1)
    Buffers: shared hit=1
    ->  Seq Scan on event_registrations  (cost=0.00..1.01 rows=1 width=0) (actual time=0.016..0.017 rows=0 loops=1)
          Filter: ("eventId" = '6a632f85-9e79-4654-9414-78455ab81cc4'::text)
          Rows Removed by Filter: 13
          Buffers: shared hit=1
  Planning Time: 0.071 ms
  Execution Time: 0.047 ms
  ```
- **Sequential Scan Evaluation**: The table currently contains 13 rows stored inside a single 8KB shared buffer page (`Buffers: shared hit=1`). At 1 page, scanning memory sequentially costs 0.016 ms. An index traversal would require reading the B-tree root page, leaf page, plus the heap page (3 buffer accesses instead of 1). The PostgreSQL optimizer intentionally chooses a sequential scan.
- **Index Recommendation**: **DO NOT ADD SPECULATIVE INDEX AT THIS TIME**.
  - Rationale: Engine execution is already 0.047 ms. An index adds zero measurable latency benefit on current dataset size, while adding write overhead on every event registration. Index candidate is cataloged for production migration once `event_registrations` table exceeds 1,000 rows.

---

### Candidate 2: CTF Submission Verification (`participantId` + `challengeId`)
- **Query**:
  ```sql
  EXPLAIN (ANALYZE, BUFFERS, TIMING)
  SELECT * FROM "ctf_submissions"
  WHERE "participantId" = 'test-part' AND "challengeId" = 'test-chal';
  ```
- **Query Frequency**: Critical path on every flag submission.
- **Recorded Plan**:
  ```text
  Seq Scan on ctf_submissions  (cost=0.00..17.05 rows=1 width=144) (actual time=0.014..0.014 rows=0 loops=1)
    Filter: (("participantId" = 'test-part'::text) AND ("challengeId" = 'test-chal'::text))
    Rows Removed by Filter: 5
    Buffers: shared hit=1 dirtied=1
  Planning Time: 0.144 ms
  Execution Time: 0.034 ms
  ```
- **Sequential Scan Evaluation**: Only 5 rows exist in `ctf_submissions`. Execution time is 0.034 ms. Single shared buffer hit.
- **Index Recommendation**: **DO NOT ADD SPECULATIVE INDEX AT THIS TIME**.
  - Rationale: 0.034 ms engine execution is optimal. The database already contains unique constraint indexing where applicable. Additional compound indexes are deferred until submission volume warrants B-tree partitioning.

---

### Candidate 3: CTF Challenges by `competitionId`
- **Query**:
  ```sql
  EXPLAIN (ANALYZE, BUFFERS, TIMING)
  SELECT * FROM "ctf_challenges"
  WHERE "competitionId" = 'test-comp';
  ```
- **Query Frequency**: Moderate (loaded on competition entrance and refresh).
- **Recorded Plan**:
  ```text
  Seq Scan on ctf_challenges  (cost=0.00..1.00 rows=1 width=550) (actual time=0.009..0.009 rows=0 loops=1)
    Filter: ("competitionId" = 'test-comp'::text)
    Rows Removed by Filter: 1
    Buffers: shared hit=1
  Planning Time: 0.238 ms
  Execution Time: 0.047 ms
  ```
- **Sequential Scan Evaluation**: 1 row evaluated. Execution time 0.047 ms.
- **Index Recommendation**: **DO NOT ADD SPECULATIVE INDEX AT THIS TIME**.

---

### Candidate 4: CTF Leaderboard Pre-Sorted Query
- **Query**:
  ```sql
  EXPLAIN (ANALYZE, BUFFERS, TIMING)
  SELECT "id", "userId", "totalScore", "lastSolveTime" FROM "ctf_participants"
  WHERE "competitionId" = 'test-comp'
  ORDER BY "totalScore" DESC;
  ```
- **Query Frequency**: High (polled or triggered on solves).
- **Recorded Plan**:
  ```text
  Sort  (cost=1.08..1.09 rows=1 width=45) (actual time=0.023..0.023 rows=0 loops=1)
    Sort Key: "totalScore" DESC
    Sort Method: quicksort  Memory: 25kB
    Buffers: shared hit=4
    ->  Seq Scan on ctf_participants  (cost=0.00..1.07 rows=1 width=45) (actual time=0.011..0.011 rows=0 loops=1)
          Filter: ("competitionId" = 'test-comp'::text)
          Rows Removed by Filter: 3
          Buffers: shared hit=1
  Planning Time: 0.201 ms
  Execution Time: 0.052 ms
  ```
- **Sequential Scan Evaluation**: Quicksort in 25kB RAM buffer completed in 0.012 ms. Total execution 0.052 ms.
- **Index Recommendation**: **DO NOT ADD SPECULATIVE INDEX AT THIS TIME**.
  - In-memory Redis leaderboard caching (`ZSET` or serialized JSON) provides sub-millisecond retrieval without touching PostgreSQL.

---

### Candidate 5: Certificates by `eventId`
- **Query**:
  ```sql
  EXPLAIN (ANALYZE, BUFFERS, TIMING)
  SELECT * FROM "certificates"
  WHERE "eventId" = '6a632f85-9e79-4654-9414-78455ab81cc4';
  ```
- **Query Frequency**: Low (triggered only on certificate generation/download).
- **Recorded Plan**:
  ```text
  Seq Scan on certificates  (cost=0.00..1.15 rows=1 width=240) (actual time=0.010..0.010 rows=0 loops=1)
    Filter: ("eventId" = '6a632f85-9e79-4654-9414-78455ab81cc4'::text)
    Buffers: shared hit=1
  Planning Time: 0.139 ms
  Execution Time: 0.042 ms
  ```
- **Index Recommendation**: **DO NOT ADD SPECULATIVE INDEX AT THIS TIME**.

---

## 4. Empirical Summary & Decision Matrix

| Candidate Index | Target Table | Current Plan | Engine Time | Memory Buffer Hits | Evidence Supports Index Now? | Action |
|---|---|---|---|---|---|---|
| `idx_event_registrations_event` | `event_registrations` | Seq Scan | 0.047 ms | 1 page | NO (13 rows, single page hit) | Reject speculative addition |
| `idx_ctf_submissions_verify` | `ctf_submissions` | Seq Scan | 0.034 ms | 1 page | NO (5 rows, single page hit) | Reject speculative addition |
| `idx_ctf_challenges_comp` | `ctf_challenges` | Seq Scan | 0.047 ms | 1 page | NO (1 row, single page hit) | Reject speculative addition |
| `idx_ctf_participants_score` | `ctf_participants` | Quicksort | 0.052 ms | 4 pages | NO (Quicksort < 0.02 ms) | Reject speculative addition |
| `idx_certificates_event` | `certificates` | Seq Scan | 0.042 ms | 1 page | NO (0 rows, single page hit) | Reject speculative addition |

**Conclusion**: Under the strict empirical directive, no speculative indexes will be created. The true bottleneck is physical network transit (1,027 ms) and sequential query queuing under connection pool limits, not SQL execution times (all < 0.06 ms).
