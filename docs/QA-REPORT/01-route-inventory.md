# Chapter 01 — Comprehensive Route Inventory & HTTP Status Audit

## 1. Scope & Methodology

Every reachable route across the Sentinal ecosystem was systematically probed using automated HTTP client requests. Measurements captured HTTP status codes, initial response duration (TTFB), content lengths in bytes, and critical security headers.

- **Main Platform Origin**: `http://localhost:3000` (Next.js 16.2.6 App Router)
- **CTF Platform Origin**: `http://localhost:3001` (Next.js 16.2.12 App Router)
- **Data Source**: [http_route_probe.json](file:///d:/A_Coding/A_MainCodes/Sentinal/QA-REPORT/evidence/http_route_probe.json)

---

## 2. Main Portal Route Audit Table (24 Routes)

| Route Path | HTTP Status | TTFB (ms) | Content Length (bytes) | Cache-Control Header | Content Security Policy | X-Frame-Options |
| :--- | :---: | :---: | :---: | :--- | :---: | :---: |
| `/` | 200 `[MEASURED]` | 129 `[MEASURED]` | 71,147 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/about` | 200 `[MEASURED]` | 654 `[MEASURED]` | 63,787 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/team` | 200 `[MEASURED]` | 940 `[MEASURED]` | 54,431 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/events` | 200 `[MEASURED]` | 554 `[MEASURED]` | 56,920 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/auth` | 200 `[MEASURED]` | 87 `[MEASURED]` | 31,255 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard` | 200 `[MEASURED]` | 49 `[MEASURED]` | 37,236 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard/events` | 200 `[MEASURED]` | 26 `[MEASURED]` | 36,971 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard/team` | 200 `[MEASURED]` | 24 `[MEASURED]` | 37,014 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard/teams` | 200 `[MEASURED]` | 31 `[MEASURED]` | 37,133 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard/profile` | 200 `[MEASURED]` | 26 `[MEASURED]` | 37,046 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard/leaderboard` | 200 `[MEASURED]` | 29 `[MEASURED]` | 37,343 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard/attendance` | 200 `[MEASURED]` | 25 `[MEASURED]` | 37,080 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard/certificates` | 200 `[MEASURED]` | 25 `[MEASURED]` | 37,105 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard/notifications` | 200 `[MEASURED]` | 26 `[MEASURED]` | 37,134 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard/audit` | 200 `[MEASURED]` | 31 `[MEASURED]` | 37,020 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard/feedback` | 200 `[MEASURED]` | 24 `[MEASURED]` | 37,058 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard/analytics` | 200 `[MEASURED]` | 26 `[MEASURED]` | 37,073 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard/ctf-management` | 200 `[MEASURED]` | 26 `[MEASURED]` | 37,143 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard/wargame-management` | 200 `[MEASURED]` | 29 `[MEASURED]` | 37,185 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard/settings` | 200 `[MEASURED]` | 25 `[MEASURED]` | 37,070 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/dashboard/maintenance` | 200 `[MEASURED]` | 26 `[MEASURED]` | 37,104 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/privacy` | 200 `[MEASURED]` | 39 `[MEASURED]` | 34,923 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/terms` | 200 `[MEASURED]` | 39 `[MEASURED]` | 34,818 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |
| `/contact` | 200 `[MEASURED]` | 38 `[MEASURED]` | 35,012 `[MEASURED]` | `no-cache, must-revalidate` | Present | `DENY` |

---

## 3. CTF Platform Route Audit Table (8 Routes)

| Route Path | HTTP Status | TTFB (ms) | Content Length (bytes) | Cache-Control Header | Content Security Policy | X-Frame-Options |
| :--- | :---: | :---: | :---: | :--- | :---: | :---: |
| `/` | 200 `[MEASURED]` | 22 `[MEASURED]` | 7,723 `[MEASURED]` | Not specified | Not specified | Not specified |
| `/lobby` | 200 `[MEASURED]` | 21 `[MEASURED]` | 7,728 `[MEASURED]` | Not specified | Not specified | Not specified |
| `/challenges` | 200 `[MEASURED]` | 22 `[MEASURED]` | 7,733 `[MEASURED]` | Not specified | Not specified | Not specified |
| `/scoreboard` | 200 `[MEASURED]` | 23 `[MEASURED]` | 7,733 `[MEASURED]` | Not specified | Not specified | Not specified |
| `/team` | 200 `[MEASURED]` | 24 `[MEASURED]` | 7,727 `[MEASURED]` | Not specified | Not specified | Not specified |
| `/rules` | 200 `[MEASURED]` | 21 `[MEASURED]` | 7,728 `[MEASURED]` | Not specified | Not specified | Not specified |
| `/profile` | 200 `[MEASURED]` | 20 `[MEASURED]` | 7,730 `[MEASURED]` | Not specified | Not specified | Not specified |
| `/admin` | 200 `[MEASURED]` | 21 `[MEASURED]` | 7,728 `[MEASURED]` | Not specified | Not specified | NotCad |

---

## 4. Analytical Observations & Security Findings

### 4.1 Server-Side HTML Rendering vs. Client Hydration
1. **Main Platform Dashboard Pages**:
   - Notice that all `/dashboard/*` routes return almost identical payload sizes (~37,000 bytes).
   - This occurs because Next.js renders the shared `DashboardLayout` shell on the server, while inner views rely entirely on client-side React hydration (`"use client"`).
   - When unauthenticated users perform a direct GET request, the server responds with HTTP 200 returning the client layout script. The client router then evaluates local authentication tokens and handles redirection or loading states in the browser.

2. **CTF Platform Shell Uniformity**:
   - All CTF routes return an identical shell size (~7,725 bytes).
   - The CTF platform uses a lightweight client single-page architecture where route components mount inside `AppShell.tsx`.

### 4.2 Security Header Discrepancies
- **Main Platform**: Strict adherence to security headers (`Content-Security-Policy`, `X-Frame-Options: DENY`, `Cache-Control: no-cache, must-revalidate`).
- **CTF Platform**: Lacks explicit security middleware in its development frontend server configuration. Production Nginx / Reverse Proxy must inject CSP, HSTS, and X-Frame-Options across the CTF domain.

### 4.3 Cold-Start TTFB Latency
- First-load access to complex TSX routes (`/team` at 940ms, `/about` at 654ms, `/events` at 554ms) reflects Next.js development-time JIT bundling (`PERF-001`). Warm cache responses settle below 40ms.
