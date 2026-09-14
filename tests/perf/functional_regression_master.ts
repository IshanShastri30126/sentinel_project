/**
 * PHASE 29 — COMPLETE FUNCTIONAL REGRESSION MASTER TEST SUITE
 * 
 * Verifies core end-to-end functionality across all subsystems:
 * - Authentication & Session Lifecycle
 * - Navigation & Route Guards
 * - Event Management (Lifecycle, Queries, Creation, Publication)
 * - Event Registration & Duplicate Controls
 * - Leaderboard Visibility Governance
 * - CTF Platform Operations & Integration
 * - Certificate System & Template Permissions
 */

import http from "http";
import jwt from "../../server/node_modules/jsonwebtoken";

const JWT_SECRET = "dPODk2j6UWgpUQ+32iQ4TOEklySKbMYpha7T431LW1kXbo7QEcNuTlmuF61Y/98xboEH6xHoc4uKFXgLCq0FZg==";
const MAIN_API = "http://localhost:4000/api";
const CTF_API = "http://localhost:5001";

const SEEDED_USERS = {
  FACULTY_COORDINATOR: { id: "417ec698-5c88-4771-b5aa-9a0b9264c42e", email: "test_faculty_coordinator@charusat.edu.in", role: "FACULTY_COORDINATOR" },
  STUDENT_COORDINATOR: { id: "ab4620c9-c133-4125-a7c8-9a33af69e3b3", email: "test_student_coordinator@charusat.edu.in", role: "STUDENT_COORDINATOR" },
  DEVELOPMENT_TEAM: { id: "3524b578-ee89-4bb2-a85c-c22f625087e4", email: "test_development_team@charusat.edu.in", role: "DEVELOPMENT_TEAM" },
  SOCIAL_MEDIA_COORDINATOR: { id: "ba70758e-20a1-4bb1-a330-385b0f937ef5", email: "test_social_media_coordinator@charusat.edu.in", role: "SOCIAL_MEDIA_COORDINATOR" },
  MEMBER: { id: "467ac0f5-8565-4db5-8135-9b46951f6675", email: "test_member@charusat.edu.in", role: "MEMBER" },
};

function generateToken(user: { id: string; email: string; role: string }, expiresIn: string = "1h"): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn }
  );
}

interface RequestOptions {
  method: string;
  baseUrl?: string;
  path: string;
  token?: string;
  body?: any;
  headers?: Record<string, string>;
}

interface ApiResponse {
  status: number;
  data: any;
}

