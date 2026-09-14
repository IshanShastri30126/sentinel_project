# Database Relational Consistency & Schema Integrity Audit Report

**Audit Execution Timestamp:** 2026-09-14T12:44:30.000Z  
**Database Topology:** PostgreSQL (Neon Serverless AWS us-east-1 Pooler) via Prisma ORM v6.19.3  
**Operator:** Principal QA Engineer / Database Integration Tester  

---

### 1. Schema Invariant & Migration Verification

The database was audited for relational consistency, constraint enforcement, and recent schema updates:

| Table / Constraint | Specification / Requirement | Observed DB State | Status |
|---|---|---|---|
| `users.employeeId` | `VARCHAR(255) UNIQUE` for Faculty/Staff | Added column + Unique Index `users_employeeId_key` | **PASS** |
| `users.studentId` | `VARCHAR(255) UNIQUE` for Students | Retained with format enforcement | **PASS** |
| `users.role` Enum | `FACULTY_COORDINATOR`, `TECH_COORDINATOR`, `STUDENT`, `ADMIN` | Synced across both servers and Prisma clients | **PASS** |
| `EventRegistration` | Composite unique index `[userId, eventId]` | Enforced; prevents duplicate registrations | **PASS** |
| `EventRegistration.teamId` | Foreign key nullable reference to `Team` | Cascade and set null rules intact | **PASS** |
| `Participant.competitionId` | Foreign key reference to `Competition` | Foreign key enforced in CTF schema | **PASS** |

---

### 2. Transactional Isolation & Row Locking Verification

- **Pessimistic Row Locking (`SELECT ... FOR UPDATE`):** Verified during the concurrent race tests (Scenarios A, B, and C). The database held row locks on the target `Event` row until registration insert or rollback completed, guaranteeing capacity invariants without dirty reads or phantom writes.
- **Foreign Key Referential Integrity:** Deletion and registration operations strictly respect parent table constraints, returning HTTP 400/409/404 rather than unhandled database constraint crashes.

---

### 3. Connection Pool Hygiene

- Pool connection string enforces `pgbouncer=true&connection_limit=5&connect_timeout=15`.
- No lingering transactions or connection pool exhaustion occurred during 10-racer simultaneous load.

**Verdict:** **PASS**
