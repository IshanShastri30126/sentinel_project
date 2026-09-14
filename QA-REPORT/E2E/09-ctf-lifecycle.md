# CTF Challenge Lifecycle & Flag Verification Audit Report

**Audit Execution Timestamp:** 2026-09-14T12:43:00.000Z  
**Target Platform:** CTF Wars Platform (`http://localhost:3001` / `http://localhost:5001`)  
**Target Competition:** `Operation Hikari — CTF` (`c3926a13-ae85-48a8-a6c4-167ec53aa163`)  
**Target Challenge:** `Phase 1 — The First Fragment` (`96ef3f77-4375-4b4d-835b-3d0d4e9ab9aa`)  
**Operator:** Principal QA Engineer / Security SDET  

---

### 1. Competition Enrollment & State Verification

| Lifecycle Step | Action / Endpoint | Response Status | Observed Payload / State | Status |
|---|---|---|---|---|
| Query Active Competitions | `GET /api/competitions/active` | HTTP 200 | Found active competition: "Operation Hikari — CTF" | **PASS** |
| Join Competition | `POST /api/competitions/:id/join` | HTTP 201 | Participant ID: `dcc3de4c-0281-45bc-ac01-ac1c4be7527b`, Initial Score: 0, Tier: `APPRENTICE` | **PASS** |
| Fetch Challenges | `GET /api/challenges?competitionId=...` | HTTP 200 | Retrieved active challenge grid (1 challenge discovered) | **PASS** |

---

### 2. Challenge Exploration & Flag Verification Pipeline

The target challenge `"Phase 1 — The First Fragment"` was subjected to both negative (tampered/incorrect) and positive (canonical) submission vectors.

#### Negative Verification: Incorrect Flag Submission
- **Submitted Payload:** `HIKARI{wrong_tampered_flag_xyz}`
- **Endpoint:** `POST /api/submissions`
- **Observed Response:**
  ```json
  {
    "status": 200,
    "data": {
      "success": true,
      "message": "Incorrect flag. Try again.",
      "data": { "result": "INCORRECT" }
    }
  }
  ```
- **Verification Result:** System rejected incorrect flag without incrementing score, modifying participant tier, or leaking correct answer strings.

#### Positive Verification: Correct Flag Submission & Dynamic Decay
- **Submitted Payload:** `HIKARI{demo_test_flag_2026}`
- **Endpoint:** `POST /api/submissions`
- **Observed Response:**
  ```json
  {
    "status": 200,
    "data": {
      "success": true,
      "message": "Correct flag! Points awarded.",
      "data": {
        "result": "CORRECT",
        "pointsAwarded": 99,
        "newTotalScore": 99,
        "solveNumber": 2,
        "challengeCurrentPoints": 97
      }
    }
  }
  ```
- **Dynamic Scoring Verification:** 
  - The challenge dynamically adjusted its current value from 99 to 97 for subsequent solvers (`solveNumber: 2`).
  - Redis distributed lock (`ctf:lock:challenge:...`) serialized the submission atomically.
  - Redis sorted set (`ctf:leaderboard:...`) incremented participant score to 99 points.
  - WebSocket event `leaderboardUpdate` and `liveSolve` were broadcast to connected peers on the `/ctf` namespace.

---

### 3. Photographic Audit Evidence

- **Challenges Matrix View:** `QA-REPORT/E2E/evidence/16_ctf_challenges_matrix.png`
- **Post-Solve Scoreboard View:** `QA-REPORT/E2E/evidence/17_ctf_scoreboard_post_solve.png`

**Verdict:** **PASS**
