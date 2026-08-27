# 🛡️ SENTINAL (CyberKavach 2.0) — 1-Month Comprehensive Technical & Operational Report

**Project**: SENTINAL / Chakravyuh Club Platform (CyberKavach 2.0)  
**Reporting Period**: Past 30 Days  
**Domain**: `chakravyuhclub.com`  
**Classification**: Technical Architecture, Security Audit, Developer Specification & Operational Manual  
**Author / Maintainer**: Tech Team Ops & Lead Developers  

---

## 📑 Table of Contents
1. [Executive Summary & 1-Month Transformation Overview](#1-executive-summary--1-month-transformation-overview)
2. [Chronological Changelog & Key Milestones](#2-chronological-changelog--key-milestones)
3. [Network & Maintenance Logs: Mechanism & Telemetry Architecture](#3-network--maintenance-logs-mechanism--telemetry-architecture)
4. [Security Improvements & OWASP Hardening (14-Domain Audit)](#4-security-improvements--owasp-hardening-14-domain-audit)
5. [Backend Architecture & Service Bifurcation](#5-backend-architecture--service-bifurcation)
6. [CTF Wars & Gamification Pipeline](#6-ctf-wars--gamification-pipeline)
7. [Developer Technical Manual for Teammates](#7-developer-technical-manual-for-teammates)
8. [Comprehensive User Manual (Role-by-Role Operations)](#8-comprehensive-user-manual-role-by-role-operations)
9. [System Maintenance & Deployment Runbook](#9-system-maintenance--deployment-runbook)

---

## 1. Executive Summary & 1-Month Transformation Overview

Over the past 30 days, the platform underwent a transformation from the legacy **CyberKavach** portal into **SENTINAL 2.0 / Chakravyuh Club Portal** (`chakravyuhclub.com`). The overhaul achieved four primary objectives:

1. **Enterprise-Grade Security Hardening**: Implementation of the 67-page OWASP Secure Coding Directives, Network Inspection Guards, anti-DevTools protections, strict Content Security Policy (CSP), Cross-Origin-Opener-Policy (COOP) headers for Google OAuth, payload sanitization, and 10-digit phone number integer validation constraints.
2. **Observability & Maintenance Telemetry**: Deployment of a real-time Security Operations & Maintenance dashboard featuring 9-field ASCII telemetry log streams, IP firewall filtering (allowlists/denylists), database connection pool health analytics, and in-app bug tracking.
3. **Backend Service Bifurcation**: Modular decoupling of the Node.js/Express monolithic core into distinct domain engines: Authentication & Device Binding, RBAC & Multi-Tier Approvals, Dynamic Certificate Generation (Konva & Puppeteer), QR-based Attendance Tracking, and Gamified CTF Wars SSO.
4. **Immersive Cyberpunk UI & UX Overhaul**: 7-tier animated Chakravyuh Plexus canvas, planetary-axis 3D rotating cards, role-adaptive profile forms (Faculty Employee ID vs Student Enrollment ID), dependent institute/department cascading pickers, and PWA integration.

---

## 2. Chronological Changelog & Key Milestones

### 📅 Week 1: Core Foundation, Identity & Migration
- **Brand & Domain Migration**: Rebranded all references from CyberKavach to Chakravyuh Club (`chakravyuhclub.com`), updated asset pipelines, unified logo vector components (`CyberKavachLogo.tsx`, `SentinalLogo.tsx`).
- **Database & Prisma Schema Sync**: Migrated Neon PostgreSQL schema with `prisma db push`, structured model relationships across `User`, `Event`, `Attendance`, `Certificate`, `Team`, `ApprovalRequest`, `AuditLog`, and `ClubSettings`.
- **Pre-seeded Role Governance**: Configured default faculty administrative credentials, purged obsolete hardcoded mock data, and implemented real-time database querying for the Member Directory.
- **Access Approval Workflow**: Built dual-action user onboarding pipeline (`Grant Access` vs `Reject Access`) ensuring permanent purge of rejected applicants to prevent database clutter.

### 📅 Week 2: Security Controls, Auth Pipeline & OAuth Hardening
- **OWASP Secure Coding Integration**: Standardized 14 security domains covering input validation, contextual output encoding, bcrypt password hashing, and parameterized queries.
- **Google OAuth Resilience**: Configured `Cross-Origin-Opener-Policy: same-origin-allow-popups` (COOP) and `Cross-Origin-Resource-Policy: cross-origin` across `next.config.ts` and Express server to eliminate popup blocker conflicts and postMessage drops.
- **Session & Cookie Security**: Configured token distribution using `HttpOnly`, `Secure`, `SameSite=Lax` cookies, automated 15-minute inactivity timeouts, and device binding fingerprint validation.
- **Profile & Role Differentiation**:
  - Replaced Student ID with **Employee ID** for Faculty accounts.
  - Suppressed the Semester attribute for faculty profiles.
  - Enforced strict 10-digit numeric mobile number constraints server-side and client-side.

### 📅 Week 3: Maintenance Telemetry & Real-Time Ops Dashboard
- **9-Field ASCII Telemetry Stream**: Designed and implemented real-time telemetry card log streaming in the Tech Team maintenance console.
- **Dynamic IP Firewall**: Added live CIDR and single IP blocking/allowlisting engine with dynamic memory caches and database persistence.
- **Database & Server Telemetry**: Built real-time monitors for PostgreSQL table counts, connection pool status, memory consumption, and API latency percentiles (p50, p95, p99).
- **Certificate Pipeline**: Resolved batch ZIP generation and rendering anomalies using Konva HTML5 canvas and backend Puppeteer rendering.

### 📅 Week 4: Visual Experience, Event Engine & Polish
- **Plexus Canvas 7-Tier Background**: Created high-performance interactive particle canvas backdrop on the About Us page with dark vignette overlays.
- **3D Planetary Axis Rotation**: Built custom CSS 3D matrix card transitions for executive crew cards.
- **Event Management & Registration**: Enhanced multi-organizer selection, countdown timer fallbacks, auto-fill capabilities, and registration modal scroll locks.
- **Network Inspection Guard**: Integrated automated client-side inspection detection, keyboard shortcut blocking (`F12`, `Ctrl+Shift+I`, `Ctrl+U`), and console log stripping in production builds.

---

## 3. Network & Maintenance Logs: Mechanism & Telemetry Architecture

### 3.1 Telemetry Ingestion & Real-Time Stream Engine
The Maintenance Telemetry system captures every HTTP transaction passing through the Express server via an interceptor pipeline:

```
[Incoming HTTP Request]
         │
         ▼
[requestId Middleware] ──► Generates UUIDv4 Tracing ID
         │
         ▼
[NetworkInspectionGuard] ──► Checks IP Firewall & CIDR Rules
         │
         ▼
[Express Route Execution] ──► Controller handles Business Logic
         │
         ▼
[sanitizeResponse] ──► Strips Stack Traces & Sensitive Headers
         │
         ▼
[Telemetry Formatter] ──► Generates 9-Field ASCII Stream Object
         │
         ├──► Broadcasts via Socket.IO room ("tech_maintenance")
         └──► Appends to Circular Memory Buffer (500 most recent logs)
```

### 3.2 The 9-Field ASCII Telemetry Card Specification
Each network request is serialized into a structured 9-field telemetry block displayed live on the Tech Maintenance Dashboard:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ [SENTINAL-SEC-LOG] 2026-08-27T07:40:12.891Z                                │
├──────────────────────────┬──────────────────────────────────────────────────┤
│ 1. Trace ID              │ req_98f41b80-60b2-4d57-b08e-324f9c0b7a81        │
│ 2. Timestamp             │ 2026-08-27 13:10:12 UTC+5:30                     │
│ 3. Client IP / Host      │ 103.24.89.112 (AS133618 / IN)                    │
│ 4. HTTP Method & Path    │ POST /api/auth/login                             │
│ 5. Response Status       │ 200 OK (24.8ms)                                  │
│ 6. User Identity         │ ishan.shastri@chakravyuhclub.com [ROLE: TECH]    │
│ 7. Device Fingerprint    │ fp_7d9e4c1a2f (Chrome 128 / Windows 11)         │
│ 8. Threat / Anomaly Lvl  │ SCORE: 0.02 (CLEAN / LOW_RISK)                   │
│ 9. Firewall Action       │ PASS_ALLOW (Rule: #DEFAULT_WHITELIST)            │
└──────────────────────────┴──────────────────────────────────────────────────┘
```

### 3.3 Dynamic IP Firewall Engine
- **In-Memory Cache + Persistent Storage**: Active firewall rules are loaded into memory on server boot and stored in `ClubSettings` (`IP_FIREWALL_RULES`).
- **Dynamic Action Policies**:
  - `ALLOW`: Explicitly whitelisted IP ranges bypass aggressive rate limiters.
  - `BLOCK`: Immediate `403 Forbidden` response without triggering backend route handlers.
  - `MONITOR`: Full logging with elevated threat tracking score.
- **CIDR & Subnet Matching**: Supports both IPv4 single hosts (`192.168.1.50`) and CIDR subnets (`10.0.0.0/24`).

### 3.4 Client-Side Network Inspection Guard (`NetworkInspectionGuard.tsx`)
1. **Shortcut Interception**: Blocks `F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+Shift+C`, and `Ctrl+U` (view source).
2. **Context Menu Shield**: Disables right-click context menu inspection across protected routes.
3. **Console Neutralization**: Overrides `console.log`, `console.warn`, and `console.debug` in production to prevent credential and token exposure.
4. **DOM Mutation Defense**: Detects DevTools opening via outer vs inner window dimension variance heuristics and renders a security warning overlay.

---

## 4. Security Improvements & OWASP Hardening (14-Domain Audit)

The system enforces 100% compliance with the 14 OWASP Secure Coding Directives:

| Category | Implementation in SENTINAL 2.0 / Chakravyuh | Verification Status |
| :--- | :--- | :---: |
| **1. Input Validation** | Server-side Zod validation on all POST/PUT/PATCH endpoints. Strict character allowlisting, null byte `%00` detection, path traversal rejection, and 10-digit integer phone validation. | ✅ ACTIVE |
| **2. Output Encoding** | Contextual HTML attribute and body encoding across Next.js React components to prevent Cross-Site Scripting (XSS). | ✅ ACTIVE |
| **3. Authentication** | Bcrypt password hashing (12 rounds), account lockout after 5 consecutive failures, generic error messages ("Invalid username or password"), POST-only credential transport. | ✅ ACTIVE |
| **4. Session Management** | JWT issued in `HttpOnly`, `Secure`, `SameSite=Lax` cookies; 15-minute inactivity auto-logout; device fingerprint binding to sessions. | ✅ ACTIVE |
| **5. Access Control (RBAC)** | Strict server-side `requireRole` middleware with deny-by-default logic across 7 hierarchical tiers: `FACULTY`, `STUDENT_COORDINATOR`, `TECH`, `CONTENT`, `SOCIAL_MEDIA`, `MEMBER`, `GUEST`. | ✅ ACTIVE |
| **6. Cryptography** | CSPRNG UUID generation for reset tokens, SHA-256 for CTF flag verification, AES encrypted secrets in environment variables. | ✅ ACTIVE |
| **7. Error Handling & Logs** | Sanitize response middleware removes internal error stack traces and database schema errors before reaching client. Audit logging of all state mutations. | ✅ ACTIVE |
| **8. Data Protection** | `Cache-Control: no-store, no-cache, must-revalidate` on all sensitive APIs. No sensitive data stored in `localStorage` or URL query strings. | ✅ ACTIVE |
| **9. Transport Security** | Mandatory TLS 1.3/1.2; HSTS headers; `Referrer-Policy: strict-origin-when-cross-origin`. | ✅ ACTIVE |
| **10. System Configuration** | Disabled `X-Powered-By` header; Helmet security suite; directory listing disabled (403); production sourcemaps disabled (`productionBrowserSourceMaps: false`). | ✅ ACTIVE |
| **11. Database Hardening** | Strongly typed parameterized queries via Prisma ORM eliminating SQL Injection risks. Lowest privilege database connection pooling. | ✅ ACTIVE |
| **12. File Upload Security** | Multer + Cloudinary direct secure uploads. Strict MIME-type checking (JPEG, PNG, WebP, PDF only) and 10MB file size limits. | ✅ ACTIVE |
| **13. Memory Management** | Bounded request stream buffering, JSON body size limited to 10MB to prevent memory exhaustion / DoS attacks. | ✅ ACTIVE |
| **14. COOP / OAuth Isolation** | Configured `Cross-Origin-Opener-Policy: same-origin-allow-popups` allowing secure Google OAuth popups while isolating cross-origin browsing contexts. | ✅ ACTIVE |

---

## 5. Backend Architecture & Service Bifurcation

The backend architecture is segregated into specialized micro-modules:

```
server/src/
├── config.ts                    # Central configuration & ENV validation
├── index.ts                     # Express server & Socket.IO initialization
├── middlewares/                 # Security, Auth, Validation & Interceptors
│   ├── auth.ts                  # JWT token validation & RBAC gatekeeper
│   ├── auditLog.ts              # Action logging interceptor
│   ├── networkInspectionGuard.ts# Firewall & IP filter middleware
│   ├── requestId.ts             # UUID request tracing
│   ├── sanitizeResponse.ts      # Data leakage prevention
│   ├── suspiciousPayload.ts     # SQLi/XSS/Traversal detection
│   ├── upload.ts                # Multer Cloudinary storage
│   └── validate.ts              # Zod schema validator
├── routes/                      # Decoupled Domain APIs
│   ├── analytics.ts             # Member count, events & engagement stats
│   ├── appreciation.ts          # Badges & appreciation points pipeline
│   ├── approvals.ts             # Multi-tier administrative approval engine
│   ├── attendance.ts            # QR Code scan & attendance logging
│   ├── auth.ts                  # Login, Register, Password Reset & Me
│   ├── certificates.ts          # Certificate templates & generation
│   ├── clubs.ts                 # Club namespace & organization data
│   ├── events.ts                # Event lifecycle, RSVP & organizers
│   ├── maintenance.ts           # Telemetry, Firewall, DB stats, Bugs
│   ├── notifications.ts         # User notifications & alerts
│   ├── oauth.ts                 # CTF Wars SSO & OAuth code exchange
│   ├── settings.ts              # Dynamic club settings & configuration
│   ├── teams.ts                 # Team roster & executive crew management
│   └── users.ts                 # User management, roles & clearance
└── lib/                         # Core Utilities & External Services
    ├── auditLogger.ts           # Database audit logging
    ├── cloudinaryService.ts     # Cloudinary media management
    ├── emailService.ts          # Nodemailer transactional emails
    ├── firewallRules.ts         # In-memory IP matching engine
    ├── loginRateLimiter.ts      # Rate limiter & brute-force shield
    ├── notificationService.ts   # Push notification dispatcher
    ├── prisma.ts                # Prisma ORM client instance
    ├── redis.ts                 # Upstash Redis client
    └── socket.ts                # Socket.IO event broadcaster
```

---

## 6. CTF Wars & Gamification Pipeline

The platform integrates a CTF (Capture The Flag) engine with Single Sign-On (SSO):

1. **OAuth 2.0 Authorization Code Flow**:
   - `GET /api/oauth/authorize`: Generates a single-use authorization code for verified users.
   - `POST /api/oauth/token`: Exchanges authorization code for session tokens.
   - `GET /api/oauth/userinfo`: Delivers role, identity, and CTF permissions to the CTF arena.
2. **Dynamic Point Decay Engine**:
   - Challenges dynamically decrease in point value as more participants solve them:
   $$\text{Points} = \max\left(\text{MinPoints}, \text{InitPoints} - \left\lfloor \frac{\text{SolveCount}}{\text{DecayCount}} \times (\text{InitPoints} - \text{MinPoints}) \right\rfloor\right)$$
3. **Automated Flag Validation**:
   - Compares SHA-256 flag hashes to prevent plaintext flag discovery.
   - Logs every solve, hint unlock, and incorrect attempt to `ctf_audit_logs`.

---

## 7. Developer Technical Manual for Teammates

### 7.1 Tech Stack Summary
- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, TailwindCSS, Framer Motion, Konva Canvas (`react-konva`), Lucide Icons, Socket.IO Client.
- **Backend**: Node.js v22+, Express, TypeScript, Prisma ORM, PostgreSQL (Neon / CockroachDB), Upstash Redis, Nodemailer, Cloudinary, Puppeteer.
- **Authentication**: JWT, Bcrypt, Google OAuth 2.0 (`@react-oauth/google`).

### 7.2 Environment Variable Checklist (`.env`)

#### Server `.env`
```env
PORT=5000
DATABASE_URL="postgresql://user:password@neon-db-host/chakravyuh?sslmode=require"
JWT_SECRET="super-secure-jwt-secret-key"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000,https://chakravyuhclub.com"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="notifications@chakravyuhclub.com"
SMTP_PASS="app-specific-password"
GOOGLE_CLIENT_ID="google-client-id.apps.googleusercontent.com"
```

#### Client `.env.local`
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="google-client-id.apps.googleusercontent.com"
```

### 7.3 Database Migrations & Seeding
```bash
# Push Prisma Schema to database
cd server
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

---

## 8. Comprehensive User Manual (Role-by-Role Operations)

### 👤 8.1 For General Members & Students
- **Registration**: Register with full name, college email, 10-digit mobile number, institute, department, semester (1–8), and enrollment ID.
- **Event Participation**: Browse public events, view registration deadlines, register with one click, and receive automated email confirmations.
- **Attendance & Certificates**: Present your unique QR code at event check-in. Once attendance is confirmed and the certificate is released, download your verified PDF certificate from the **My Certificates** dashboard.
- **CTF Arena**: Jump directly into CTF Wars using your single sign-on credentials.

### 👔 8.2 For Student Coordinators & Team Leads
- **Event Creation**: Navigate to **Dashboard > Events > Create Event**. Fill in title, date/time pickers, capacity, poster image, custom social links, and assign co-organizers.
- **Attendance Scanner**: Use the built-in webcam QR Scanner at **Dashboard > Attendance** to verify attendees in real time.
- **Team Management**: Manage sub-teams, assign member tasks, and track point leaderboards.

### 🎓 8.3 For Faculty Coordinators
- **Approvals Hub**: Review pending requests (Event Permissions, Resource Allocations, Budget Authorizations, Certificate Releases) with 1-click **Approve** or **Reject** with audit notes.
- **User Clearance**: Approve or reject newly registered student accounts.
- **Faculty Profile**: Displays your unique **Employee ID** and academic department (with semester fields cleanly hidden).

### 🛠️ 8.4 For Tech Team & System Administrators
- **Maintenance Console**: Monitor live 9-field ASCII telemetry logs, observe server latency percentiles, and inspect DB health.
- **Firewall Controls**: Add, update, or revoke IP blocking rules.
- **Bug Tracker**: Triage user-submitted bug tickets, change status (`OPEN` -> `IN_PROGRESS` -> `RESOLVED`), and assign issues to teammates.

---

## 9. System Maintenance & Deployment Runbook

### Starting Services Locally
```powershell
# In terminal 1 (Backend)
cd server
npm run dev

# In terminal 2 (Frontend)
cd client
npm run dev
```

### Production Build & Deployment Checklist
1. Verify `productionBrowserSourceMaps: false` in `next.config.ts`.
2. Confirm `DATABASE_URL` connectivity and run `npx prisma db push`.
3. Check CORS configuration allowing production domains (`chakravyuhclub.com`).
4. Ensure Google OAuth Client ID has authorized Javascript origins and redirect URIs.

---

*Report automatically generated and archived by Chakravyuh Security Ops.*
