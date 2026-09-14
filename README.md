<div align="center">
  <img src="https://img.shields.io/badge/Version-3.0-red.svg" alt="Version 3.0" />
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status" />
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Node.js-Express-green?logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Sockets-Socket.io-010101?logo=socket.io" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL_Prisma-blue?logo=postgresql" alt="PostgreSQL" />
</div>

<br />

# 🌀 Chakravyuh Sentinel 3.0 & CTF Wars Platform

**Chakravyuh Sentinel 3.0** is an enterprise-grade cyber operations, club management, and competitive Capture The Flag (CTF) intelligence hub developed for the **Chakravyuh Cyber Security & Operations Club**.

Version 3.0 merges the core Sentinel management platform with **CTF Wars**—a dedicated, real-time cyber competition engine engineered for 150+ concurrent competitors with dynamic scoring, distributed locks, WebSockets live broadcasts, and 5-tier role-based operational security.

---

## ✨ Features

### 🛡️ Core Sentinel Portal
- **5-Tier Role-Based Access Control (RBAC):** Hierarchical clearance levels (Faculty, Student Coordinators, Tech Team, Social Media, and Club Members) with dual-control gateway authorization.
- **Advanced Event Management:** End-to-end event lifecycles. Create events, manage registrations, track faculty approvals, configure custom social links, and automate attendance QR scanning.
- **Dynamic Certificate Engine:** Canvas-based interactive certificate designer with bulk CSV issuing, auto-rendering, Cloudinary cloud storage, and automated verification codes.
- **AI Operational Intelligence:** Embedded Google Gemini AI assistant for real-time club telemetry, query resolution, and security briefings.
- **PWA & Mobile-First Experience:** Offline-ready Progressive Web App with custom service worker caching, instant navigation, and animated cyber drawers.
- **Security & Network Inspection Guard:** OWASP Top 10 hardened, anti-tampering shields, request signing, server-side payload sanitization, and strict Content-Security-Policy.

### ⚔️ CTF Wars Arena
- **Real-Time CTF Competition Engine:** Host multi-round cybersecurity competitions with dynamic categories (Web, Reverse Engineering, Cryptography, Forensics, OSINT, Pwn).
- **Sub-Second Real-Time Scoreboard:** WebSockets (Socket.io) broadcast channel delivering instant solve events, dynamic rankings, and leaderboard freeze controls.
- **Distributed Redis Concurrency:** Redis-backed distributed locks (`Redlock`), flag submission rate limiters, hint penalty deductions, and atomic score updates.
- **Comprehensive Admin & Heatmap Suite:** Live submission stream, solve heatmaps, participant status tracking, and admin competition freeze overlays.
- **Participant Command Center:** Dedicated challenge dialogs, hint purchase confirmations, personal score timeline graphs, and team lobbies.

---

## 🚀 Tech Stack

### **Main Portal (`client` & `server`)**
- **Frontend:** Next.js 14/15 (App Router), Tailwind CSS, Framer Motion, Lucide Icons, TypeScript
- **Backend:** Node.js, Express.js, Prisma ORM, PostgreSQL (Neon / Docker), Redis (Upstash / Local)
- **Integrations:** Cloudinary, Resend API, Google Gemini AI, Google OAuth

### **CTF Wars Platform (`ctf-platform`)**
- **Frontend (`ctf-platform/client`):** Next.js 15, React 19, Tailwind CSS, Radix UI / Shadcn, Socket.io-client
- **Backend (`ctf-platform/server`):** Node.js, Express, Socket.io, Prisma ORM, Redis 7, Zod Validation

---

## 📂 Project Structure

```text
Chakravyuhclub/
├── client/                     # Sentinel Web Portal (Next.js App Router)
│   ├── public/                 # Static assets, logos, service worker (PWA)
│   ├── src/
│   │   ├── app/                # Portal pages (dashboard, events, team, auth)
│   │   ├── components/         # Cyber UI components, guards, animations
│   │   └── lib/                # API client, auth context, security utils
│   └── package.json
├── server/                     # Sentinel Backend API Server (Node/Express)
│   ├── prisma/                 # Database schema & migrations
│   ├── src/
│   │   ├── middlewares/        # Auth, RBAC, network inspection, sanitization
│   │   ├── routes/             # Events, users, approvals, attendance, auth
│   │   └── lib/                # Redis, Cloudinary, Email, Audit Logger
│   └── package.json
├── ctf-platform/               # CTF Wars Real-time Competition Platform
│   ├── client/                 # CTF Wars Player & Admin Interface (Next.js 15)
│   │   ├── src/app/            # Challenges, lobby, leaderboard, admin heatmap
│   │   ├── src/components/     # Live solve toasts, freeze overlays, challenge modals
│   │   └── src/hooks/          # WebSockets & competition lifecycle hooks
│   ├── server/                 # CTF Real-time Socket & API Server
│   │   ├── prisma/             # CTF Schema (Competitions, Challenges, Submissions)
│   │   ├── src/sockets/        # Socket.io scoreboard broadcast
│   │   ├── src/lib/            # Redis distributed locks, dynamic scoring
│   │   └── src/routes/         # Challenge submissions, admin controls
│   └── docs/                   # Architectural blueprints, SRS, and schemas
└── README.md
```

---

## ⚙️ Environment Configuration

Create `.env` files in their respective folders before running services:

### `server/.env` (Sentinel API)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/chakravyuh"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secure-jwt-secret"
FRONTEND_URL="http://localhost:3000"
PORT=4000
CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
GEMINI_API_KEY="your-google-gemini-key"
RESEND_API_KEY="your-resend-api-key"
```

### `client/.env.local` (Sentinel Client)
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_WS_URL="http://localhost:4000"
```

### `ctf-platform/server/.env` (CTF Server)
```env
PORT=4001
DATABASE_URL="postgresql://user:password@localhost:5432/chakravyuh"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secure-jwt-secret"
CTF_CLIENT_URL="http://localhost:3001"
```

### `ctf-platform/client/.env.local` (CTF Client)
```env
NEXT_PUBLIC_API_URL="http://localhost:4001/api"
NEXT_PUBLIC_WS_URL="http://localhost:4001"
NEXT_PUBLIC_PORTAL_URL="http://localhost:3000"
```

---

## 🛠️ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/IshanShastri30126/Chakravyuhclub.git
cd Chakravyuhclub
```

### 2. Install Dependencies & Setup Sentinel

**Backend Server:**
```bash
cd server
npm install
npx prisma generate
npm run dev
```

**Frontend Client:**
```bash
cd client
npm install
npm run dev
```
*Sentinel is accessible at `http://localhost:3000`.*

---

### 3. Launch the CTF Wars Arena

**CTF Backend Server:**
```bash
cd ctf-platform/server
npm install
npx prisma generate
npm run dev
```

**CTF Frontend Client:**
```bash
cd ctf-platform/client
npm install
npm run dev
```
*CTF Wars Arena is accessible at `http://localhost:3001`.*

---

## 📜 Available Scripts

| Location | Command | Description |
|---|---|---|
| `client/` | `npm run dev` | Run Sentinel Next.js dev server |
| `client/` | `npm run build` | Build production Next.js portal |
| `server/` | `npm run dev` | Run Sentinel Express server with live reload |
| `server/` | `npm run build` | Compile TypeScript backend |
| `ctf-platform/client/` | `npm run dev` | Run CTF Wars arena client |
| `ctf-platform/server/` | `npm run dev` | Run CTF real-time WebSocket backend |

---

<div align="center">
  <i>Developed with ❤️ for Chakravyuh Cyber Security & Operations Club.</i>
</div>
