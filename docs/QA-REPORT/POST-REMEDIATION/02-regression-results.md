# POST-REMEDIATION INDEPENDENT SECURITY & QA VERIFICATION REPORT
## 02. Regression Testing Results & Edge-Case Analysis

**Assessment Domain:** Regression Analysis, Negative Vector Testing & Edge-Case Validation  
**Scope:** Complete Sentinal API surface, authentication subsystems, CTF competition routes, and data access layers.

---

### 1. Regression Test Execution Matrix

| Test ID | Test Category | Target Subsystem / Endpoint | Test Vector / Negative Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| REG-AUTH-01 | Auth Regression | POST `/api/auth/login` | Empty credentials (`{}`) | HTTP 400 Bad Request | HTTP 400 Bad Request | PASS |
| REG-AUTH-02 | Auth Regression | POST `/api/auth/login` | Invalid email format | HTTP 400 Bad Request | HTTP 400 Bad Request | PASS |
| REG-AUTH-03 | Auth Regression | POST `/api/auth/login` | Non-existent account credentials | HTTP 401 Unauthorized | HTTP 401 Unauthorized | PASS |
| REG-AUTH-04 | Auth Regression | GET `/api/auth/me` | Missing Authorization & Cookie | HTTP 401 Unauthorized | HTTP 401 Unauthorized | PASS |
| REG-AUTH-05 | Auth Regression | GET `/api/auth/me` | Malformed JWT Bearer token | HTTP 401 Unauthorized | HTTP 401 Unauthorized | PASS |
| REG-ROLE-01 | RBAC Boundary | PATCH `/api/users/:id/role` | Non-existent role string (`SUPER_ADMIN`) | HTTP 400 Bad Request | HTTP 400 Bad Request | PASS |
| REG-ROLE-02 | RBAC Boundary | PATCH `/api/users/:id/role` | Case variation (`faculty_coordinator`) | HTTP 400 Bad Request | HTTP 400 Bad Request | PASS |
| REG-ROLE-03 | RBAC Boundary | PATCH `/api/users/:id/role` | Role payload with Prototype Pollution (`__proto__`) | HTTP 400 Bad Request | HTTP 400 Bad Request | PASS |
| REG-ROLE-04 | RBAC Boundary | PATCH `/api/users/:id/role` | Target user ID does not exist | HTTP 404 Not Found | HTTP 404 Not Found | PASS |
| REG-IDOR-01 | BOLA Regression | GET `/api/users/:id` | Member querying another user's profile | Sanitized public view only | Sanitized public view | PASS |
| REG-IDOR-02 | BOLA Regression | DELETE `/api/notifications/:id` | Member attempting to delete another's alert | HTTP 404 Not Found | HTTP 404 Not Found | PASS |
| REG-HMAC-01 | Cryptographic Boundary | POST `/api/events/register` | HMAC timestamp with floating point string | HTTP 403 Forbidden | HTTP 403 Forbidden | PASS |
| REG-HMAC-02 | Cryptographic Boundary | POST `/api/events/register` | HMAC signature containing non-hex characters | HTTP 403 Forbidden | HTTP 403 Forbidden | PASS |
| REG-HMAC-03 | Cryptographic Boundary | POST `/api/events/register` | HMAC body signature with sorted key mismatch | HTTP 403 Forbidden | HTTP 403 Forbidden | PASS |
| REG-CTF-01 | CTF Boundary | POST `/api/submissions` | Empty flag string (`""`) | HTTP 400 Bad Request | HTTP 400 Bad Request | PASS |
| REG-CTF-02 | CTF Boundary | POST `/api/submissions` | Excessively large flag payload (> 100 KB) | HTTP 413 / 400 | HTTP 400 Bad Request | PASS |
| REG-CTF-03 | CTF Boundary | POST `/api/submissions` | Incorrect flag format (non-matching string) | HTTP 200 `result: INCORRECT` | HTTP 200 `result: INCORRECT` | PASS |
| REG-CTF-04 | CTF Boundary | POST `/api/submissions` | Rapid submissions exceeding rate limit | HTTP 429 after 10 requests | HTTP 429 Too Many Requests | PASS |
| REG-CTF-05 | CTF Boundary | POST `/api/challenges/:id/unlock` | Negative or string hint cost injection | Handled server-side | Server uses DB cost | PASS |

---

### 2. Deep-Dive Edge-Case Analysis

#### 2.1 Role Manipulation Edge Cases
Testing was expanded beyond basic string substitution to evaluate object injection, type confusion, and casing discrepancies:
- **Object Injection:** Submitting `{ role: { name: "FACULTY_COORDINATOR" } }` was rejected by schema validation with HTTP 400.
- **Array Payload:** Submitting `{ role: ["DEVELOPMENT_TEAM"] }` was rejected with HTTP 400.
- **Casing and Trimming:** Roles are validated against an uppercase enum set (`DEVELOPMENT_TEAM`, `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `MEMBER`, `GUEST`). Submitting `faculty_coordinator` or ` DEVELOPMENT_TEAM ` fails enum validation cleanly.
- **Target User Isolation:** Updating a non-existent UUID target returns HTTP 404 cleanly, without triggering unhandled database exceptions or internal stack dumps.

#### 2.2 IDOR & Cross-Tenant Boundary Cases
- **Notification Updates:** Verified that passing SQL injection strings or wildcards in `:id` (e.g., `*`, `' OR 1=1 --`) does not bypass user filtering. The Prisma parameterized query strictly coerces `:id` to string and pairs it with `userId: req.user.id`.
- **Profile Data Sanitization:** Querying user data through `GET /api/users/:id` strips password hashes, salt values, reset tokens, and internal security flags, exposing only operational metadata.

#### 2.3 Cryptographic Integrity Edge Cases
- **Non-JSON Request Bodies:** If an attacker sends a raw binary or non-JSON body while claiming `Content-Type: application/json`, the request body parsing fails before the signature evaluation, returning HTTP 400.
- **Query String Parameter Shuffling:** The canonical string generation orders query parameters lexicographically. When a client generates a signature with `?alpha=1&beta=2` and sends `?beta=2&alpha=1`, the middleware re-canonicalizes the query parameters prior to hashing, correctly validating legitimate requests regardless of parameter ordering while catching tampered parameters.

#### 2.4 CTF Submissions & Rate Limiting
- **Incorrect Flag Result Code:** Verified that an incorrect flag yields:
  ```json
  {
    "success": true,
    "message": "Incorrect flag. Try again.",
    "data": {
      "result": "INCORRECT"
    }
  }
  ```
  The response code is strictly HTTP 200 OK.
- **Rate Limit Exhaustion:** Dispatched 12 rapid submission attempts. Requests 1 through 10 returned HTTP 200 with `result: INCORRECT`. Requests 11 and 12 returned HTTP 429 with:
  ```json
  {
    "success": false,
    "message": "Too many flag submission attempts. Please slow down."
  }
  ```
  This proves RFC 6585 compliance: HTTP 429 is reserved exclusively for rate-limiting events.

---

### 3. Summary of Regression Observations
No functional regressions were introduced by the remediation phase across authentication, role enforcement, cryptographic validation, or challenge submission pipelines.
