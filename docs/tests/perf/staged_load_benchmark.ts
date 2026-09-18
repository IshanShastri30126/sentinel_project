import http from "http";
import https from "https";
import { performance, monitorEventLoopDelay } from "perf_hooks";
import jwt from "../../server/node_modules/jsonwebtoken";
import { PrismaClient } from "../../server/node_modules/@prisma/client";
import { Redis } from "../../server/node_modules/@upstash/redis";
import fs from "fs";
import path from "path";

// Initialize Socket.io client
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { io } = require("../../ctf-platform/client/node_modules/socket.io-client");

const JWT_SECRET = "dPODk2j6UWgpUQ+32iQ4TOEklySKbMYpha7T431LW1kXbo7QEcNuTlmuF61Y/98xboEH6xHoc4uKFXgLCq0FZg==";
const MAIN_API_BASE = "http://localhost:4000";
const CTF_API_BASE = "http://localhost:5001";
const CTF_WS_URL = "http://localhost:5001/ctf";

// Tokens for Student and Faculty
const studentToken = jwt.sign(
  {
    id: "3531f8a8-5824-453e-9d8b-c0eb6381d557",
    userId: "3531f8a8-5824-453e-9d8b-c0eb6381d557",
    email: "student_3194@charusat.edu.in",
    role: "MEMBER",
    isApproved: true,
  },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const facultyToken = jwt.sign(
  {
    id: "8aa7da70-ed4a-4424-9dd6-5d05564bf81a",
    userId: "8aa7da70-ed4a-4424-9dd6-5d05564bf81a",
    email: "d25ce145@charusat.edu.in",
    role: "FACULTY_COORDINATOR",
    isApproved: true,
  },
  JWT_SECRET,
  { expiresIn: "1h" }
);

// Prisma & Redis Probes
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_L6yec7hwIYfm@ep-small-art-apfniiyb-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=15&connect_timeout=15",
    },
  },
});

const redis = new Redis({
  url: "https://big-minnow-137825.upstash.io",
  token: "gQAAAAAAAhphAAIgcDExMGJkZjA0Y2U0MzM0YzI1OTdiZTlhY2QxMjVmMTM4Ng",
});

// HTTP Agent with keepAlive for pooling simulation
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 500 });

interface StageResult {
  stageConcurrency: number;
  profileDistribution: Record<string, number>;
  durationSeconds: number;
  totalHttpRequests: number;
  concurrentHttpRequestsPeak: number;
  completedRequests: number;
  failedRequests: number;
  timeoutRequests: number;
  rps: number;
  p50: number;
  p95: number;
  p99: number;
  minLatency: number;
  maxLatency: number;
  errorRatePercent: number;
  timeoutRatePercent: number;
  cpuPercent: number;
  memoryRssMB: number;
  memoryHeapUsedMB: number;
  eventLoopDelayP50Ms: number;
  eventLoopDelayP95Ms: number;
  eventLoopDelayP99Ms: number;
  dbLatencyMs: number | null;
  redisLatencyMs: number | null;
  wsLatencyMs: number | null;
  activeWsConnections: number;
  stable: boolean;
  stabilityNotes: string;
}

// Request helper using native http with timeout
function sendHttpRequest(
  urlStr: string,
  options: { method?: string; headers?: Record<string, string>; timeout?: number } = {}
): Promise<{ statusCode: number; durationMs: number; timedOut: boolean }> {
  return new Promise((resolve) => {
    const start = performance.now();
    const url = new URL(urlStr);
    const timeout = options.timeout || 5000;

    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers: options.headers || {},
        agent: httpAgent,
        timeout,
      },
      (res) => {
        // Consume data stream to free socket
        res.on("data", () => {});
        res.on("end", () => {
          const durationMs = performance.now() - start;
          resolve({
            statusCode: res.statusCode || 0,
            durationMs,
            timedOut: false,
          });
        });
      }
    );

    let timedOut = false;
    req.on("timeout", () => {
      timedOut = true;
      req.destroy();
      resolve({
        statusCode: 0,
        durationMs: performance.now() - start,
        timedOut: true,
      });
    });

    req.on("error", () => {
      if (!timedOut) {
        resolve({
          statusCode: 0,
          durationMs: performance.now() - start,
          timedOut: false,
        });
      }
    });

    req.end();
  });
}

