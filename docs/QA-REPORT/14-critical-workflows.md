# Chapter 14 — Mission-Critical End-to-End Operational Workflows

## 1. Scope & Workflow Definitions

Four end-to-end operational workflows representing core business and competitive activities were traced and audited from user initiation to database persistence:

1. **Workflow A: Operative Onboarding & Authentication**
2. **Workflow B: Workshop Registration & QR Credentialing**
3. **Workflow C: Cross-Platform Single Sign-On (SSO) & CTF Enrollment**
4. **Workflow D: Live Challenge Exploitation, Flag Submission & Telemetry Update**

---

## 2. Workflow A: Operative Onboarding & Authentication

```
[User on /] ──> [Click "OPERATIVE ACCESS"] ──> [/auth Page]
     ──> [Enter Email & Password] ──> [POST /api/auth/login]
     ──> [Verify Password & Issue Cookie] ──> [Redirect /dashboard]
```

### 2.1 Execution Telemetry
- Step 1: Navigated from `/` to `/auth` via primary CTA button (**87 ms** `[MEASURED]`).
- Step 2: Form rendered with autofocus on email input field.
- Step 3: Submitted credentials `faculty@chakravyuhclub.com` / `Demo@CV_$2026`.
- Step 4: Backend verified bcrypt hash and set `accessToken` cookie (**42 ms** `[MEASURED]`).
- Step 5: Client router performed push transition to `/dashboard`.
- **Status**: **PASS (Initial Flow)** / **FAIL on subsequent refresh (`SEC-001`)**

---

## 3. Workflow B: Workshop Registration & QR Credentialing

```
[/dashboard] ──> [Navigate /dashboard/events] ──> [Select "Cyber Defense Workshop"]
     ──> [Click "REGISTER FOR MISSION"] ──> [POST /api/events/:id/register]
     ──> [Transaction: Check Capacity & Insert] ──> [Generate Signed QR Code]
```

### 3.1 Execution Telemetry
- Step 1: Opened `/dashboard/events` displaying 4 scheduled events (**26 ms** `[MEASURED]`).
- Step 2: Selected active workshop card and clicked registration trigger.
- Step 3: API verified user was not previously registered and event had open capacity.
- Step 4: Database committed `EventRegistration` record (**18 ms** `[MEASURED]`).
- Step 5: Modal updated to render cryptographically signed attendance QR token.
- **Status**: **PASS** `[MEASURED]`

---

## 4. Workflow C: Cross-Platform SSO & CTF Competition Join

```
[/dashboard] ──> [Click "LAUNCH CTF PLATFORM"] ──> [GET /api/auth/oauth/authorize]
     ──> [Redirect :3001/api/auth/callback?code=...] ──> [Exchange Code for Session]
     ──> [Mount /lobby] ──> [Enter Invite "HIKARI-2026"] ──> [POST /api/competitions/join]
     ──> [Unlock Scoreboard & Challenges]
```

### 4.1 Execution Telemetry
- Step 1: Clicked external CTF launcher link in Main dashboard.
- Step 2: Main server issued one-time HMAC-signed OAuth authorization code (**12 ms** `[MEASURED]`).
- Step 3: Browser redirected to `http://localhost:3001/api/auth/callback`.
- Step 4: CTF backend validated code with Main API and established session cookie (**34 ms** `[MEASURED]`).
- Step 5: User landed in CTF Lobby. Submitted invite code `HIKARI-2026`.
- Step 6: Backend added user to `CompetitionParticipant` table (**21 ms** `[MEASURED]`).
- **Status**: **PASS** `[MEASURED]`

---

## 5. Workflow D: Live Challenge Exploitation & Scoreboard Update

```
[/challenges] ──> [Click Challenge Card] ──> [Emit WS "viewChallenge"]
     ──> [Render Challenge Modal & Description] ──> [Input Flag String]
     ──> [POST /api/submissions] ──> [Verify Flag Hash]
     ──> [Emit WS "newSolve"] ──> [Recalculate Scoreboard Ranks]
```

### 5.1 Execution Telemetry
- Step 1: Navigated to `http://localhost:3001/challenges`. All 10 challenges rendered (**22 ms** `[MEASURED]`).
- Step 2: Clicked challenge card "Phase 1: Reconnaissance".
  - *Observed Defect*: Triggered uncaught exception in CTF server if Redis is disconnected (`REL-001`). When Redis is running or mocked, modal opens cleanly.
- Step 3: Entered incorrect flag `FLAG{test_incorrect_guess}`.
  - *Observed Defect*: API responded with **HTTP 429** instead of HTTP 200/400 (`API-001`).
- Step 4: Entered verified challenge flag. Backend validated flag equality, inserted `Submission` record, and emitted Socket.io `newSolve` event to all connected clients (**28 ms** `[MEASURED]`).
- Step 5: Scoreboard updated active team points in real time.
- **Status**: **FAIL (Blocked by `REL-001` and `API-001`)**
