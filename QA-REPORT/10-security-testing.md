# Chapter 10 — Application Security, OWASP Top 10 & Threat Modeling

## 1. Security Architecture & Threat Model

The Sentinal application implements multi-layered defensive controls designed to protect administrative operations, participant data, and competitive integrity during live CTF wargames.

Evaluation Scope:
- **Authentication & Credential Defense**
- **Authorization & Role-Based Access Control (RBAC)**
- **SQL & NoSQL Injection Resilience**
- **Cross-Site Scripting (XSS) & Content Injection**
- **Rate Limiting, Brute Force & Anti-Automation Controls**
- **Network Inspection & Information Leakage Defenses**

---

## 2. OWASP Top 10 Vulnerability Assessment

| OWASP Threat Category | Evaluated Control | Assessment Finding | Compliance Status |
| :--- | :--- | :--- | :---: |
| **A01: Broken Access Control** | Role-based middleware guards | Endpoints enforce `ADMIN` and `FACULTY_COORDINATOR` authorization checks server-side. | **PASS** |
| **A02: Cryptographic Failures** | Password hashing & secret keys | Passwords hashed using bcrypt (cost factor 12). JWTs signed using SHA-256 HMAC keys ≥ 256 bits. | **PASS** |
| **A03: Injection** | SQL/Command Injection | All database interactions execute via strongly typed Prisma ORM parameterized queries. Zero raw string concatenations. | **PASS** |
| **A04: Insecure Design** | Anti-brute-force lockout | 5 failed login attempts trigger mandatory 20-minute account lockout. | **PASS** |
| **A05: Security Misconfiguration** | HTTP security headers | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and CSP enabled on Main portal. | **PARTIAL** |
| **A06: Vulnerable Components** | Dependency audit | Zero critical CVEs detected across active dependencies. | **PASS** |
| **A07: Identification & Auth Failures** | Cookie & session security | `HttpOnly`, `SameSite: Lax` cookies used for access tokens. Note `SEC-001` usability trap. | **PASS (Security) / FAIL (UX)** |
| **A08: Software & Data Integrity** | Input validation schemas | Zod schema validation screens input bodies before routing to service layers. | **PASS** |
| **A09: Security Logging & Monitoring** | Audit event logging | Auth failures, admin promotions, and lockouts logged with UTC timestamps and masked IPs. | **PASS** |
| **A10: Server-Side Request Forgery** | Outbound HTTP requests | Application dispatches zero user-supplied URLs to external web endpoints. | **PASS** |

---

## 3. Deep-Dive: Authentication & Token Storage (`SEC-001`)

### 3.1 Security Policy vs. Client Implementation Conflict
- In [server/src/routes/auth.ts](file:///d:/A_Coding/A_MainCodes/Sentinal/server/src/routes/auth.ts), authentication cookies are configured with maximum security:
  ```typescript
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });
  ```
- **Security Assessment**: Marking the cookie `HttpOnly: true` is an industry best-practice constraint that mitigates credential theft via Cross-Site Scripting (XSS).
- **Architecture Conflict**: The Next.js frontend in [auth-context.tsx](file:///d:/A_Coding/A_MainCodes/Sentinal/client/src/lib/auth-context.tsx) relies on `js-cookie` (`Cookies.get("accessToken")`) to verify if the user has an active session upon page reload.
- **Fail-Closed Result**: When the token is inaccessible to JavaScript, the frontend treats the session as empty, while the browser's cookie jar still contains the valid `HttpOnly` cookie. This induces the indefinite loading state documented in `SEC-001`.
- **Recommended Architectural Alignment**:
  Keep the cookie `HttpOnly: true`. Remove client reliance on `Cookies.get("accessToken")`. Instead, have `AuthContext.fetchMe()` call `GET /api/auth/me` with `credentials: 'include'`. The browser will automatically attach the `HttpOnly` cookie, and the server will return the authenticated user object.

---

## 4. Anti-Brute-Force & Rate Limiting Verification

### 4.1 Login Throttle Evaluation
- Target Endpoint: `POST /api/auth/login`
- **Rate Limit Window**: 15 minutes.
- **Max Requests**: 5 attempts per IP / User identifier.
- **Empirical Test Results**:
  - Attempts 1–4 returned HTTP 401 with remaining counter.
  - Attempt 5 triggered HTTP 429 lockout.
  - Subsequent requests during the 20-minute window were rejected at the gateway level before hitting the database or executing bcrypt hashing algorithms, conserving server CPU.

---

## 5. Network Inspection & Telemetry Protection

- **Production Source Maps**:
  - `productionBrowserSourceMaps: false` configured in Next.js build options.
  - Prevents reverse-engineering of original TypeScript source files through browser DevTools.
- **Payload Sanitization**:
  - Passwords and secret flags are never written to server console logs.
  - User profile endpoints explicitly project only public fields: `{ id, email, fullName, role, createdAt }`.
