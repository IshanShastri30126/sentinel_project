# Chapter 02 — End-to-End Functional Testing & User Workflows

## 1. Scope & Execution Strategy

Functional testing evaluated the primary user journeys across both the Main Sentinal digital hub and the CTF Wars competition platform. Automated test drivers interacted with live form elements, submitted valid and invalid payloads, traversed navigation paths, and monitored backend database state changes.

---

## 2. Authentication & Credential Verification

### 2.1 Valid Credential Flow
- **Test User**: `faculty@chakravyuhclub.com` (Role: `FACULTY_COORDINATOR`)
- **Action**: Submit valid password via login form at `http://localhost:3000/auth`.
- **Observed Behavior**:
  - Client dispatches `POST http://localhost:4000/api/auth/login`.
  - Backend verifies bcrypt hash against PostgreSQL `users` table.
  - Returns HTTP 200 with user payload:
    ```json
    {
      "success": true,
      "user": {
        "id": "e2a22be2-67fe-49b0-8f92-747f44d8b51d",
        "email": "faculty@chakravyuhclub.com",
        "fullName": "Faculty Coordinator",
        "role": "FACULTY_COORDINATOR"
      }
    }
    ```
  - Backend sets `accessToken` cookie (`HttpOnly: true, SameSite: lax, Path: /`).
  - Next.js client redirects to `/dashboard`.
- **Verdict**: **PASS** `[MEASURED]`

### 2.2 Invalid Credential & Lockout Rate Limiting
- **Test Case**: Submit incorrect password `WrongPassword123!` 5 consecutive times.
- **Observed Behavior**:
  - Attempts 1–4 return HTTP 401 with warning:
    `"Invalid credentials. X attempts remaining before 20-minute lockout"`
  - Attempt 5 triggers progressive lockout: returns HTTP 429 `"Account temporarily locked. Please wait 20 minutes."`
  - Database updates `failedLoginAttempts: 5` and `lockoutUntil: <timestamp + 20min>`.
- **Verdict**: **PASS** `[MEASURED]`

### 2.3 Client-Side HTML5 Form Validation
- **Test Case 1**: Submitting empty email triggers browser constraint validation (`"Please fill out this field."`).
- **Test Case 2**: Submitting malformed email `invalid-email` triggers RFC 5322 constraint (`"Please include an '@' in the email address."`).
- **Test Case 3**: Password input field masks characters with `type="password"`.
- **Verdict**: **PASS** `[MEASURED]`

### 2.4 Token Persistence Defect (`SEC-001`)
- **Test Case**: User authenticates successfully, reaches `/dashboard`, then executes page reload (F5).
- **Observed Failure**:
  - `AuthContext` executes `fetchMe()` on mount.
  - `Cookies.get("accessToken")` returns `undefined` because the cookie was marked `HttpOnly` by Express.
  - `AuthContext` resets internal state: `token = ""`.
  - `/dashboard/page.tsx` checks `if (!token || !user) return;`.
  - Because `token === ""`, data fetching never runs, leaving `loading = true` permanently.
  - Screen displays indefinite loading spinner: `"Initializing Operative Interface..."`.
- **Verdict**: **FAIL — P0 BLOCKER** `[MEASURED]`

---

## 3. Main Dashboard & Event Management Workflows

### 3.1 Event Catalog Browsing & Filter State
- **Route**: `http://localhost:3000/dashboard/events`
- **Execution**:
  - Loaded active events catalog from PostgreSQL via `GET /api/events`.
  - Interacted with filter tabs: "All", "Upcoming", "Active", "Completed".
  - Verified search filter input properly throttles and filters displayed event cards.
- **Verdict**: **PASS** `[MEASURED]`

### 3.2 Team Management Interface
- **Route**: `http://localhost:3000/dashboard/teams`
- **Execution**:
  - Evaluated team roster display, member listing, and invite code generation.
  - Verified role-based privileges: `FACULTY_COORDINATOR` and `ADMIN` roles display administrative moderation controls; standard `MEMBER` accounts see participant controls only.
- **Verdict**: **PASS** `[MEASURED]`

