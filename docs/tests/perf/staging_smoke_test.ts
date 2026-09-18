/**
 * Phase 31 — Staging Smoke Verification Test
 * 
 * Exercises all production-like services in the local staging topology:
 * 1. Main Sentinel Core API (:4000)
 * 2. CTF Wars API (:5001)
 * 3. Health check endpoints
 * 4. WebSocket handshake readiness
 * 5. Public event & competition discovery
 */

import http from "http";

interface ProbeResult {
  service: string;
  url: string;
  status: number;
  passed: boolean;
  details: string;
}

function probe(service: string, path: string, port: number, headers: Record<string, string> = {}): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const url = `http://localhost:${port}${path}`;
    const req = http.request(
      url,
      {
        method: "GET",
        headers: {
          "X-Sentinel-Slug": "sentinel",
          ...headers,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => { body += c; });
        res.on("end", () => {
          const passed = res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 400;
          resolve({
            service,
            url: `${path} (: ${port})`,
            status: res.statusCode || 0,
            passed,
            details: body.slice(0, 100),
          });
        });
      }
    );

    req.on("error", (err) => {
      resolve({
        service,
        url: `${path} (: ${port})`,
        status: 500,
        passed: false,
        details: `Connection Error: ${err.message}`,
      });
    });

    req.end();
  });
}

async function runStagingSmokeTest() {
  console.log("=============================================================");
  console.log("PHASE 31 — CHARUSAT STAGING TOPOLOGY SMOKE BENCHMARK");
  console.log("=============================================================");

  const probes = [
    probe("Sentinel Core", "/api/health", 4000),
    probe("Sentinel Core", "/api/events", 4000),
    probe("Sentinel Core", "/api/auth/me", 4000), // Expected 401 unauthenticated
    probe("CTF Wars", "/api/health", 5001),
    probe("CTF Wars", "/api/competitions/active", 5001), // Expected 401 unauthenticated
    probe("CTF Wars WS", "/socket.io/?EIO=4&transport=polling", 5001),
  ];

  const results = await Promise.all(probes);

  console.log("\nService | Target Endpoint | HTTP Status | Result | Output Snippet");
  console.log("-------------------------------------------------------------------------");

  let passedCount = 0;

  for (const r of results) {
    // For /api/auth/me and /api/competitions/active, 401 is expected and validates auth guard
    const isExpected = (r.url.includes("/api/auth/me") || r.url.includes("/api/competitions/active"))
      ? r.status === 401
      : r.passed;
    if (isExpected) passedCount++;
    const mark = isExpected ? "PASS" : "FAIL";
    console.log(`${r.service.padEnd(16)} | ${r.url.padEnd(30)} | HTTP ${r.status} | ${mark} | ${r.details.replace(/\s+/g, " ")}`);
  }

  console.log("=========================================================================");
  console.log(`TOTAL SMOKE PROBES: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);
  console.log("FINAL PHASE 31 STAGING SMOKE VERDICT:", passedCount === results.length ? "PASS" : "FAIL");
}

runStagingSmokeTest().catch(console.error);
