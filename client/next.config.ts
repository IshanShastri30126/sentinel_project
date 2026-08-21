import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking — deny embedding in iframes
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Disable DNS prefetch to reduce data leakage
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // Strip Referrer on cross-origin requests — hides internal routes
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for 2 years (production only — Next.js ignores on localhost)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Remove server fingerprint header
  { key: "X-Powered-By", value: "" },
  // Restrict browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()",
  },
  // Content Security Policy — tighten to allowed origins only
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Next.js inline chunks + Google OAuth
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
      // Styles: self + Google Fonts + inline styles (Next.js injects these)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts from Google
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + data URIs + Cloudinary CDN
      "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com",
      // Connect: self + backend API + WebSocket + Google OAuth endpoints
      `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || ""} ${process.env.NEXT_PUBLIC_WS_URL || ""} wss: https://accounts.google.com`,
      // Frames: Google OAuth popup only
      "frame-src https://accounts.google.com",
      // Workers: self only
      "worker-src 'self' blob:",
      // Media: self only
      "media-src 'self'",
      // Object: block all plugins
      "object-src 'none'",
      // Base URI: self only
      "base-uri 'self'",
      // Form submissions: self only
      "form-action 'self'",
    ].join("; "),
  },
  // Allow Google OAuth popup
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  // Block cross-origin reads of API responses
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
];

const nextConfig: NextConfig = {
  // Strip X-Powered-By header at Next.js level
  poweredByHeader: false,

  // ── Source Map Security ───────────────────────────────────────────────────
  // Disable browser source maps in production builds.
  // Without this, ALL original TypeScript source code is visible in
  // DevTools → Sources tab — even with minification.
  // NOTE: This only applies to `npm run build`. Dev mode still shows source maps.
  productionBrowserSourceMaps: false,

  async headers() {
    return [
      // ── Security headers on all routes ──────────────────────────────────
      {
        source: "/:path*",
        headers: securityHeaders.filter((h) => h.value !== ""),
      },
      // ── No-cache on all dashboard pages ──────────────────────────────────
      // Prevents sensitive page data from being stored in DevTools
      // Application → Cache Storage or being re-served from disk cache.
      {
        source: "/dashboard/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      // ── No-cache on auth pages ─────────────────────────────────────────
      {
        source: "/login",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
};

export default nextConfig;
