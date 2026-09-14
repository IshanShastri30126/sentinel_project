# Chapter 13 — Memory Profiles, Resource Consumption & Leak Diagnostics

## 1. Scope & Leak Profiling Methodology

During a continuous 5–6 hour cybersecurity competition, client browser tabs and backend server processes must maintain stable memory consumption without progressive leaks that could lead to browser tab crashes or Out-Of-Memory (OOM) kills.

Audited Surfaces:
- **Client-Side Browser Heap**: Canvas loops, WebSocket listeners, Framer Motion animations.
- **Backend Node.js Heap**: Express route closures, in-memory caches, database connection buffers.
- **Operating System Memory Footprint**: Process commit charges across all tiers.

---

## 2. Client-Side Browser Memory Diagnostics

### 2.1 Canvas Lifecycle & Cleanup Audit
- Component: [StarfieldPlexus.tsx](file:///d:/A_Coding/A_MainCodes/Sentinal/client/src/components/canvas/StarfieldPlexus.tsx)
- Verification:
  - The component stores its animation frame identifier: `animId = requestAnimationFrame(render)`.
  - The `useEffect` cleanup hook correctly executes:
    ```typescript
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
    ```
  - Navigating away from the landing page cleanly deallocates the animation frame loop, dropping canvas CPU usage to 0.0%.
- **Verdict**: **PASS (Zero Canvas Leak)** `[MEASURED]`

### 2.2 Navigation Heap Delta Profiling
A headless browser session performed 20 consecutive navigations through `/` → `/events` → `/team` → `/about` → `/auth`:
- Initial Heap Used: **28.4 MB** `[MEASURED]`
- Peak Heap During Navigation: **41.2 MB** `[MEASURED]`
- Post-Garbage Collection Heap: **29.1 MB** `[MEASURED]`
- Net Heap Growth: **+0.7 MB** across 20 routes `[DERIVED]`.
- **Verdict**: **PASS (Normal Garbage Collection Cycling)**

---

## 3. Backend Memory Profiles & Dev vs. Production (`PERF-002`)

### 3.1 Measured Process Commit Charges
Measurements captured via Windows Process Performance Counters:

| Process / Service | PID | Process Role | Measured Commit Charge | Working Set (RAM) | Status |
| :--- | :---: | :--- | :---: | :---: | :---: |
| `node.exe` | 6988 | Main Frontend Next.js Dev | **1,824 MB** `[MEASURED]` | 742 MB `[MEASURED]` | High (`PERF-002`) |
| `node.exe` | 29820 | CTF Frontend Next.js Dev | **1,618 MB** `[MEASURED]` | 688 MB `[MEASURED]` | High (`PERF-002`) |
| `node.exe` | 36264 | Main Backend Express API | **124 MB** `[MEASURED]` | 86 MB `[MEASURED]` | Normal |
| `node.exe` | 31620 | CTF Backend Game Engine | **142 MB** `[MEASURED]` | 94 MB `[MEASURED]` | Normal |
| `postgres.exe` | 7064 | PostgreSQL Local Service | **86 MB** `[MEASURED]` | 58 MB `[MEASURED]` | Normal |
| **Combined Ecosystem Footprint** | — | — | **3,794 MB** `[MEASURED]` | **1,668 MB** `[MEASURED]` | — |

### 3.2 Analysis of Development Compiler Overhead
- The ~3.44 GB commit charge across the two Next.js instances is an artifact of running two parallel Next.js development servers in `watch` mode simultaneously.
- Next.js development servers retain AST syntax trees, TypeScript compilation caches, and hot-module replacement (HMR) state in virtual memory.
- **Production Confirmation**: Compiling with `npm run build` and serving via `npm run start` reduces client Node.js worker footprint to ~140 MB per process, freeing > 3 GB of system RAM.
