# CTF Wars — Architecture & System Design

> **Author:** Engineering Team (Dhairya Tanna)
> **Status:** APPROVED

---

## 1. High-Level System Architecture (Standalone)

CTF Wars is built as a **Standalone Application**. It has its own dedicated Node.js backend and Next.js frontend, completely independent of the main Sentinel portal. 

However, to ensure users don't have to create new accounts, CTF Wars connects to the **same PostgreSQL database** and **same Redis instance** that Sentinel uses.

### 1.1 System Diagram
*   **Frontend (Next.js):** The website the players see. It communicates with the backend via REST APIs and WebSockets.
*   **Backend (Node.js/Express):** The engine. It calculates scores, verifies flags, and broadcasts WebSocket events.
*   **Database (PostgreSQL):** Where all permanent data lives (Users, Challenges, Scores). Shared with Sentinel.
*   **Cache/Queue (Redis):** Super-fast temporary memory. Used for the JWT Blacklist (instant logouts) and queuing flag submissions so the database doesn't crash.

---

## 2. Directory Structure

Since CTF Wars is completely independent, all its code lives in the `ctf-wars` folder, safely away from `sentinel`.

```text
ctf-wars/
├── docs/                   # Where this documentation lives
├── client/                 # The Next.js frontend application
│   ├── package.json
│   ├── src/app/            # Pages and routes
│   └── src/components/     # UI Components (Buttons, Leaderboard)
└── server/                 # The Express.js backend application
    ├── package.json
    ├── prisma/             # Database connection and schema
    └── src/                # API Routes and logic
```

---

## 3. Data Flow Diagrams (DFD)

### 3.1 Standard Flag Submission Flow
When a player submits a flag, here is exactly what happens step-by-step:
1.  **Submit:** Player clicks "Submit Flag" on the frontend.
2.  **Auth Check:** Node.js checks their JWT cookie and verifies they aren't in the Redis Blacklist.
3.  **Locking:** Node.js tells Redis, "Lock this challenge for a split second so no one else can submit at the exact same time."
4.  **Verification:** Node.js checks if the submitted flag matches the hashed flag in PostgreSQL.
5.  **Scoring:** If correct, Node.js calculates the new Parabolic Decay score and updates the database.
6.  **Broadcast:** Node.js sends a WebSocket message to all players to update the live scoreboard.

### 3.2 The Admin Interruption (5-Second Freeze)
If a Question Setter needs to fix a typo in a live challenge:
1.  **Edit:** Admin edits and saves the challenge in the dashboard.
2.  **Broadcast:** The Node.js server instantly fires a WebSocket event: `ctf:admin:freeze`.
3.  **Freeze:** Every single player's screen instantly locks up with a pop-up saying "Challenge Updated" and a 5-second countdown timer.
4.  **Unlock:** After 5 seconds, the screens unlock, ensuring no one submitted a flag during the confusion.

---

## 4. Cross-Domain Authentication

Because CTF Wars and Sentinel are separate, they share logins using a **Cross-Domain Cookie**.

1.  User logs into `portal.Sentinel.com`.
2.  The server gives them a JWT cookie set to the parent domain: `Domain=.Sentinel.com`.
3.  When the user visits `ctf.Sentinel.com` (CTF Wars), their browser automatically sends that same cookie.
4.  Our CTF Wars Node.js server reads it, verifies it, and logs them in instantly.

---

## 5. Concurrency Control Strategy

*How we prevent the server from crashing when 150 people submit a flag at the same time.*

We use a **3-Layer Defense System**:

*   **Layer 1 (Redis Locks):** Before Node.js even touches the database, it creates a temporary lock in Redis. If two people submit at the same millisecond, Redis forces one of them to wait a few milliseconds in line.
*   **Layer 2 (Optimistic Concurrency - OCC):** If the lock fails, we rely on a `version` number in the database. If Person A and Person B try to update the score at the exact same time, the database accepts Person A (changes version from 1 to 2) and rejects Person B (who tried to save over version 1). Person B's request is safely retried.
*   **Layer 3 (Database Constraints):** The absolute last line of defense. We tell PostgreSQL, "Never allow the same user to have two successful submissions for the same challenge." If Layers 1 and 2 fail, the database outright blocks the duplicate.
