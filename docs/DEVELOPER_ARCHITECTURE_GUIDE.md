# 🛠️ SENTINAL 2.0 (Chakravyuh Club) — Developer & Teammate Architecture Guide

This guide is designed for developers and teammates maintaining, extending, and operating the **SENTINAL (CyberKavach 2.0)** platform.

---

## 🏗️ 1. Architecture Overview

SENTINAL is built as a high-performance, security-hardened full-stack web application:

```
┌────────────────────────────────────────────────────────┐
│                   Next.js 14 Client                    │
│    App Router • React 18 • TailwindCSS • Framer Motion  │
│         Konva Canvas • Socket.IO • PWA Integration      │
└──────────────────────────┬─────────────────────────────┘
                           │ (HTTPS / JSON / WSS)
                           ▼
┌────────────────────────────────────────────────────────┐
│               Node.js + Express API Gateway            │
│     Zod Validation • OWASP Hardening • IP Firewall      │
│   Rate Limiting • Telemetry Interceptors • JWT Auth    │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
               ▼                           ▼
┌─────────────────────────────┐ ┌─────────────────────────┐
│     Neon PostgreSQL DB      │ │   Upstash Redis Cache   │
│   Prisma ORM • 15+ Tables   │ │  Session & Config Cache │
└─────────────────────────────┘ └─────────────────────────┘
```

---

## 🧩 2. Backend Service Bifurcation

The backend logic in `server/src/` is decoupled into isolated modules:

### 2.1 Middleware Layer (`server/src/middlewares/`)
- `auth.ts`: Decodes JWT tokens from `HttpOnly` cookies, enforces active user clearance, and verifies RBAC roles (`requireRole(...)`).
- `networkInspectionGuard.ts`: Evaluates client IP against in-memory CIDR rules and applies firewall policies (`ALLOW`, `BLOCK`, `MONITOR`).
- `requestId.ts`: Attaches a unique `req.id` (UUIDv4) to every incoming request for distributed tracing.
- `sanitizeResponse.ts`: Intercepts outgoing JSON payloads to prevent leaking internal database stack traces or confidential fields.
- `suspiciousPayload.ts`: Screens request bodies for SQL injection, XSS vectors, null bytes, and directory traversal attempts.
- `validate.ts`: Validates request bodies against strongly typed Zod schemas.
- `upload.ts`: Multer middleware streaming file uploads directly to Cloudinary with MIME-type verification.

### 2.2 Route Controllers (`server/src/routes/`)
- `/api/auth`: Login, registration, logout, password resets, and session identity endpoint (`/me`).
- `/api/approvals`: Multi-tier approval state machine for events, budget, and resources.
- `/api/attendance`: Real-time QR scanner check-in/out and Excel exports.
- `/api/certificates`: Dynamic Konva template designer and Puppeteer batch PDF generator.
- `/api/events`: Event CRUD, RSVP bookings, organizer assignments, and countdown schedules.
- `/api/maintenance`: Telemetry log streaming, database metrics, bug reports, and IP firewall management.
- `/api/oauth`: CTF Wars Single Sign-On and OAuth 2.0 authorization code exchange.
- `/api/teams`: Executive crew structure, team leadership, and peer appreciation leaderboards.
- `/api/users`: User management, clearance approvals, and directory data.

---

## 🗄️ 3. Database Schema & Relationships (Prisma)

### Key Database Models:
- **`User`**: Account identity, hashed password, role (`FACULTY`, `STUDENT_COORDINATOR`, `TECH`, `CONTENT`, `SOCIAL_MEDIA`, `MEMBER`, `GUEST`), Employee/Student ID, 10-digit mobile number, device fingerprint, and approval status.
- **`Event`**: Title, slug, description, date/time, capacity, registration deadlines, status (`DRAFT`, `PUBLISHED`, `COMPLETED`, `CANCELLED`), and organizer relations.
- **`EventRegistration`**: Join model linking `User` and `Event` with unique QR verification hashes.
- **`Attendance`**: Timestamped check-in and check-out logs linked to registrations.
- **`CertificateTemplate` & `Certificate`**: Visual canvas JSON layouts, recipient bindings, Cloudinary PDF URLs, and unique verification tokens.
- **`ApprovalRequest` & `ApprovalStep`**: Multi-tiered review flows with decision history and audit notes.
- **`AuditLog`**: Tamper-evident record of all sensitive actions (Timestamp, User ID, IP, User Agent, Action, Status).
- **`ClubSettings`**: Key-value JSON store for dynamic configurations (Firewall rules, Bug tickets, Landing page content).

---

## 🔒 4. Security Directives & OWASP Hardening Checklist

When developing new features, all team members MUST follow these directives:
1. **Never use raw SQL queries**: Always use Prisma ORM parameterized methods.
2. **Never expose credentials in GET URLs**: All sensitive payloads must use POST/PUT/PATCH with Zod validation.
3. **Always validate phone numbers**: Enforce exact 10-digit numeric constraint (`^\d{10}$`).
4. **Contextual Role Displays**:
   - If user is `FACULTY`, use `employeeId` and do not display or require `semester`.
   - If user is a student role, require `studentId` and `semester`.
5. **Sanitize logging**: Do not log tokens, passwords, or PII to stdout in production.
6. **Maintain COOP / CSP headers**: Keep `Cross-Origin-Opener-Policy: same-origin-allow-popups` active for Google OAuth.

---

## 🚀 5. Local Setup & Production Deployment

### Prerequisites
- Node.js v20+ or v22+
- PostgreSQL database (Local or Cloud Neon instance)
- Upstash Redis instance
- Cloudinary account

### Running Development Environment
```powershell
# 1. Start Server
cd server
npm install
npx prisma generate
npm run dev

# 2. Start Client
cd ../client
npm install
npm run dev
```

### Building for Production
```powershell
# In server directory:
npm run build

# In client directory:
npm run build
```

---

*SENTINAL Platform Engineering Team • Chakravyuh Club*
