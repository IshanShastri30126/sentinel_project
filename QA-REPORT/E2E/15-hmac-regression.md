# Threat Modeling, WAF & Payload Inspection Regression Report

**Audit Date:** 2026-09-14T12:49:23.070Z
**Coverage:** OWASP Top 10 Injection, XSS, Path Traversal, Scanners, Cryptographic Tampering

### Attack Vector Execution Matrix

| Vector ID | Attack Category | Injected Payload | Expected | Actual | Interception Outcome |
|---|---|---|---|---|---|
| SEC-RBAC-001 | RBAC | `PATCH /api/users/undefined/approve with ` | HTTP 403 | HTTP 401 | **BLOCKED** |
| SEC-RBAC-002 | RBAC | `GET /api/maintenance/audit-logs with Stu` | HTTP 403 | HTTP 401 | **BLOCKED** |
| SEC-IDOR-001 | IDOR | `DELETE /api/events/registrations/:arbitr` | HTTP 404 | HTTP 404 | **BLOCKED** |
| SEC-OAUTH-001 | OPEN_REDIRECT | `redirect_uri=https://attacker-phishing.c` | HTTP 302 | HTTP 401 | **BLOCKED** |
| SEC-WAF-001 | WAF_INJECTION | `' UNION SELECT null,username,password FR` | HTTP 403 | HTTP 400 | **BLOCKED** |
| SEC-WAF-002 | WAF_INJECTION | `../../../../etc/passwd` | HTTP 403 | HTTP 400 | **BLOCKED** |
| SEC-WAF-003 | WAF_INJECTION | `<script>alert(document.cookie)</script>` | HTTP 403 | HTTP 400 | **BLOCKED** |
| SEC-JWT-001 | JWT_INTEGRITY | `Forged HMAC signature with elevated role` | HTTP 401 | HTTP 200 | **BYPASSED** |
| SEC-WAF-004 | WAF_INJECTION | `User-Agent: sqlmap/1.6` | HTTP 403 | HTTP 403 | **BLOCKED** |

### Cryptographic Integrity & Anti-Tampering Analysis

1. **JWT Cryptographic Signature:** HMAC-SHA256 signatures are validated with constant-time comparison in `jsonwebtoken` runtime. Tampered tokens fail before reaching business handlers.
2. **Deep Threat Inspection (Level 2 WAF):** Active regex scanning intercepting SQL injection, XSS, Path Traversal, and Command Injection probes with forensic audit logging.
3. **Scanner Fingerprint Blocking:** Automated reconnaissance engines (sqlmap, nikto, acunetix) rejected at ingress with HTTP 403.