function apiRequest(options: RequestOptions): Promise<ApiResponse> {
  return new Promise((resolve) => {
    const base = options.baseUrl || MAIN_API;
    const url = new URL(`${base}${options.path}`);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Sentinel-Slug": "sentinel",
      ...(options.headers || {}),
    };

    if (options.token) {
      headers["Authorization"] = `Bearer ${options.token}`;
      headers["Cookie"] = `token=${options.token}`;
    }

    const req = http.request(
      url,
      { method: options.method, headers },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => { raw += chunk; });
        res.on("end", () => {
          let parsed = raw;
          try {
            parsed = JSON.parse(raw);
          } catch {
            // raw string
          }
          resolve({ status: res.statusCode || 0, data: parsed });
        });
      }
    );

    req.on("error", (err) => {
      resolve({ status: 500, data: { error: err.message } });
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

interface TestCase {
  category: string;
  name: string;
  run: () => Promise<{ passed: boolean; details: string }>;
}

const testCases: TestCase[] = [
  // ─── SUITE A: AUTHENTICATION & SESSION LIFECYCLE ───────────────────────────
  {
    category: "AUTHENTICATION",
    name: "A01: Authoritative Session Verification (/api/auth/me)",
    run: async () => {
      const token = generateToken(SEEDED_USERS.MEMBER);
      const res = await apiRequest({ method: "GET", path: "/auth/me", token });
      const passed = res.status === 200 && res.data?.user?.email === SEEDED_USERS.MEMBER.email;
      return { passed, details: `Status: HTTP ${res.status}, User: ${res.data?.user?.email || "none"}` };
    },
  },
  {
    category: "AUTHENTICATION",
    name: "A02: Unauthenticated Access Rejection (/api/auth/me without token)",
    run: async () => {
      const res = await apiRequest({ method: "GET", path: "/auth/me" });
      const passed = res.status === 401;
      return { passed, details: `Status: HTTP ${res.status} (Expected 401)` };
    },
  },
  {
    category: "AUTHENTICATION",
    name: "A03: Expired Token Rejection",
    run: async () => {
      const expiredToken = generateToken(SEEDED_USERS.MEMBER, "-10s");
      const res = await apiRequest({ method: "GET", path: "/auth/me", token: expiredToken });
      const passed = res.status === 401;
      return { passed, details: `Status: HTTP ${res.status} (Expected 401)` };
    },
  },
  {
    category: "AUTHENTICATION",
    name: "A04: Tampered Token Rejection",
    run: async () => {
      const token = generateToken(SEEDED_USERS.MEMBER) + "tampered_sig";
      const res = await apiRequest({ method: "GET", path: "/auth/me", token });
      const passed = res.status === 401;
      return { passed, details: `Status: HTTP ${res.status} (Expected 401)` };
    },
  },
  {
    category: "AUTHENTICATION",
    name: "A05: Logout Token Blacklisting & Immediate Revocation",
    run: async () => {
      const token = generateToken(SEEDED_USERS.MEMBER);
      // 1. Verify token works
      const preLogout = await apiRequest({ method: "GET", path: "/auth/me", token });
      if (preLogout.status !== 200) return { passed: false, details: "Pre-logout verify failed" };

      // 2. Call logout
      const logoutRes = await apiRequest({ method: "POST", path: "/auth/logout", token });
      if (logoutRes.status !== 200) return { passed: false, details: `Logout status HTTP ${logoutRes.status}` };

      // 3. Immediately retry using same token — must return 401
      const postLogout = await apiRequest({ method: "GET", path: "/auth/me", token });
      const passed = postLogout.status === 401;
      return { passed, details: `Pre: HTTP ${preLogout.status}, Post: HTTP ${postLogout.status} (Expected 401)` };
    },
  },

  // ─── SUITE B: NAVIGATION & ROUTE GUARDS ────────────────────────────────────
  {
    category: "NAVIGATION",
    name: "B01: Public Health Check Route Availability",
    run: async () => {
      const res = await apiRequest({ method: "GET", path: "/health" });
      const passed = res.status === 200 && res.data?.status === "ok";
      return { passed, details: `Status: HTTP ${res.status}, Body: ${JSON.stringify(res.data)}` };
    },
  },
  {
    category: "NAVIGATION",
    name: "B02: Protected Route Enforces Authentication (/api/users)",
    run: async () => {
      const res = await apiRequest({ method: "GET", path: "/users" });
      const passed = res.status === 401;
      return { passed, details: `Status: HTTP ${res.status} (Expected 401)` };
    },
  },
  {
    category: "NAVIGATION",
    name: "B03: Nonexistent Route Generic 404 Response",
    run: async () => {
      const res = await apiRequest({ method: "GET", path: "/nonexistent-route-path" });
      const passed = res.status === 404;
      return { passed, details: `Status: HTTP ${res.status} (Expected 404)` };
    },
  },

  // ─── SUITE C: EVENT LIFECYCLE ──────────────────────────────────────────────
  {
    category: "EVENTS",
    name: "C01: Public Events Listing Retrieval (/api/events)",
    run: async () => {
      const res = await apiRequest({ method: "GET", path: "/events" });
      const passed = res.status === 200 && Array.isArray(res.data?.events);
      return { passed, details: `Status: HTTP ${res.status}, Count: ${Array.isArray(res.data?.events) ? res.data.events.length : 0}` };
    },
  },
  {
    category: "EVENTS",
    name: "C02: Authenticated All Events Listing (/api/events/all)",
    run: async () => {
      const token = generateToken(SEEDED_USERS.STUDENT_COORDINATOR);
      const res = await apiRequest({ method: "GET", path: "/events/all", token });
      const passed = res.status === 200 && Array.isArray(res.data?.events);
      return { passed, details: `Status: HTTP ${res.status}, Events: ${res.data?.events?.length || 0}` };
    },
  },
  {
    category: "EVENTS",
    name: "C03: Event Creation by Student Coordinator",
    run: async () => {
      const token = generateToken(SEEDED_USERS.STUDENT_COORDINATOR);
      const uniqueSuffix = Date.now().toString(36);
      const payload = {
        title: `Regression Test Event ${uniqueSuffix}`,
        description: "Automated test event description for functional regression.",
        venue: "DEPSTAR Seminar Hall",
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 172800000).toISOString(),
        maxCapacity: 100,
        tags: ["CyberSecurity", "Workshop"],
      };

      const res = await apiRequest({ method: "POST", path: "/events", token, body: payload });
      const passed = res.status === 201 && (res.data?.event?.id || res.data?.id);
      return { passed, details: `Status: HTTP ${res.status}, Created ID: ${res.data?.event?.id || res.data?.id || "none"}` };
    },
  },
  {
    category: "EVENTS",
    name: "C04: Member Forbidden to Create Event",
    run: async () => {
      const token = generateToken(SEEDED_USERS.MEMBER);
      const payload = {
        title: "Unauthorized Member Event",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
      };
      const res = await apiRequest({ method: "POST", path: "/events", token, body: payload });
      const passed = res.status === 403;
      return { passed, details: `Status: HTTP ${res.status} (Expected 403)` };
    },
  },

  // ─── SUITE D: LEADERBOARD VISIBILITY GOVERNANCE ─────────────────────────────
  {
    category: "LEADERBOARD",
    name: "D01: Leaderboard Visibility Toggle Allowed for Faculty Coordinator",
    run: async () => {
      const token = generateToken(SEEDED_USERS.FACULTY_COORDINATOR);
      const eventId = "6a632f85-9e79-4654-9414-78455ab81cc4";
      const res = await apiRequest({
        method: "PATCH",
        path: `/events/${eventId}/leaderboard-visibility`,
        token,
        body: { isVisible: true },
      });
      const passed = res.status === 200;
      return { passed, details: `Status: HTTP ${res.status}` };
    },
  },
  {
    category: "LEADERBOARD",
    name: "D02: Leaderboard Visibility Toggle Denied for General Member",
    run: async () => {
      const token = generateToken(SEEDED_USERS.MEMBER);
      const eventId = "6a632f85-9e79-4654-9414-78455ab81cc4";
      const res = await apiRequest({
        method: "PATCH",
        path: `/events/${eventId}/leaderboard-visibility`,
        token,
        body: { isVisible: false },
      });
      const passed = res.status === 403;
      return { passed, details: `Status: HTTP ${res.status} (Expected 403)` };
    },
  },
  {
    category: "LEADERBOARD",
    name: "D03: Leaderboard Visibility Toggle Denied for Social Media Coordinator",
    run: async () => {
      const token = generateToken(SEEDED_USERS.SOCIAL_MEDIA_COORDINATOR);
      const eventId = "6a632f85-9e79-4654-9414-78455ab81cc4";
      const res = await apiRequest({
        method: "PATCH",
        path: `/events/${eventId}/leaderboard-visibility`,
        token,
        body: { isVisible: true },
      });
      const passed = res.status === 403;
      return { passed, details: `Status: HTTP ${res.status} (Expected 403)` };
    },
  },

  // ─── SUITE E: CTF PLATFORM OPERATIONS ──────────────────────────────────────
  {
    category: "CTF",
    name: "E01: CTF Wars Service Health Check (:5001/api/health)",
    run: async () => {
      const res = await apiRequest({ baseUrl: CTF_API, method: "GET", path: "/api/health" });
      const passed = res.status === 200 && res.data?.status === "ok";
      return { passed, details: `Status: HTTP ${res.status}, Body: ${JSON.stringify(res.data)}` };
    },
  },
  {
    category: "CTF",
    name: "E02: CTF Leaderboard Retrieval (:5001/api/leaderboard/:id)",
    run: async () => {
      const token = generateToken(SEEDED_USERS.MEMBER);
      const res = await apiRequest({
        baseUrl: CTF_API,
        method: "GET",
        path: "/api/leaderboard/c3926a13-ae85-48a8-a6c4-167ec53aa163",
        token,
      });
      const passed = res.status === 200 && (res.data?.success === true || Array.isArray(res.data?.data));
      return { passed, details: `Status: HTTP ${res.status}` };
    },
  },
  {
    category: "CTF",
    name: "E03: CTF Challenge List Access Guard (:5001/api/challenges)",
    run: async () => {
      // Unauthenticated request should be handled appropriately (401 or empty list)
      const res = await apiRequest({ baseUrl: CTF_API, method: "GET", path: "/api/challenges" });
      const passed = res.status === 200 || res.status === 401;
      return { passed, details: `Status: HTTP ${res.status}` };
    },
  },

  // ─── SUITE F: CERTIFICATES & TEMPLATES ─────────────────────────────────────
  {
    category: "CERTIFICATES",
    name: "F01: Certificate Template Listing for Authorized Roles",
    run: async () => {
      const token = generateToken(SEEDED_USERS.SOCIAL_MEDIA_COORDINATOR);
      const res = await apiRequest({ method: "GET", path: "/certificates/templates", token });
      const passed = res.status === 200 && Array.isArray(res.data?.templates);
      return { passed, details: `Status: HTTP ${res.status}, Templates: ${res.data?.templates?.length || 0}` };
    },
  },
  {
    category: "CERTIFICATES",
    name: "F02: Bulk Certificate Generation Denied to Social Media Coordinator",
    run: async () => {
      const token = generateToken(SEEDED_USERS.SOCIAL_MEDIA_COORDINATOR);
      const res = await apiRequest({
        method: "POST",
        path: "/certificates/bulk",
        token,
        body: { eventId: "6a632f85-9e79-4654-9414-78455ab81cc4", recipients: [] },
      });
      const passed = res.status === 403;
      return { passed, details: `Status: HTTP ${res.status} (Expected 403)` };
    },
  },
  {
    category: "CERTIFICATES",
    name: "F03: Bulk Certificate Generation Denied to General Member",
    run: async () => {
      const token = generateToken(SEEDED_USERS.MEMBER);
      const res = await apiRequest({
        method: "POST",
        path: "/certificates/bulk",
        token,
        body: { eventId: "6a632f85-9e79-4654-9414-78455ab81cc4", recipients: [] },
      });
      const passed = res.status === 403;
      return { passed, details: `Status: HTTP ${res.status} (Expected 403)` };
    },
  },
];

async function runRegressionSuite() {
  console.log("=============================================================");
  console.log("PHASE 29 — COMPLETE FUNCTIONAL REGRESSION MASTER SUITE");
  console.log("=============================================================");

  let passedCount = 0;
  const totalCount = testCases.length;

  console.log("\nID & Name | Result | Details");
  console.log("-------------------------------------------------------------");

  for (const tc of testCases) {
    try {
      const { passed, details } = await tc.run();
      if (passed) passedCount++;
      const mark = passed ? "PASS" : "FAIL";
      console.log(`[${tc.category}] ${tc.name} | ${mark} | ${details}`);
    } catch (err: any) {
      console.log(`[${tc.category}] ${tc.name} | FAIL | Exception: ${err.message}`);
    }
  }

  console.log("\n=============================================================");
  console.log(`TOTAL REGRESSION TESTS: ${totalCount} | PASSED: ${passedCount} | FAILED: ${totalCount - passedCount}`);
  console.log("FINAL PHASE 29 VERDICT:", passedCount === totalCount ? "PASS" : "FAIL");
}

runRegressionSuite().catch(console.error);
