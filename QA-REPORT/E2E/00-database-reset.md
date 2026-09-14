# E2E Test Suite — Phase 0: Test Database Reset Report

---

## 1. Environment Safety Verification & Target Confirmation

| Parameter | Confirmed Value |
| :--- | :--- |
| **Database Host** | `ep-small-art-apfniiyb-pooler.c-7.us-east-1.aws.neon.tech` |
| **Database Port** | `5432` |
| **Database Name** | `neondb` |
| **Database User** | `neondb_owner` |
| **SSL Mode** | `require` |
| **Environment Mode** | `development` / Isolated Test Branch |
| **Connection String** | `postgresql://***:***@ep-small-art-apfniiyb-pooler.c-7.us-east-1.aws.neon.tech/neondb` |
| **Redis Cache Target** | `https://big-minnow-137825.upstash.io` (Upstash HTTP Redis) |
| **Reset Execution Timestamp** | `2026-09-14T12:04:05.139Z` (UTC) / `2026-09-14 17:34:05` (IST) |
| **Safety Boundary Check** | Passed — Confirmed non-production development testing cluster |

---

## 2. Preserved Identity Verification

| Field | Preserved Record State |
| :--- | :--- |
| **User ID** | `dc32c8ee-b321-44a7-9d48-0d547244ba71` |
| **Full Name** | `Dr. Priteshkumar Prajapati` |
| **Email Address** | `faculty@chakravyuhclub.com` |
| **Designated Role** | `FACULTY_COORDINATOR` |
| **Account Approval Status** | `isApproved: true` |
| **Account Active Status** | `isActive: true` |
| **Employee ID** | `EMP-FAC-001` |
| **Integrity Check** | Passed — Exactly 1 user retained in database |

---

## 3. Pre-Reset vs Post-Reset Record Counts

| Database Entity / Table | Count Before Reset | Count After Reset | Status |
| :--- | :--- | :--- | :--- |
| `User` | 13 | 1 | Preserved single Faculty Coordinator |
| `Event` | 1 | 0 | Cleared |
| `EventRegistration` | 1 | 0 | Cleared |
| `Team` | 0 | 0 | Clean |
| `TeamMember` | 0 | 0 | Clean |
| `Attendance` | 0 | 0 | Clean |
| `Certificate` | 0 | 0 | Clean |
| `CertificateTemplate` | 2 | 0 | Cleared |
| `ApprovalRequest` | 1 | 0 | Cleared |
| `ApprovalStep` | 2 | 0 | Cleared |
| `Notification` | 53 | 0 | Cleared |
| `AuditLog` | 338 | 0 | Cleared |
| `AppreciationPoint` | 1 | 0 | Cleared |
| `UserBadge` | 0 | 0 | Clean |
| `OAuthCode` | 0 | 0 | Clean |
| `CtfParticipant` | 3 | 0 | Cleared |
| `CtfSubmission` | 1 | 0 | Cleared |
| `CtfChallengeActivity` | 2 | 0 | Cleared |
| `CtfAuditLog` | 47 | 0 | Cleared |
| `CtfCompetition` | 2 | 1 | Seeded clean reference competition |
| `CtfChallenge` | 11 | 1 | Seeded clean reference challenge |
| `CtfHint` | 20 | 2 | Seeded clean reference hints (free + paid) |
| `Redis Cache Keys` | Active test keys | 0 | Flushed via Upstash REST API |

---

## 4. Reset Status Summary

→ **Structural Integrity**: All Prisma schema tables and relations remain fully intact.  
→ **Foreign Key Cascades**: Zero constraint violations occurred during ordered deletion.  
→ **Cache State**: Upstash Redis database completely flushed; all session and rate-limit caches reset.  
→ **CTF Baseline**: Initialized clean reference competition `Operation Hikari — CTF` containing 1 active challenge (`Phase 1 — The First Fragment`) and 2 hints for automated testing.  
→ **Overall Phase 0 Status**: `PASS`
