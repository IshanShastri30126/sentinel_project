# Chapter 11 — Data Integrity, Relational Consistency & Transaction Safety

## 1. Relational Architecture & Database Topology

The Sentinal application utilizes **PostgreSQL** managed through **Prisma ORM**, maintaining relational schemas across two distinct database instances:
1. **Main Platform Database**: Manages core user identities, roles, events, teams, attendance logs, and certification records.
2. **CTF Platform Database**: Dedicated game-engine store managing competitions, categories, challenges, hints, submissions, and solve logs.

---

## 2. Schema Entities & Relational Map

### 2.1 Core Relational Entities
- `User`: Primary identity entity containing email, password hash, role enum, and security lockout counters.
- `Event`: Workshops, hackathons, and guest lectures with registration caps and schedule timestamps.
- `EventRegistration`: Junction entity enforcing unique participant enrollment (`@@unique([userId, eventId])`).
- `Competition`: High-level CTF contest container with start/end bounds and invite codes.
- `Challenge`: CTF challenge specs, point weights, dynamic scoring formulas, and flags.
- `Submission`: Complete log of flag attempts, solve timestamps, and point allocations.

---

## 3. Concurrency Controls & Race Condition Mitigations

### 3.1 Event Registration Capacity Integrity
- **Risk**: Simultaneous registration requests from multiple users when an event has only 1 remaining open slot.
- **Implementation**:
  - Registration execution wraps within a Prisma interactive transaction (`prisma.$transaction(async (tx) => { ... })`).
  - Queries active registration count with write locking.
  - If `count >= event.maxParticipants`, the transaction aborts with HTTP 400 `"Event is fully booked"`.
- **Integrity Verdict**: **PASS** `[MEASURED]`

### 3.2 CTF Duplicate Solve Prevention
- **Risk**: A player submitting the same correct flag multiple times simultaneously to inflate score or achieve multiple first-blood points.
- **Implementation**:
  - Database schema enforces a composite unique index:
    `@@unique([competitionId, teamId, challengeId])`.
  - Secondary attempts by the same team on an already solved challenge violate the unique index, throwing a database constraint error `P2002` that is caught and handled cleanly:
    `{"success": false, "message": "Challenge already solved by your team."}`.
- **Integrity Verdict**: **PASS** `[MEASURED]`

### 3.3 Scoreboard Aggregation Consistency
- **Evaluation**:
  - Scoreboard calculation sums points from verified solves in the `Submission` table where `isCorrect = true`.
  - Tie-breaking logic orders teams by total points descending, then by the timestamp of their latest correct submission ascending.
  - Deterministic ordering ensures two teams with identical scores never oscillate rank positions during live refreshes.
- **Integrity Verdict**: **PASS** `[MEASURED]`

---

## 4. Foreign Key Constraints & Cascade Safeguards

| Relationship | On Delete Policy | Assessment |
| :--- | :--- | :---: |
| `User` → `EventRegistration` | `Cascade` | Deleting a user cleans up registration records cleanly. |
| `Event` → `EventRegistration` | `Cascade` | Deleting an event deletes related registration records. |
| `Competition` → `Challenge` | `Cascade` | Competition teardown removes child challenges. |
| `Challenge` → `Submission` | `Cascade` | Prevents orphaned submission records. |
| `User` → `TeamMembership` | `Cascade` | Removing user account evicts user from active team. |

**Integrity Verification**: Database integrity inspection confirmed zero orphaned records across `users`, `events`, `challenges`, and `submissions` tables.
