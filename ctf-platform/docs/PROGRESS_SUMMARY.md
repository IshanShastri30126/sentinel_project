# CTF Wars — Progress Summary (Chunks 1–4)

> **Author:** Dhairya Tanna  
> **Last Updated:** 2026-08-06  
> **Status:** Chunks 1–4 Complete. Chunk 5 (Flag Submission Engine) is next.

---

## What Is CTF Wars?

CTF Wars is a **Capture The Flag (CTF) competition platform** built as an extension of the Sentinel portal. Players join competitions, solve cybersecurity challenges, and submit flags to earn points. It is designed to handle **150+ concurrent users** with real-time features like live leaderboards and admin freeze broadcasts.

**Key Architectural Decision:** CTF Wars shares the same PostgreSQL database and Redis instance as Sentinel. Users log in through Sentinel; CTF Wars reads their JWT cookie and grants access.

---

## Infrastructure Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Database** | PostgreSQL 16 (via Docker) | Stores users, competitions, challenges, submissions |
| **Cache / Locks** | Redis 7 (via Docker) | JWT blacklist, distributed locks, pub/sub |
| **Backend** | Node.js + Express + Socket.io | API server + WebSocket real-time engine |
| **ORM** | Prisma 6 | Type-safe database queries + auto-migrations |
| **Frontend** | Next.js 15 + React 19 + Shadcn/Aceternity | Player & Admin UI |
| **Validation** | Zod | Schema-based request body validation |

---

## Database Schema (6 Tables + 1 Shared)

```
┌──────────────────┐
│      User        │ ← Shared with Sentinel (DO NOT MODIFY)
│  (id, email,     │
│   role, name)    │
└────────┬─────────┘
         │ 1:N
         ▼
┌──────────────────┐        ┌──────────────────┐
│ CtfParticipant   │───────▶│ CtfCompetition   │
│ (totalScore,     │  N:1   │ (title, state,   │
│  tier, version)  │        │  startTime, etc) │
└──┬────────┬──────┘        └────────┬─────────┘
   │        │                        │ 1:N
   │        │                        ▼
   │        │               ┌──────────────────┐
   │        │               │  CtfChallenge    │
   │        │               │ (flagHash, pts,  │
   │        └──────────────▶│  solveCount, OCC)│
   │         Submissions    └──┬──────┬────────┘
   │                           │      │
   │  Activities               │      │ 1:N
   ▼                           ▼      ▼
┌──────────────────┐  ┌──────────┐  ┌──────────┐
│ChallengeActivity │  │CtfHint   │  │CtfSubmit │
│(OPENED/ATTEMPTED │  │(content, │  │(result,  │
│ /SOLVED)         │  │ cost)    │  │ points)  │
└──────────────────┘  └──────────┘  └──────────┘
```

---

## What Each Chunk Built

### Chunk 1: Documentation & Tech Stack Spec ✅
**Files Created:** `CTF_SRS.md`, `CTF_ARCHITECTURE.md`, `CTF_DESIGN.md`, `CTF_SCHEMA.md`, `CTF_TECHSTACK.md`

Defined the entire system before writing a single line of code. Includes the Software Requirements Specification (SRS), system architecture, ER diagram, and technology choices.

---

### Chunk 2: Backend & Frontend Scaffolding ✅
**Files Created:** `server/src/index.ts`, `server/prisma/schema.prisma`, `docker-compose.yml`, `client/` (Next.js app)

Set up the Express + Socket.io server with CORS, cookie parsing, and health check endpoint. Created the Prisma schema with all 6 tables. Set up Docker containers for PostgreSQL and Redis.

**Key Concept — Docker:** Runs PostgreSQL and Redis in isolated containers so every developer gets the exact same environment.

---

### Chunk 3: Auth Middleware & Role Guard ✅
**Files Created:** `server/src/middlewares/auth.ts`, `server/src/middlewares/roleGuard.ts`, `server/src/lib/db.ts`

Built the security layer that protects every API endpoint.

#### How Auth Works (3-Step Pipeline):
```
Request arrives → authMiddleware runs:
  1. Extract JWT from HttpOnly cookie (req.cookies.token)
  2. Verify JWT signature using JWT_SECRET
  3. Check Redis blacklist (has this token been revoked?)
  
  If all pass → attach user info to req.user → call next()
  If any fail → return 401 Unauthorized (request stops here)
```

#### How Role Guard Works (Higher-Order Function):
```typescript
// roleGuard returns a NEW middleware function pre-configured with allowed roles
roleGuard(["ADMIN", "FACULTY"])
// → returns (req, res, next) => { if req.user.role not in list → 403 }
```

**Key Concept — HttpOnly Cookies:** The browser sends the cookie automatically, but JavaScript on the page CANNOT read it. This prevents XSS attacks from stealing tokens.

**Key Concept — Redis Blacklist:** When a user logs out or gets kicked, their token's unique ID (`jti`) is stored in Redis with a TTL matching the token's expiry. Every API request checks this blacklist.

---

