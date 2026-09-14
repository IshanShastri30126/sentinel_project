# Chapter 08 — REST API Contracts, Payload Schemas & Status Code Audit

## 1. Scope & Tested Endpoints

The backend services expose structured RESTful APIs across the Main server (`http://localhost:4000`) and the CTF server (`http://localhost:5001`). Automated endpoint probes submitted valid and invalid payloads to evaluate schema conformance, error formatting, and security controls.

---

## 2. API Endpoint Audit Matrix

| Method | Endpoint | Purpose | Tested Status Code | Response Schema | Contract Conformance |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `POST` | `/api/auth/login` | Authenticate credentials | 200 / 401 `[MEASURED]` | `{ success, user, token? }` | **PASS** |
| `POST` | `/api/auth/register` | User onboarding | 201 / 400 `[MEASURED]` | `{ success, user }` | **PASS** |
| `POST` | `/api/auth/logout` | Terminate session | 200 `[MEASURED]` | `{ success, message }` | **PASS** |
| `GET` | `/api/auth/me` | Fetch active profile | 200 / 401 `[MEASURED]` | `{ success, user }` | **PASS** |
| `GET` | `/api/events` | List upcoming events | 200 `[MEASURED]` | `{ success, events: [] }` | **PASS** |
| `GET` | `/api/events/:id` | Event detail view | 200 / 404 `[MEASURED]` | `{ success, event }` | **PASS** |
| `POST` | `/api/events/:id/register` | Enroll in event | 200 / 400 `[MEASURED]` | `{ success, registration }` | **PASS** |
| `GET` | `/api/competitions` | List CTF contests | 200 `[MEASURED]` | `{ success, competitions: [] }` | **PASS** |
| `POST` | `/api/competitions/join` | Join with invite code | 200 / 400 `[MEASURED]` | `{ success, message }` | **PASS** |
| `GET` | `/api/challenges` | List CTF challenges | 200 / 400 `[MEASURED]` | `{ success, challenges: [] }` | **PASS** |
| `POST` | `/api/submissions` | Submit CTF flag | 200 / 429 `[MEASURED]` | `{ success, correct, ... }` | **FAIL (`API-001`)** |
| `GET` | `/api/scoreboard` | Standing telemetry | 200 `[MEASURED]` | `{ success, scoreboard: [] }` | **PASS** |
| `GET` | `/api/teams` | List registered teams | 200 `[MEASURED]` | `{ success, teams: [] }` | **PASS** |

---

## 3. Deep-Dive: Status Code 429 Violation (`API-001`)

### 3.1 Defect Details
- **Endpoint**: `POST http://localhost:5001/api/submissions`
- **Component File**: [submissions.ts](file:///d:/A_Coding/A_MainCodes/Sentinal/ctf-platform/server/src/routes/submissions.ts#L203)
- **Problem Statement**:
  When a player submits an incorrect flag guess, the backend responds with **HTTP 429 Too Many Requests**:
  ```json
  HTTP/1.1 429 Too Many Requests
  Content-Type: application/json; charset=utf-8

  {
    "success": false,
    "message": "Incorrect flag. Try again."
  }
  ```

### 3.2 Architectural Consequence
1. **RFC 6585 Violation**: RFC 6585 Section 4 states that HTTP 429 indicates that the user has sent too many requests in a given amount of time ("rate limiting"). An incorrect answer to a challenge is a domain validation failure, NOT a rate limiting violation.
2. **Reverse Proxy & Client Backoff Disruption**: Upstream reverse proxies (Cloudflare, Nginx, AWS ALB) intercept HTTP 429 responses and automatically apply IP-level throttling or present Cloudflare challenge captchas to the user.
3. **Frontend Confusions**: Frontend HTTP clients (Axios, Fetch wrappers) with automatic retry logic will delay subsequent legitimate requests exponentially when receiving status 429.

### 3.3 Recommended Code Fix
```diff
--- a/ctf-platform/server/src/routes/submissions.ts
+++ b/ctf-platform/server/src/routes/submissions.ts
@@ -200,8 +200,8 @@ router.post('/', authenticate, async (req, res) => {
     if (submissionFlag !== challenge.flag) {
-      return res.status(429).json({
+      return res.status(200).json({
         success: false,
+        correct: false,
         message: 'Incorrect flag. Try again.'
       });
     }
```

---

## 4. Input Validation & Zod Schema Conformance

Input bodies across sensitive mutations are strictly verified using Zod runtime validation schemas:
- **Registration Schema**:
  - Requires valid email conforming to RFC 5322 regex.
  - Requires password length ≥ 8 characters with upper, lower, numeric, and special character requirements.
  - Validates role against typed enum `["MEMBER", "CORE_TEAM", "FACULTY_COORDINATOR", "ADMIN"]`.
- **Sanitization & Escaping**:
  - Input strings are sanitized before database querying, preventing SQL injection and stored XSS vectors.
  - Sensitive internal attributes (e.g. `passwordHash`, `verificationToken`) are pruned via Prisma `select` projections and never transmitted over the wire.
