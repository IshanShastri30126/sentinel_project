# OAuth 2.0 Single Sign-On (SSO) Cross-Platform Handshake Audit Report

**Audit Execution Timestamp:** 2026-09-14T12:42:15.000Z  
**Protocol:** OAuth 2.0 Authorization Code Flow with Signed Token Exchange  
**Source Platform:** Main Portal (`http://localhost:3000`) / Main API (`http://localhost:4000`)  
**Target Platform:** CTF Wars Platform (`http://localhost:3001`) / CTF Server (`http://localhost:5001`)  
**Operator:** Senior Full-Stack Test Engineer / Security QA Engineer  

---

### 1. SSO Architecture & Execution Trace

The mandatory cross-subsystem transition was executed from an authenticated Student browser context in the Main Portal to the CTF Wars Platform.

```
[Student in Main Portal] (Port 3000)
         ↓
Initiates CTF Launch / Join Terminal
         ↓
HTTP GET http://localhost:4000/api/oauth/authorize?redirect_uri=http://localhost:5001/api/auth/callback
         ↓
[Main Server validates JWT session, generates signed single-use authorization code]
         ↓
HTTP 302 Redirect to http://localhost:5001/api/auth/callback?code=<OAUTH_CODE>
         ↓
[CTF Backend validates code with Main API, creates/maps local participant record, issues HttpOnly cookie]
         ↓
HTTP 302 Redirect to http://localhost:3001/lobby
         ↓
[CTF Client calls GET http://localhost:5001/api/auth/me to establish authenticated session]
```

---

### 2. SSO Handshake Verification Matrix

| Verification Phase | Target Endpoint / Action | Expected Result | Actual Observed Result | Status |
|---|---|---|---|---|
| Authenticated Source User | `GET http://localhost:4000/api/auth/me` | Valid Student session | Authenticated: `student_6874@charusat.edu.in` | **PASS** |
| OAuth Authorize Request | `GET http://localhost:4000/api/oauth/authorize` | HTTP 302 with signed code | HTTP 302 redirect with valid authorization code | **PASS** |
| Callback Processing | `GET http://localhost:5001/api/auth/callback` | Exchange code for CTF JWT | Cookie set; redirected to `/lobby` | **PASS** |
| Destination Landing | `http://localhost:3001/lobby` | Client mounts lobby UI | Rendered lobby with competition discovery | **PASS** |
| Session Validation | `GET http://localhost:5001/api/auth/me` | Valid CTF authenticated payload | `{ authenticated: true, user: { userId: 'b032d08f-...', role: 'MEMBER' } }` | **PASS** |
| Identity Consistency | Cross-system User ID | User ID matches across both databases | `b032d08f-b70b-42ef-a8cd-1107d6fcc63e` matches 1:1 | **PASS** |
| Role Mapping | Student → CTF Role | STUDENT mapped to MEMBER | Role resolved as `MEMBER` | **PASS** |
| Token Refresh Persistence | Browser Reload at `/scoreboard` | Active session retained | Session intact without re-authentication | **PASS** |
| Session Isolation on Logout | Student logout in CTF | Faculty session unaffected | Faculty coordinator on Port 3000 remains active | **PASS** |

---

### 3. Identity and Membership Payload Verification

The identity payload returned by the CTF server session endpoint (`http://localhost:5001/api/auth/me`):

```json
{
  "status": 200,
  "data": {
    "authenticated": true,
    "user": {
      "userId": "b032d08f-b70b-42ef-a8cd-1107d6fcc63e",
      "email": "student_6874@charusat.edu.in",
      "role": "MEMBER",
      "name": "Aarav Mehta"
    }
  }
}
```

- **User ID Preservation:** The UUID `b032d08f-b70b-42ef-a8cd-1107d6fcc63e` generated during registration on the main server was carried through the authorization exchange and associated with CTF competition participant records.
- **Cross-Port Cookie Isolation:** Cookies set by Port 4000 (`sentinal_token`) and Port 5001 (`ctf_token`) operate with separate namespaces, preventing collision while enabling single sign-on federation.

---

### 4. Photographic Audit Evidence

- **OAuth Destination Landing:** `QA-REPORT/E2E/evidence/14_ctf_sso_redirect_destination.png`
- **CTF Lobby Authenticated State:** `QA-REPORT/E2E/evidence/15_ctf_lobby_page.png`

**Verdict:** **PASS**