// User Profile Actions
type UserProfileType = "Viewer" | "Student" | "FacultyCoordinator" | "CtfCompetitor";

async function executeProfileStep(
  profile: UserProfileType,
  wsClient?: any
): Promise<{ durationMs: number; success: boolean; timedOut: boolean; statusCode: number }> {
  switch (profile) {
    case "Viewer": {
      // 40% Clubs, 40% Events, 20% Health
      const rand = Math.random();
      let url = `${MAIN_API_BASE}/api/events`;
      if (rand < 0.4) {
        url = `${MAIN_API_BASE}/api/clubs`;
      } else if (rand < 0.8) {
        url = `${MAIN_API_BASE}/api/events`;
      } else {
        url = `${MAIN_API_BASE}/api/health`;
      }
      const res = await sendHttpRequest(url);
      return {
        durationMs: res.durationMs,
        success: res.statusCode >= 200 && res.statusCode < 400,
        timedOut: res.timedOut,
        statusCode: res.statusCode,
      };
    }
    case "Student": {
      // Authenticated Student browsing events, me, or notifications
      const rand = Math.random();
      let url = `${MAIN_API_BASE}/api/events`;
      if (rand < 0.4) {
        url = `${MAIN_API_BASE}/api/events`;
      } else if (rand < 0.7) {
        url = `${MAIN_API_BASE}/api/auth/me`;
      } else {
        url = `${MAIN_API_BASE}/api/notifications`;
      }
      const res = await sendHttpRequest(url, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      return {
        durationMs: res.durationMs,
        success: res.statusCode >= 200 && res.statusCode < 400,
        timedOut: res.timedOut,
        statusCode: res.statusCode,
      };
    }
    case "FacultyCoordinator": {
      // Authenticated Faculty Coordinator
      const rand = Math.random();
      let url = `${MAIN_API_BASE}/api/events`;
      if (rand < 0.35) {
        url = `${MAIN_API_BASE}/api/events/coordinator-events`;
      } else if (rand < 0.7) {
        url = `${MAIN_API_BASE}/api/approvals`;
      } else {
        url = `${MAIN_API_BASE}/api/notifications`;
      }
      const res = await sendHttpRequest(url, {
        headers: { Authorization: `Bearer ${facultyToken}` },
      });
      return {
        durationMs: res.durationMs,
        success: res.statusCode >= 200 && res.statusCode < 400,
        timedOut: res.timedOut,
        statusCode: res.statusCode,
      };
    }
    case "CtfCompetitor": {
      // CTF Competitor making HTTP poll and socket activity
      if (wsClient && wsClient.connected) {
        wsClient.emit("viewChallenge", "demo-chal-1");
      }
      const url = `${CTF_API_BASE}/api/health`;
      const res = await sendHttpRequest(url);
      return {
        durationMs: res.durationMs,
        success: res.statusCode >= 200 && res.statusCode < 400,
        timedOut: res.timedOut,
        statusCode: res.statusCode,
      };
    }
  }
}

// Calculate Percentiles
function calculatePercentile(latencies: number[], p: number): number {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, index)] * 100) / 100;
}

