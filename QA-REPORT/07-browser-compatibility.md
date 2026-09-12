# Chapter 07 — Cross-Browser Compatibility & Engine Evaluation

## 1. Engine & Feature Support Matrix

The Sentinal frontends employ modern CSS and JavaScript APIs that rely on specific browser engine capabilities. The baseline target covers all evergreen browser engines released in 2023 or later.

| Feature / Standard | Chromium (Blink 120+) | Firefox (Gecko 120+) | Safari (WebKit 17+) | Support Status | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Tailwind CSS v4 (`@theme`)** | Supported | Supported | Supported | Full | Requires modern CSS cascade layers |
| **Backdrop Filter (`backdrop-blur`)** | Supported | Supported | Supported | Full | `-webkit-backdrop-filter` fallback present |
| **Canvas 2D Particle Rendering** | Supported | Supported | Supported | Full | `requestAnimationFrame` hardware accelerated |
| **Variable Fonts (Space Grotesk)** | Supported | Supported | Supported | Full | Clean glyph rendering across all engines |
| **Socket.io WebSocket Transport** | Supported | Supported | Supported | Full | Native RFC 6455 WebSockets with long-polling fallback |
| **Cookie `SameSite=Lax` Defaults** | Supported | Supported | Supported | Full | Standard cookie scoping across localhost |

---

## 2. Cross-Origin Cookie & Session Mechanics

### 2.1 Localhost Multi-Port Environment vs. Production Domain
- **Localhost Testing Environment**:
  - Main Portal: `http://localhost:3000`
  - CTF Platform: `http://localhost:3001`
  - Express API: `http://localhost:4000`
  - In browsers, cookies set by `http://localhost:4000` with `Domain=localhost` or default origin scoping share the same cookie jar across ports 3000 and 3001 under RFC 6265, because port numbers are ignored in standard HTTP cookie matching.
  - However, `SameSite=Lax` restrictions apply when navigating cross-origin if origins differ.
- **Production Multi-Subdomain Architecture**:
  - Main Portal: `https://sentinel.chakravyuhclub.com`
  - CTF Platform: `https://ctf.chakravyuhclub.com`
  - Backend API: `https://api.chakravyuhclub.com`
  - **Mandate**: Production cookies must explicitly declare `Domain=.chakravyuhclub.com; Secure; SameSite=Lax; HttpOnly` to enable seamless shared SSO authentication across subdomains.

---

## 3. Engine-Specific Edge Cases Identified

### 3.1 Chromium Cookie Shadowing Behavior (`SEC-001`)
- **Observed Behavior**:
  - In Google Chrome and Microsoft Edge, if a cookie named `accessToken` has previously been set with the `HttpOnly` flag by an HTTP response header, any subsequent JavaScript execution attempting `document.cookie = "accessToken=..."` is silently ignored by the browser security sandbox.
  - This prevents client-side recovery scripts from overriding or clearing stale tokens if they are stuck in a mismatch state.

### 3.2 Safari WebKit Intelligent Tracking Prevention (ITP)
- **Evaluation**:
  - Apple Safari restricts partitioned cookies if the API is accessed across completely distinct domains (e.g. `sentinel.vercel.app` calling `api-sentinel.render.com`).
  - To prevent Safari users from being logged out unpredictably during CTF competitions, both frontends and backend APIs must be hosted under the same apex parent domain (e.g. `*.chakravyuhclub.com`) with First-Party cookie assignment.

### 3.3 Firefox Monospace Font Metric Variance
- **Evaluation**:
  - In Mozilla Firefox, `JetBrains Mono` font glyph metrics render with slightly wider letter spacing (~0.4px per character) compared to Chromium on Windows DirectWrite.
  - Table column widths in the CTF scoreboard accommodate this variation cleanly using `min-w-[80px]` constraints rather than fixed pixel widths.
