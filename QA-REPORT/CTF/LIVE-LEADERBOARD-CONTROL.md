# Live Leaderboard Control & Scoring Telemetry Verification Report

## 1. Executive Summary
This report documents the verification of the Live Leaderboard Control system across both the Sentinel Main Platform and the CTF Wars Platform. The system allows authorized operational staff to freeze (pause) public leaderboard telemetry during ongoing competitions without stopping background score evaluation.

When frozen, registered competitors are presented with a tactical paused notice, while staff members retain full visibility into real-time standings.

---

## 2. Access Control & Authorization Matrix

| User Role | Can Toggle Leaderboard Visibility? | Can View Leaderboard When Frozen? | Participant Access When Frozen |
|---|---|---|---|
| `FACULTY_COORDINATOR` | YES (Authorized) | YES (Staff Supervisor Mode) | Blocked if registered as participant |
| `STUDENT_COORDINATOR` | YES (Authorized) | YES (Staff Supervisor Mode) | Blocked if registered as participant |
| `DEVELOPMENT_TEAM` | YES (Authorized) | YES (Technical Supervisor Mode) | Blocked if registered as participant |
| `SOCIAL_MEDIA_COORDINATOR`| NO (Forbidden - 403) | NO (Forbidden - 403) | Blocked if registered as participant |
| `MEMBER` | NO (Forbidden - 403) | NO (Forbidden - 403) | Displays structured paused banner |

---

## 3. Implementation Verification

### 3.1 Backend Endpoints
1. `PATCH /api/events/:id/leaderboard-visibility`
   - Authorization: `requireRole("FACULTY_COORDINATOR", "STUDENT_COORDINATOR", "DEVELOPMENT_TEAM")`
   - Payload: Accepts `{ isVisible: boolean }` or `{ isLeaderboardVisible: boolean }`.
   - Action: Updates `Event.isLeaderboardVisible` and propagates setting to linked `CtfCompetition.isLeaderboardVisible`.
   - Status: Verified.

2. `GET /api/events/:id/leaderboard`
   - Checks:
     - If `event.isLeaderboardVisible === false`:
       - If user is a registered participant: Returns HTTP 403 with `{ isHidden: true, isParticipant: true }`.
       - If user is authorized staff (`FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `DEVELOPMENT_TEAM`) and not a participant: Grants staff supervisor view.
       - If unauthenticated or general spectator: Returns HTTP 403 with `{ isHidden: true, isParticipant: false }`.
   - Status: Verified.

3. `GET /api/leaderboard/:competitionId` (CTF Engine)
   - Checks:
     - Queries `CtfCompetition.isLeaderboardVisible`.
     - If false and user is not staff: Returns HTTP 403 with `{ success: false, isFrozen: true }`.
     - If staff: Returns full scoreboard data.
   - Status: Verified.

### 3.2 Frontend Displays
1. Sentinel Leaderboard (`client/src/app/dashboard/leaderboard/page.tsx`):
   - Controller bar rendered for `canManageCompLeaderboard` (`FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `DEVELOPMENT_TEAM`).
   - One-click freeze/unfreeze toggle with visual status indicator (`PUBLIC` vs `FROZEN`).
   - Participant View when frozen: Displays locked artifact container:
     - Title: `SCORING ARTIFACT LOCKED`
     - Description: Explains background evaluation remains active.
     - Status: `STATUS: PAUSED BY COMMAND // BG EVALUATION ACTIVE`
2. CTF Platform Leaderboard (`ctf-platform/client/src/app/leaderboard/page.tsx`):
   - When API returns `{ isFrozen: true }`, renders structured tactical locked container.
   - Preserves zero emoji constraint throughout.

---

## 4. Test Execution Summary

| Test ID | Action | Expected Outcome | Result |
|---|---|---|---|
| CTF-LB-01 | Member calls `PATCH /api/events/:id/leaderboard-visibility` | HTTP 403 Forbidden | PASS |
| CTF-LB-02 | Dev Team calls `PATCH /api/events/:id/leaderboard-visibility` with `{ isVisible: false }` | HTTP 200 OK; visibility set to false | PASS |
| CTF-LB-03 | Participant calls `GET /api/events/:id/leaderboard` when frozen | HTTP 403 `{ isHidden: true, isParticipant: true }` | PASS |
| CTF-LB-04 | Faculty Coordinator calls `GET /api/events/:id/leaderboard` when frozen | HTTP 200 OK; full scores rendered | PASS |
| CTF-LB-05 | Flag submission while leaderboard is frozen | Score calculated & stored in Redis/DB; leaderboard remains hidden | PASS |

---

## 5. Conclusion
Live Leaderboard Control operates with strict role enforcement and provides background score continuity during telemetry blackouts.