### 3.3 Attendance & QR Verification
- **Route**: `http://localhost:3000/dashboard/attendance`
- **Execution**:
  - Verified QR code rendering component generates cryptographically signed check-in tokens.
  - Camera scanner interface gracefully prompts for webcam permissions and handles camera rejection without unhandled UI errors.
- **Verdict**: **PASS** `[MEASURED]`

---

## 4. CTF Platform End-to-End Game Flow

### 4.1 Single Sign-On (SSO) OAuth Handshake
- **Flow**:
  1. User in Main Dashboard clicks "Launch CTF Platform".
  2. Main server issues temporary authorization code via `GET /api/auth/oauth/authorize`.
  3. User is redirected to `http://localhost:3001/api/auth/callback?code=...`.
  4. CTF server exchanges code for session token with Main API.
  5. Session cookie is established on port 5001.
- **Verdict**: **PASS** `[MEASURED]`

### 4.2 Competition Registration
- **Test Competition**: "Operation Hikari — CTF" (`017eed8b-0cdc-4432-897c-fdff431cb5a2`)
- **Action**: Submit invite code `HIKARI-2026` via `/lobby`.
- **Observed Behavior**:
  - Backend inserts record into `CompetitionParticipant` table.
  - Client state updates to `joined: true`.
  - Scoreboard and challenge tabs become unlocked.
- **Verdict**: **PASS** `[MEASURED]`

### 4.3 Unregistered Challenge Board Traversal (`FUNC-001`)
- **Action**: Access `http://localhost:3001/challenges` before submitting invite code.
- **Observed Behavior**:
  - Backend responds with HTTP 400: `{ success: false, message: "You must join this competition first." }`.
  - Frontend component ignores `res.success === false`, clears loading indicator, and displays: `"0 challenges available / No challenges available yet."`.
  - User receives zero actionable feedback indicating an invite code is required.
- **Verdict**: **FAIL — P2 DEFECT** `[MEASURED]`

### 4.4 Flag Submission Mechanics (`API-001`)
- **Action**: Submit incorrect flag `FLAG{incorrect_test_guess}` to challenge Phase 1.
- **Observed Behavior**:
  - Request: `POST http://localhost:5001/api/submissions`.
  - Response Status: **HTTP 429 Too Many Requests** `[MEASURED]`.
  - Response Body: `{"success": false, "message": "Incorrect flag. Try again."}`.
  - Analysis: Code in `submissions.ts` line 203 uses `res.status(429)` for wrong guesses instead of reserving 429 for rate-limit threshold exhaustion.
- **Verdict**: **FAIL — P2 DEFECT** `[MEASURED]`

---

## 5. Functional Test Results Matrix

| Test Case Identifier | Component / Workflow | Target Condition | Runtime Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-AUTH-01** | Login Form | Valid password authenticates and redirects | Redirected to `/dashboard` in 87ms `[MEASURED]` | **PASS** |
| **TC-AUTH-02** | Login Rate Limiter | 5 failed attempts trigger 20-min lockout | HTTP 429 returned on 5th attempt `[MEASURED]` | **PASS** |
| **TC-AUTH-03** | Auth Context Reload | Session persists across browser reload | State reset to empty; infinite loading trap `[MEASURED]` | **FAIL** |
| **TC-EVT-01** | Event Catalog | Active events query and render correctly | 4 events rendered with metadata `[MEASURED]` | **PASS** |
| **TC-EVT-02** | Event Registration | User can register for open workshops | Registration record created in database `[MEASURED]` | **PASS** |
| **TC-CTF-01** | Competition Join | Valid invite code `HIKARI-2026` unlocks CTF | Successfully registered in competition `[MEASURED]` | **PASS** |
| **TC-CTF-02** | Challenge Listing | 10 challenges rendered with category tags | All 10 challenges retrieved and displayed `[MEASURED]` | **PASS** |
| **TC-CTF-03** | Challenge View | Card click displays modal details | Socket presence triggers crash if Redis down `[MEASURED]` | **FAIL** |
| **TC-CTF-04** | Flag Submission | Incorrect guess returns HTTP 200/400 | Server returns invalid HTTP 429 status `[MEASURED]` | **FAIL** |
| **TC-QR-01** | Attendance Scanner | Camera permission rejection handled | Error message rendered without page crash `[MEASURED]` | **PASS** |
