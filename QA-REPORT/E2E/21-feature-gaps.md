# Identified Defects, Feature Gaps & Architectural Observations Report

**Audit Execution Timestamp:** 2026-09-14T12:45:30.000Z  
**Document Scope:** Comprehensive Catalog of Runtime Defects, Architectural Gaps, and Warnings  
**Operator:** Principal QA Engineer / System Integration Tester  

---

### 1. Defect Catalog

The following defects were discovered during fresh runtime execution and documented with root causes and remediation recommendations.

#### DEFECT-001: CTF Platform Socket.io `io` Instance Binding
- **Severity:** Medium (Functional)
- **Component:** `ctf-platform/server/src/index.ts` & `src/routes/submissions.ts`
- **Description:** Submitting a correct flag in the CTF platform threw `TypeError: Cannot read properties of undefined (reading 'to')` at line 378 because `req.app.get("io")` returned undefined (`app.set("io", io)` was omitted in `index.ts`).
- **Impact:** Flag submission failed with HTTP 500 even though the solve was recorded in the database and score incremented in Redis.
- **Remediation Applied:** Added `app.set("io", io)` in `index.ts` and null-safe optional chaining `ctfNamespace?.to(...)` in `submissions.ts`.

#### DEFECT-002: In-Memory Firewall Cache Propagation Delay
- **Severity:** Low / Medium (Operational Security)
- **Component:** `server/src/middlewares/firewall.ts`
- **Description:** When an administrator unblocks an IP via `POST /api/maintenance/security/ip-management/unblock`, the unblock takes effect in the database immediately, but the in-memory Set `cachedBlockedIps` continues to block requests for up to 32 seconds until `BLOCKED_IPS_CACHE_TTL_MS` (30s) expires.
- **Measured Propagation Delay:** **32 seconds** across 26 poll cycles.
- **Remediation Recommendation:** When an IP is unblocked via the API, actively evict the IP from the process-level `cachedBlockedIps` Set (and publish a Redis invalidation message across distributed worker processes).

#### DEFECT-003: Prisma Schema Drift Between Main Server and CTF Server
- **Severity:** High (Crash / Database Incompatibility)
- **Component:** `ctf-platform/server/prisma/schema.prisma`
- **Description:** The CTF platform schema contained an older version of the `Role` enum that lacked `TECH_COORDINATOR` and `FACULTY_COORDINATOR`, and lacked the `employeeId` column. When CTF auth middleware queried a user record, Prisma threw `Value 'TECH_COORDINATOR' not found in enum 'Role'`.
- **Remediation Applied:** Synchronized canonical `schema.prisma` from main server to CTF platform, stopped the active server to release the Windows DLL file lock, and regenerated the Prisma Client (`npx prisma generate`).

---

### 2. Feature Gaps

#### GAP-001: CTF Leaderboard Freeze & Visibility Control
- **Classification:** Feature Gap (`CTF-LEADERBOARD-CONTROL-001`)
- **Description:** The CTF platform provides real-time scoreboard updates but lacks an administrative toggle to "freeze" the public scoreboard during the final phase of a competition (a standard feature in major CTF competitions to prevent sniping).
- **Recommendation:** Implement a `isScoreboardFrozen` boolean flag on the `Competition` model, with an API endpoint `PATCH /api/competitions/:id/scoreboard-freeze` accessible to Coordinators and Admins.

---

### 3. Security Warnings & Non-Blocking Findings

#### WARN-001: Google Identity Services (GSI) Client ID Origin Mismatch
- **Severity:** Informational
- **Description:** Browser console logged `[GSI_LOGGER]: The given origin is not allowed for the given client ID` on `http://localhost:3000/auth`.
- **Cause:** The Google OAuth Client ID provisioned in `.env` (`148457849994-vefjhnvu6kku18kuab45fctarf8gp404...`) has authorized Javascript origins configured for the production deployment domain rather than local development `http://localhost:3000`.
- **Status:** Non-blocking for local password-based authentication.

**Overall Defect Status:** All critical blocking issues remediated; operational observations cataloged for continuous improvement.
