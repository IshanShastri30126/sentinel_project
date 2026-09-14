# SENTINAL Functional Regression & Data Correctness Verification

## 1. Scope & Verification Mandate

Following performance optimizations (Connection Pool scaling to 15, In-Memory L1 Cache implementation, batched lead validations, concurrent Redis cache evictions, and package import tree-shaking), a complete functional verification was executed across all 16 critical user workflows.

No result has been marked PASS from a previous test run; all workflows were actively executed against the live system.

---

## 2. 16 Core User Workflows Verification Matrix

```
+----+-----------------------+------------------------------------------+-----------------------+--------+
| #  | Workflow              | Verification Test Method                 | Expected Response     | Status |
+----+-----------------------+------------------------------------------+-----------------------+--------+
| 1  | LOGIN                 | POST /api/auth/login                     | 200 + Signed JWT      | PASS   |
| 2  | LOGOUT                | POST /api/auth/logout                    | 200 + Cookie cleared  | PASS   |
| 3  | DASHBOARD             | GET /dashboard (Client SSR)              | 200 + Prerender HTML  | PASS   |
| 4  | EVENT CREATION        | POST /api/events (Faculty Token)         | 201 + Event Object    | PASS   |
| 5  | EVENT REGISTRATION    | POST /api/events/:id/register (Student)  | 200 + Registration    | PASS   |
| 6  | CTF TRANSITION        | Navigation: Sentinel -> CTF Arena        | Seamless Token Handoff| PASS   |
| 7  | CHALLENGE LOADING     | GET /api/challenges/competition/:id      | 200 + Challenge List  | PASS   |
| 8  | HINT UNLOCK           | POST /api/hints/:id/unlock               | 200 + Hint Decrypted  | PASS   |
| 9  | FLAG SUBMISSION       | POST /api/submissions (Flag Hash)        | 200 + Correct/Fail    | PASS   |
| 10 | SCOREBOARD            | WS broadcast + GET /api/leaderboard      | Live Rank Array       | PASS   |
| 11 | NOTIFICATIONS         | GET /api/notifications                   | 200 + User Alerts     | PASS   |
| 12 | ROLE ACCESS (RBAC)    | Student blocked from Coordinator routes  | 403 Forbidden         | PASS   |
| 13 | REFRESH RESILIENCE    | Hard Reload on /dashboard and /challenges| Session Intact        | PASS   |
| 14 | BROWSER BACK          | History Back from Event Detail to List   | Instant Cache Restore | PASS   |
| 15 | BROWSER FORWARD       | History Forward to Event Detail          | Instant Cache Restore | PASS   |
| 16 | HEALTH & STATUS       | GET /api/health (Main: 4000, CTF: 5001)  | 200 OK across both    | PASS   |
+----+-----------------------+------------------------------------------+-----------------------+--------+
```

---

## 3. Data Correctness & Business Logic Invariants

### 3.1 Event Creation & Registration Integrity
- **No Duplicate Events**: Verified slug generation uniqueness with timestamp entropy (`generateSlug`).
- **No Duplicate Registrations**: Unique database compound constraint on `[eventId, userId]` strictly enforced by PostgreSQL.
- **Event Capacity Enforcement**: Evaluated in transaction boundary; registrations exceeding `maxCapacity` are rejected with HTTP 400.
- **Registration Deadline Semantics**: Enforces `registrationDeadline <= event.startDate`. Registrations attempted after the deadline timestamp are rejected.

### 3.2 CTF Economy & Scoring Invariants
- **Hint Deductions**: Hint unlocks deduct points exactly once using atomic operations; duplicate unlock requests return the already-unlocked hint without double-deduction.
- **Flag Scoring**: Points awarded exactly once per team/user per challenge upon first correct submission. Subsequent submissions do not increment score.
- **Scoreboard Consistency**: Tie-breaking ordered by earliest last-submission timestamp.

### 3.3 User Profile Integrity
- **Mobile Number**: Strictly 10 integer digits; non-numeric characters stripped by client and rejected by backend schema.
- **Faculty Dossier**: `studentId` replaced by `employeeId`; `semester` column removed.
- **Verdict**: **PASS — 100% data correctness and zero functional regressions.**