// Run single stage
async function runStage(concurrency: number, stageDurationSec: number): Promise<StageResult> {
  console.log(`\n=============================================================`);
  console.log(`[STAGE EXECUTION] Target Concurrency: ${concurrency} Users | Duration: ${stageDurationSec}s`);
  console.log(`=============================================================`);

  // Setup Event Loop Delay Histogram
  const histogram = monitorEventLoopDelay({ resolution: 10 });
  histogram.enable();

  const startCpu = process.cpuUsage();
  const stageStartTime = performance.now();
  const stageEndTime = stageStartTime + stageDurationSec * 1000;

  const latencies: number[] = [];
  let completed = 0;
  let failed = 0;
  let timeouts = 0;
  const errorStatusCodes: Record<number, number> = {};
  let activeInFlightRequests = 0;
  let peakInFlight = 0;

  // Active socket clients for CTF competitors
  const wsClients: any[] = [];
  const profileCounts: Record<string, number> = {
    Viewer: 0,
    Student: 0,
    FacultyCoordinator: 0,
    CtfCompetitor: 0,
  };

  // Assign profiles to virtual users
  // 40% Viewer, 35% Student, 15% CTF Competitor, 10% Faculty
  const userProfiles: UserProfileType[] = [];
  for (let i = 0; i < concurrency; i++) {
    const mod = i % 20;
    let profile: UserProfileType = "Viewer";
    if (mod < 8) profile = "Viewer";
    else if (mod < 15) profile = "Student";
    else if (mod < 18) profile = "CtfCompetitor";
    else profile = "FacultyCoordinator";

    userProfiles.push(profile);
    profileCounts[profile] = (profileCounts[profile] || 0) + 1;
  }

  // Connect CTF sockets
  for (const profile of userProfiles) {
    if (profile === "CtfCompetitor") {
      try {
        const client = io(CTF_WS_URL, {
          transports: ["websocket", "polling"],
          reconnection: false,
          timeout: 4000,
        });
        client.on("connect", () => {
          client.emit("joinCompetition", "demo-comp-id");
        });
        wsClients.push(client);
      } catch (err) {
        // Socket connection error
      }
    }
  }

  // Wait 1 second for socket handshakes to settle
  await new Promise((r) => setTimeout(r, 1000));

  // Virtual User Workers
  let stopSignaled = false;

  const userWorkers = userProfiles.map(async (profile, index) => {
    const wsClient = profile === "CtfCompetitor" ? wsClients.shift() : undefined;

    while (!stopSignaled && performance.now() < stageEndTime) {
      activeInFlightRequests++;
      if (activeInFlightRequests > peakInFlight) {
        peakInFlight = activeInFlightRequests;
      }

      const result = await executeProfileStep(profile, wsClient);
      activeInFlightRequests--;

      latencies.push(result.durationMs);
      if (result.timedOut) {
        timeouts++;
        failed++;
        errorStatusCodes[0] = (errorStatusCodes[0] || 0) + 1;
      } else if (!result.success) {
        failed++;
        errorStatusCodes[result.statusCode] = (errorStatusCodes[result.statusCode] || 0) + 1;
      } else {
        completed++;
      }

      // Think time: 100ms - 300ms
      const thinkTime = 100 + Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, thinkTime));
    }

    if (wsClient && wsClient.connected) {
      wsClient.disconnect();
    }
  });

  // Wait for stage duration
  const actualDurationMs = stageDurationSec * 1000;
  await new Promise((r) => setTimeout(r, actualDurationMs));
  stopSignaled = true;

  await Promise.allSettled(userWorkers);

  // Close remaining sockets
  for (const client of wsClients) {
    if (client && client.connected) client.disconnect();
  }

  histogram.disable();

  // Metrics calculation
  const totalHttpRequests = latencies.length;
  const elapsedSec = (performance.now() - stageStartTime) / 1000;
  const rps = Math.round((completed / elapsedSec) * 100) / 100;
  const errorRatePercent = totalHttpRequests > 0 ? Math.round((failed / totalHttpRequests) * 10000) / 100 : 0;
  const timeoutRatePercent = totalHttpRequests > 0 ? Math.round((timeouts / totalHttpRequests) * 10000) / 100 : 0;

  const p50 = calculatePercentile(latencies, 50);
  const p95 = calculatePercentile(latencies, 95);
  const p99 = calculatePercentile(latencies, 99);
  const minLatency = latencies.length > 0 ? Math.round(Math.min(...latencies) * 100) / 100 : 0;
  const maxLatency = latencies.length > 0 ? Math.round(Math.max(...latencies) * 100) / 100 : 0;

  // Resource metrics
  const endCpu = process.cpuUsage(startCpu);
  const totalCpuMicros = endCpu.user + endCpu.system;
  const cpuPercent = Math.round((totalCpuMicros / (elapsedSec * 1_000_000)) * 100 * 100) / 100;
  const mem = process.memoryUsage();
  const memoryRssMB = Math.round((mem.rss / (1024 * 1024)) * 100) / 100;
  const memoryHeapUsedMB = Math.round((mem.heapUsed / (1024 * 1024)) * 100) / 100;

  // Event loop delay
  const eventLoopDelayP50Ms = Math.round((histogram.percentile(50) / 1_000_000) * 100) / 100;
  const eventLoopDelayP95Ms = Math.round((histogram.percentile(95) / 1_000_000) * 100) / 100;
  const eventLoopDelayP99Ms = Math.round((histogram.percentile(99) / 1_000_000) * 100) / 100;

  // DB Latency probe
  let dbLatencyMs: number | null = null;
  try {
    const dbStart = performance.now();
    await prisma.$queryRawUnsafe("SELECT 1");
    dbLatencyMs = Math.round((performance.now() - dbStart) * 100) / 100;
  } catch (err: any) {
    console.warn("DB Probe Failed:", err.message);
  }

  // Redis Latency probe
  let redisLatencyMs: number | null = null;
  try {
    const redStart = performance.now();
    await redis.get("probe_key");
    redisLatencyMs = Math.round((performance.now() - redStart) * 100) / 100;
  } catch (err: any) {
    console.warn("Redis Probe Failed:", err.message);
  }

  // WebSocket Latency probe
  let wsLatencyMs: number | null = null;
  try {
    const probeSocket = io(CTF_WS_URL, { transports: ["websocket"], timeout: 3000 });
    const wsStart = performance.now();
    await new Promise<void>((resolve, reject) => {
      const tm = setTimeout(() => {
        probeSocket.disconnect();
        reject(new Error("WS timeout"));
      }, 3000);
      probeSocket.on("connect", () => {
        wsLatencyMs = Math.round((performance.now() - wsStart) * 100) / 100;
        clearTimeout(tm);
        probeSocket.disconnect();
        resolve();
      });
      probeSocket.on("connect_error", (e: any) => {
        clearTimeout(tm);
        probeSocket.disconnect();
        reject(e);
      });
    });
  } catch (err) {
    // ws latency probe null
  }

  // Stability assessment
  let stable = true;
  let stabilityNotes = "Stage passed stability criteria.";

  if (errorRatePercent > 5.0) {
    stable = false;
    stabilityNotes = `Error rate (${errorRatePercent}%) exceeded 5.0% threshold.`;
  } else if (p95 > 5000.0) {
    stable = false;
    stabilityNotes = `p95 Latency (${p95}ms) exceeded 5000ms threshold.`;
  } else if (dbLatencyMs !== null && dbLatencyMs > 8000.0) {
    stable = false;
    stabilityNotes = `DB probe latency (${dbLatencyMs}ms) indicated connection pool saturation.`;
  }

  console.log(`  Completed:              ${completed} requests`);
  console.log(`  Failed:                 ${failed} requests (${errorRatePercent}%)`);
  if (failed > 0) {
    console.log(`  Error Status Codes:     ${JSON.stringify(errorStatusCodes)}`);
  }
  console.log(`  Timeouts:               ${timeouts} requests (${timeoutRatePercent}%)`);
  console.log(`  RPS:                    ${rps}`);
  console.log(`  p50 / p95 / p99:        ${p50}ms / ${p95}ms / ${p99}ms`);
  console.log(`  Peak In-Flight HTTP:    ${peakInFlight}`);
  console.log(`  Event Loop Delay p95:   ${eventLoopDelayP95Ms}ms`);
  console.log(`  DB Probe Latency:       ${dbLatencyMs}ms`);
  console.log(`  Redis Probe Latency:    ${redisLatencyMs}ms`);
  console.log(`  WS Probe Latency:       ${wsLatencyMs}ms`);
  console.log(`  Stability:              ${stable ? "STABLE" : "UNSTABLE"} (${stabilityNotes})`);

  return {
    stageConcurrency: concurrency,
    profileDistribution: profileCounts,
    durationSeconds: stageDurationSec,
    totalHttpRequests,
    concurrentHttpRequestsPeak: peakInFlight,
    completedRequests: completed,
    failedRequests: failed,
    timeoutRequests: timeouts,
    rps,
    p50,
    p95,
    p99,
    minLatency,
    maxLatency,
    errorRatePercent,
    timeoutRatePercent,
    cpuPercent,
    memoryRssMB,
    memoryHeapUsedMB,
    eventLoopDelayP50Ms,
    eventLoopDelayP95Ms,
    eventLoopDelayP99Ms,
    dbLatencyMs,
    redisLatencyMs,
    wsLatencyMs,
    activeWsConnections: profileCounts["CtfCompetitor"] || 0,
    stable,
    stabilityNotes,
  };
}

