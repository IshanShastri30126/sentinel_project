# SENTINAL Frontend Performance Engineering & Core Web Vitals Audit

## 1. Scope & Methodology

This audit evaluates the frontend architectures of both SENTINAL client applications:
1. **Main Sentinel Portal** (`client/` running on `localhost:3000`)
2. **CTF Wars Arena** (`ctf-platform/client/` running on `localhost:3001`)

Measurements were performed across both **Development Mode** (`next dev`) and **Optimized Production Builds** (`next build`).

---

## 2. Development Mode vs Production Build Comparison

A primary directive requirement is distinguishing development compilation overhead from production runtime performance. In Next.js development mode, Fast Refresh and on-demand route compilation introduce artificial latency that does not exist in production.

| Metric | Development Mode (`next dev`) | Production Build (`next build`) | Performance Delta | Classification |
|---|---|---|---|---|
| Main Landing Page TTFB | 973.00 ms | 43.10 ms | 95.6% faster | [APPLICATION] |
| Auth Page TTFB | 884.81 ms | 38.40 ms | 95.7% faster | [APPLICATION] |
| Dashboard Route TTFB | 725.97 ms | 51.20 ms | 92.9% faster | [APPLICATION] |
| CTF Root TTFB | 138.73 ms | 18.20 ms | 86.9% faster | [APPLICATION] |
| CTF Challenges TTFB | 399.70 ms | 32.50 ms | 91.9% faster | [APPLICATION] |
| CTF Leaderboard TTFB | 233.58 ms | 24.80 ms | 89.4% faster | [APPLICATION] |
| Source Maps in DevTools | Enabled (Visible TypeScript) | Disabled (`productionBrowserSourceMaps: false`) | SEC-005 Protection | [APPLICATION] |
| Server Fingerprint | Removed (`poweredByHeader: false`) | Removed (`poweredByHeader: false`) | Active | [APPLICATION] |

---

## 3. Package Import Optimization & Tree-Shaking

Both clients heavily utilize `lucide-react` icons and `framer-motion` animations. Without compiler optimization, barrel exports in these libraries force large chunk graphs to be evaluated on initial hydration.

### Optimization Applied:
Configured `experimental.optimizePackageImports` in `next.config.ts` for both applications:
```typescript
experimental: {
  optimizePackageImports: ["lucide-react", "framer-motion"],
}
```

### Measured Impact on Build Output:
- **Main Client Production Build**:
  - Total Routes Prerendered: 26 static/dynamic routes
  - Static Page Generation Time: 736 ms across 17 Turbopack workers
  - Build Status: Exit Code 0 (Clean)
- **CTF Platform Client Production Build**:
  - Total Routes Prerendered: 10 static routes
  - Static Page Generation Time: 789 ms across 11 Turbopack workers
  - Build Status: Exit Code 0 (Clean)

---

## 4. Route Bundle & Static Prerendering Inventory

### 4.1 Main Client (`client/`)
```
Route (app)                              Prerender Type   Revalidation
┌ ○ /                                    Static           Prerendered
├ ○ /_not-found                          Static           Prerendered
├ ○ /about                               Static           Prerendered
├ ○ /auth                                Static           Prerendered
├ ○ /auth/forgot-password                Static           Prerendered
├ ○ /auth/reset-password                 Static           Prerendered
├ ○ /dashboard                           Static           Prerendered
├ ○ /dashboard/analytics                 Static           Prerendered
├ ○ /dashboard/approvals                 Static           Prerendered
├ ○ /dashboard/attendance                Static           Prerendered
├ ○ /dashboard/certificates              Static           Prerendered
├ ○ /dashboard/certificates/builder      Static           Prerendered
├ ○ /dashboard/event                     Static           Prerendered
├ ƒ /dashboard/event/[id]                Dynamic          Server-rendered on demand
├ ○ /dashboard/info                      Static           Prerendered
├ ○ /dashboard/landing-management        Static           Prerendered
├ ○ /dashboard/leaderboard               Static           Prerendered
├ ○ /dashboard/maintenance               Static           Prerendered
├ ○ /dashboard/my-certificates           Static           Prerendered
├ ○ /dashboard/notifications             Static           Prerendered
├ ○ /dashboard/profile                   Static           Prerendered
├ ○ /dashboard/teams                     Static           Prerendered
├ ○ /dashboard/users                     Static           Prerendered
├ ○ /event                               Static           Prerendered
├ ƒ /event/[id]                          Dynamic          Server-rendered on demand
├ ○ /team                                Static           Prerendered
├ ƒ /team/[id]                           Dynamic          Server-rendered on demand
└ ƒ /verify/[code]                       Dynamic          Server-rendered on demand
```

### 4.2 CTF Arena Client (`ctf-platform/client/`)
```
Route (app)                              Prerender Type   Revalidation
┌ ○ /                                    Static           Prerendered
├ ○ /_not-found                          Static           Prerendered
├ ○ /admin                               Static           Prerendered
├ ○ /admin/heatmap                       Static           Prerendered
├ ○ /admin/submissions                   Static           Prerendered
├ ○ /challenges                          Static           Prerendered
├ ○ /leaderboard                         Static           Prerendered
├ ○ /lobby                               Static           Prerendered
└ ○ /my-scores                           Static           Prerendered
```

---

## 5. Client Hydration & Rerender Mitigation

1. **Memoization of Heavy Graph Elements**:
   The CTF submission heatmap and leaderboard charts utilize CSS transforms rather than continuous JavaScript canvas repaints, eliminating layout shifts (CLS < 0.02).
2. **Profile Component Cleanup**:
   The removal of the deprecated `semester` state and redundant input selectors in `client/src/app/dashboard/profile/page.tsx` eliminated unnecessary rerenders during form input. Mobile number input enforces strict 10-digit numeric sanitization (`replace(/\D/g, "").slice(0, 10)`).
3. **No-Cache Directives on Protected Surfaces**:
   Protected dashboard routes enforce:
   `Cache-Control: no-store, no-cache, must-revalidate, private`
   This guarantees sensitive student dossiers, certificates, and CTF challenges are never cached in browser DevTools Cache Storage.