### Chunk 4: Competition & Challenge APIs ✅
**Files Created:** `server/src/routes/competitions.ts`, `server/src/routes/challenges.ts`, `server/src/validators/challenge.validator.ts`

Built the core REST API endpoints:

| Method | Route | Purpose | Auth Required |
|---|---|---|---|
| `GET` | `/api/competitions/active` | Find the currently running competition | Yes (any role) |
| `POST` | `/api/competitions/:id/join` | Register as a participant | Yes (any role) |
| `GET` | `/api/challenges?competitionId=X` | List all challenges (with user's solve status) | Yes (participant) |
| `GET` | `/api/challenges/:id` | Get challenge detail + track OPENED activity | Yes (participant) |
| `PATCH` | `/api/challenges/:id` | Admin live-fix (typos, hints) with OCC | Yes (ADMIN only) |

#### How the Request Flows End-to-End:
```
User clicks "Start CTF" on Sentinel
  → Browser navigates to CTF Wars (cookie travels automatically)
  → Frontend calls GET /api/competitions/active
    → authMiddleware extracts & verifies JWT cookie
    → Route handler queries DB for ACTIVE competition
    → Returns competition data to frontend
  → Frontend renders Challenge Board
  → User clicks a challenge card
  → Frontend calls GET /api/challenges/:id
    → authMiddleware runs again
    → Route handler fetches challenge (WITHOUT flagHash!)
    → Upserts an OPENED activity record (for admin heatmap)
    → Returns challenge detail to frontend
```

#### Key Concept — Zod Validation (Allowlisting):
```typescript
// Only these fields are allowed. Anything else is REJECTED by .strict()
const updateChallengeSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  initialPoints: z.number().int().min(10).max(5000).optional(),
  // ... flagHash is NOT listed, so it CANNOT be changed via this endpoint
}).strict();
```

#### Key Concept — OCC (Optimistic Concurrency Control):
```
Admin A reads challenge (version = 1)
Admin B reads challenge (version = 1)
Admin A saves changes → version becomes 2 ✅
Admin B tries to save → WHERE version = 1 → no match → count = 0 → 409 Conflict ❌
```
This prevents two admins from accidentally overwriting each other's changes.

#### Key Concept — Upsert (Create-or-Update):
Used in JOIN and activity tracking. If a user clicks "Join" twice, the second click just returns the existing record instead of crashing.

---

## How to Test (Postman)

1. **Start infrastructure:** `docker-compose up -d` (starts PostgreSQL + Redis)
2. **Create tables:** `cd server && npx prisma db push`
3. **Generate test token:** `ts-node generate-token.ts`
4. **Start server:** `npm run dev`
5. **Set Postman cookie:** Name=`token`, Value=`<your_jwt>`, Domain=`localhost`
6. **Test endpoints:**
   - `GET http://localhost:5001/api/health` → `{ status: "ok" }`
   - `GET http://localhost:5001/api/competitions/active` → competition data or null
   - `PATCH http://localhost:5001/api/challenges/123` with JSON body → Zod validation error

---

## File Tree (Current State)

```
ctf-wars/
├── docker-compose.yml          # PostgreSQL + Redis containers
├── docs/
│   ├── CTF_SRS.md              # Software Requirements Specification
│   ├── CTF_ARCHITECTURE.md     # System architecture document
│   ├── CTF_DESIGN.md           # UI/UX design rules
│   ├── CTF_SCHEMA.md           # Database schema documentation
│   ├── CTF_TECHSTACK.md        # Technology stack choices
│   ├── IMPLEMENTATION_PLAN.md  # 8-chunk roadmap
│   └── LEARNING_NOTES.md       # CS concepts learned per chunk
├── server/
│   ├── prisma/
│   │   └── schema.prisma       # Database blueprint (7 models)
│   ├── src/
│   │   ├── index.ts            # Express + Socket.io server entry
│   │   ├── lib/
│   │   │   └── db.ts           # Prisma singleton connection
│   │   ├── middlewares/
│   │   │   ├── auth.ts         # JWT extraction + Redis blacklist
│   │   │   └── roleGuard.ts    # Role-based access control factory
│   │   ├── routes/
│   │   │   ├── competitions.ts # GET /active, POST /:id/join
│   │   │   └── challenges.ts   # GET /, GET /:id, PATCH /:id
│   │   └── validators/
│   │       └── challenge.validator.ts  # Zod schema for PATCH
│   └── generate-token.ts       # Test helper to create JWT
└── client/                     # Next.js 15 frontend (scaffolded)
```

---

## What's Next: Chunk 5 — Flag Submission Engine

The hardest and most important chunk. When a player submits a flag, we need:

1. **Redis Distributed Lock** — Prevent two players from being scored as "1st solver" simultaneously
2. **bcrypt Flag Comparison** — Securely compare the submitted flag against the stored hash
3. **Parabolic Decay Scoring** — Calculate points using the formula: `points = max(minimum, initial - decay * (solveCount / decayCount)²)`
4. **OCC on Participant Score** — Safely increment the player's total score without race conditions
5. **Activity Status Update** — Mark the challenge as ATTEMPTED (wrong) or SOLVED (correct)