async function main() {
  console.log("=============================================================");
  console.log("SENTINAL — STAGED CONCURRENCY & LOAD BENCHMARK (EMPIRICAL AUDIT)");
  console.log("=============================================================");
  console.log("Distinct Metric Tracking: Concurrent Users ≠ In-Flight HTTP ≠ RPS ≠ WS");
  console.log("Target Stages: 1, 5, 10, 25, 50, 100, 200, 400");
  console.log("Protocol: Increase stage only when previous stage is stable.");
  console.log("=============================================================");

  const targetStages = [1, 5, 10, 25, 50, 100, 200, 400];
  const stageDuration = 10; // 10s per stage
  const results: StageResult[] = [];

  for (const concurrency of targetStages) {
    const stageResult = await runStage(concurrency, stageDuration);
    results.push(stageResult);

    // Save intermediate progress
    const isAfter = process.argv.includes("--after");
    const targetFolder = isAfter ? "after" : "baseline";
    const targetFile = isAfter ? "staged_load_after.json" : "staged_load_baseline.json";
    const outDir = path.resolve(__dirname, `../../QA-REPORT/PERFORMANCE/${targetFolder}`);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(outDir, targetFile),
      JSON.stringify(results, null, 2)
    );

    if (!stageResult.stable) {
      console.log(`\n[CRITICAL SATURATION DETECTED] Stage ${concurrency} failed stability criteria.`);
      console.log(`Stopping escalation per Master Directive: "increase only when previous level is stable."`);
      break;
    }

    // Cooldown between stages
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n=============================================================");
  console.log("BENCHMARK SUMMARY & 400-USER READINESS VERDICT");
  console.log("=============================================================");
  console.table(
    results.map((r) => ({
      "Users": r.stageConcurrency,
      "Peak HTTP": r.concurrentHttpRequestsPeak,
      "RPS": r.rps,
      "p50 (ms)": r.p50,
      "p95 (ms)": r.p95,
      "p99 (ms)": r.p99,
      "Errors (%)": r.errorRatePercent,
      "EventLoop p95": r.eventLoopDelayP95Ms,
      "DB Ping (ms)": r.dbLatencyMs,
      "Stable": r.stable ? "YES" : "NO",
    }))
  );

  const highestStable = results.filter((r) => r.stable).pop();
  if (!highestStable || highestStable.stageConcurrency < 400) {
    console.log(`\nVERDICT: 400-user readiness not empirically established.`);
    console.log(`Highest stable concurrency level observed: ${highestStable ? highestStable.stageConcurrency : 0} concurrent users.`);
  } else {
    console.log(`\nVERDICT: 400 concurrent users empirically validated.`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Benchmark failed with error:", err);
  process.exit(1);
});
