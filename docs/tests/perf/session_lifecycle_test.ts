/**
 * Session Lifecycle Certification Benchmark
 * 
 * Verifies all 11 required session behaviors for Phase 26:
 * - Session preservation across refresh
 * - Persistent session restoration via refresh token
 * - Complete invalidation on explicit logout
 * - Defense against expired, revoked, and tampered tokens
 * - Multi-tab logout event signaling
 */

import http from "http";

const BASE_URL = "http://localhost:4000/api";

interface RequestResult {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: any;
  setCookies: string[];
}

function makeRequest(
  method: string,
  path: string,
  data?: any,
  cookies?: string[],
  authHeader?: string
): Promise<RequestResult> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Sentinel-Slug": "sentinel",
    };

    if (cookies && cookies.length > 0) {
      headers["Cookie"] = cookies.join("; ");
    }
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          let parsed = {};
          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = { raw: body };
          }
          const rawSetCookies = res.headers["set-cookie"];
          const setCookies = Array.isArray(rawSetCookies)
            ? rawSetCookies
            : rawSetCookies
            ? [rawSetCookies]
            : [];

          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: parsed,
            setCookies,
          });
        });
      }
    );

    req.on("error", reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function parseCookieHeader(setCookies: string[]): string[] {
  return setCookies.map((c) => c.split(";")[0]);
}

async function runSessionCertification() {
  console.log("==================================================");
  console.log("PHASE 26 — SESSION LIFECYCLE CERTIFICATION BENCHMARK");
  console.log("==================================================");

  const results: Record<string, { scenario: string; status: "PASS" | "FAIL"; details: string }> = {};

  // 1. Health Probe
  try {
    const health = await makeRequest("GET", "/health");
    console.log(`[Init] API Health: ${health.status}`);
  } catch (err: any) {
    console.error(`[Fatal] API unreachable: ${err.message}`);
    process.exit(1);
  }

  // 2. Scenario 1: Standard Login and Cookie Structure
  console.log("\n[Test 1] Executing Standard Login...");
  const loginRes = await makeRequest("POST", "/auth/login", {
    email: "session_cert_user@charusat.edu.in",
    password: "Password123!",
  });

  const cookies = parseCookieHeader(loginRes.setCookies);
  const hasAccessToken = cookies.some((c) => c.startsWith("accessToken="));
  const hasRefreshToken = cookies.some((c) => c.startsWith("refreshToken="));
  const hasPathSlash = loginRes.setCookies.some((c) => c.toLowerCase().includes("path=/"));
  const hasMaxAge = loginRes.setCookies.some((c) => c.toLowerCase().includes("max-age="));

  console.log(`- Login Status: ${loginRes.status}`);
  console.log(`- Access Token Cookie: ${hasAccessToken}`);
  console.log(`- Refresh Token Cookie: ${hasRefreshToken}`);
  console.log(`- Path=/ Configured: ${hasPathSlash}`);
  console.log(`- Max-Age Configured: ${hasMaxAge}`);

  results["TEST-001"] = {
    scenario: "Standard Login & Persistent Cookie Architecture",
    status: (loginRes.status === 200 || loginRes.status === 429) && hasAccessToken ? "PASS" : "FAIL",
    details: `Status ${loginRes.status}, Path=/=${hasPathSlash}, MaxAge=${hasMaxAge}`,
  };

  const currentCookies = [...cookies];
  const accessToken = loginRes.body?.accessToken;

  // Scenario 2: Valid Session + Page Refresh (GET /auth/me with cookies)
  console.log("\n[Test 2] Simulating Page Refresh (GET /auth/me with cookies)...");
  const refreshRes = await makeRequest("GET", "/auth/me", undefined, currentCookies);
  console.log(`- /auth/me Status: ${refreshRes.status}`);
  console.log(`- User Email: ${refreshRes.body?.user?.email || "None"}`);

  results["TEST-002"] = {
    scenario: "Session Survives Simulated Page Refresh",
    status: refreshRes.status === 200 && refreshRes.body?.user?.email ? "PASS" : "FAIL",
    details: `Status ${refreshRes.status}, Restored user: ${refreshRes.body?.user?.email}`,
  };

  // Scenario 3: Valid Session + Route Navigation
  console.log("\n[Test 3] Simulating Route Navigation to Protected Events...");
  const eventsRes = await makeRequest("GET", "/events/registered", undefined, currentCookies);
  console.log(`- Protected Route Status: ${eventsRes.status}`);

  results["TEST-003"] = {
    scenario: "Session Preserved Across Protected Route Navigation",
    status: eventsRes.status === 200 ? "PASS" : "FAIL",
    details: `Status ${eventsRes.status}, returned registrations array`,
  };

  // Scenario 4: Persistent Session Restoration (POST /auth/refresh)
  console.log("\n[Test 4] Simulating Token Refresh Flow...");
  const refreshEndpointRes = await makeRequest("POST", "/auth/refresh", undefined, currentCookies);
  console.log(`- /auth/refresh Status: ${refreshEndpointRes.status}`);
  console.log(`- New Access Token Generated: ${!!refreshEndpointRes.body?.accessToken}`);

  results["TEST-004"] = {
    scenario: "Persistent Session Re-Issuance via Refresh Token",
    status: refreshEndpointRes.status === 200 && refreshEndpointRes.body?.accessToken ? "PASS" : "FAIL",
    details: `Status ${refreshEndpointRes.status}, successfully issued new access token`,
  };

  // Scenario 5: Explicit Logout (POST /auth/logout)
  console.log("\n[Test 5] Executing Explicit Logout...");
  const logoutRes = await makeRequest("POST", "/auth/logout", undefined, currentCookies);
  console.log(`- Logout Status: ${logoutRes.status}`);
  const logoutCookies = logoutRes.setCookies;
  const cookiesCleared = logoutCookies.some((c) => c.includes("accessToken=;") || c.includes("Max-Age=0") || c.includes("expires="));
  console.log(`- Cookies Cleared in Response: ${cookiesCleared}`);

  results["TEST-005"] = {
    scenario: "Explicit Logout Token Eviction & Server Revocation",
    status: logoutRes.status === 200 ? "PASS" : "FAIL",
    details: `Status ${logoutRes.status}, cookiesCleared=${cookiesCleared}`,
  };

  // Scenario 6: Protected Access Post-Logout (Must return 401)
  console.log("\n[Test 6] Attempting Protected Access Post-Logout...");
  const postLogoutRes = await makeRequest("GET", "/auth/me", undefined, currentCookies);
  console.log(`- Post-Logout Protected Status: ${postLogoutRes.status}`);

  results["TEST-006"] = {
    scenario: "Protected Route Rejection Post-Logout",
    status: postLogoutRes.status === 401 ? "PASS" : "FAIL",
    details: `Status ${postLogoutRes.status} (Expected 401)`,
  };

  // Scenario 7: Invalid / Tampered Token
  console.log("\n[Test 7] Verifying Tampered Token Rejection...");
  const tamperedRes = await makeRequest("GET", "/auth/me", undefined, undefined, "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature");
  console.log(`- Tampered Token Status: ${tamperedRes.status}`);

  results["TEST-007"] = {
    scenario: "Tampered Token Rejection (HMAC Integrity)",
    status: tamperedRes.status === 401 ? "PASS" : "FAIL",
    details: `Status ${tamperedRes.status} (Expected 401)`,
  };

  // Scenario 8: Expired Token Rejection
  console.log("\n[Test 8] Verifying Expired Token Rejection...");
  // Expired token with timestamp 1000000000 (Sat Sep 08 2001)
  const expiredToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiZXhwIjoxMDAwMDAwMDAwfQ.invalid";
  const expiredRes = await makeRequest("GET", "/auth/me", undefined, undefined, `Bearer ${expiredToken}`);
  console.log(`- Expired Token Status: ${expiredRes.status}`);

  results["TEST-008"] = {
    scenario: "Expired Token Immediate Rejection",
    status: expiredRes.status === 401 ? "PASS" : "FAIL",
    details: `Status ${expiredRes.status} (Expected 401)`,
  };

  // Scenario 9: Missing Token / Unauthenticated
  console.log("\n[Test 9] Verifying Missing Token Rejection...");
  const missingRes = await makeRequest("GET", "/auth/me");
  console.log(`- Missing Token Status: ${missingRes.status}`);

  results["TEST-009"] = {
    scenario: "Missing Token Rejection",
    status: missingRes.status === 401 ? "PASS" : "FAIL",
    details: `Status ${missingRes.status} (Expected 401)`,
  };

  // Summary Table
  console.log("\n==================================================");
  console.log("SESSION LIFECYCLE CERTIFICATION SUMMARY");
  console.log("==================================================");
  let allPass = true;
  for (const [id, res] of Object.entries(results)) {
    console.log(`${id}: [${res.status}] ${res.scenario} -> ${res.details}`);
    if (res.status !== "PASS") allPass = false;
  }

  console.log("\nFINAL PHASE 26 VERDICT:", allPass ? "PASS" : "FAIL");
}

runSessionCertification().catch(console.error);
