import { PrismaClient } from "../../server/node_modules/@prisma/client";
import { performance } from "perf_hooks";
import fs from "fs";
import path from "path";

const BASE_DB_URL = "postgresql://neondb_owner:npg_L6yec7hwIYfm@ep-small-art-apfniiyb-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15";

interface PoolExperimentResult {
  poolLimit: number;
  concurrency: number;
  durationSeconds: number;
  completedQueries: number;
  failedQueries: number;
  throughputQps: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  minMs: number;
  maxMs: number;
  errorRatePercent: number;
  memoryRssMB: number;
  memoryHeapUsedMB: number;
  cpuPercent: number;
  stable: boolean;
  notes: string;
}

function calculatePercentile(latencies: number[], p: number): number {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, index)] * 100) / 100;
}

async function testPoolSize(poolLimit: number, concurrency: number, durationSec: number): Promise<PoolExperimentResult> {
  console.log(`\n-------------------------------------------------------------`);
  console.log(`[TESTING POOL SIZE] connection_limit = ${poolLimit} | Concurrency = ${concurrency} | Duration = ${durationSec}s`);
  console.log(`-------------------------------------------------------------`);

  const dbUrlWithLimit = `${BASE_DB_URL}&connection_limit=${poolLimit}`;
  const prisma = new PrismaClient({
    datasources: {
      db: { url: dbUrlWithLimit },
    },
  });

  // Warmup connection
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch (err: any) {
    console.warn("Warmup query failed:", err.message);
  }

  const startCpu = process.cpuUsage();
  const startTime = performance.now();
  const endTime = startTime + durationSec * 1000;

  const latencies: number[] = [];
  let completed = 0;
  let failed = 0;
  let stopSignaled = false;

  const workers = Array.from({ length: concurrency }, async () => {
    while (!stopSignaled && performance.now() < endTime) {
      const qStart = performance.now();
      try {
        // Query realistic indexed/key lookup
        await prisma.event.findMany({
          take: 5,
          select: { id: true, title: true, isPublished: true, startDate: true },
        });
        const duration = performance.now() - qStart;
        latencies.push(duration);
        completed++;
      } catch (err: any) {
        if (failed === 0) {
          console.error("  First error in worker:", err.message);
        }
        const duration = performance.now() - qStart;
        latencies.push(duration);
        failed++;
      }
      // Minimal think time between DB operations (50ms)
      await new Promise((r) => setTimeout(r, 50));
    }
  });

  await new Promise((r) => setTimeout(r, durationSec * 1000));
  stopSignaled = true;
  await Promise.allSettled(workers);

  const elapsedSec = (performance.now() - startTime) / 1000;
  const total = latencies.length;
  const throughputQps = Math.round((completed / elapsedSec) * 100) / 100;
  const errorRatePercent = total > 0 ? Math.round((failed / total) * 10000) / 100 : 0;

  const p50Ms = calculatePercentile(latencies, 50);
  const p95Ms = calculatePercentile(latencies, 95);
  const p99Ms = calculatePercentile(latencies, 99);
  const minMs = total > 0 ? Math.round(Math.min(...latencies) * 100) / 100 : 0;
  const maxMs = total > 0 ? Math.round(Math.max(...latencies) * 100) / 100 : 0;

  const endCpu = process.cpuUsage(startCpu);
  const totalCpuMicros = endCpu.user + endCpu.system;
  const cpuPercent = Math.round((totalCpuMicros / (elapsedSec * 1_000_000)) * 100 * 100) / 100;
  const mem = process.memoryUsage();
  const memoryRssMB = Math.round((mem.rss / (1024 * 1024)) * 100) / 100;
  const memoryHeapUsedMB = Math.round((mem.heapUsed / (1024 * 1024)) * 100) / 100;

  await prisma.$disconnect();

  const stable = errorRatePercent <= 1.0 && p95Ms < 4000;
  let notes = "Stable throughput.";
  if (errorRatePercent > 1.0) notes = `Error rate ${errorRatePercent}% exceeded limit.`;
  else if (p95Ms >= 4000) notes = `p95 latency ${p95Ms}ms high queuing delay.`;

  console.log(`  Completed Queries:  ${completed}`);
  console.log(`  Failed Queries:     ${failed} (${errorRatePercent}%)`);
  console.log(`  Throughput:         ${throughputQps} QPS`);
  console.log(`  p50 / p95 / p99:    ${p50Ms}ms / ${p95Ms}ms / ${p99Ms}ms`);
  console.log(`  Stability:          ${stable ? "STABLE" : "UNSTABLE"} (${notes})`);

  return {
    poolLimit,
    concurrency,
    durationSeconds: durationSec,
    completedQueries: completed,
    failedQueries: failed,
    throughputQps,
    p50Ms,
    p95Ms,
    p99Ms,
    minMs,
    maxMs,
    errorRatePercent,
    memoryRssMB,
    memoryHeapUsedMB,
    cpuPercent,
    stable,
    notes,
  };
}

async function main() {
  console.log("=============================================================");
  console.log("SENTINAL — PRISMA CONNECTION POOL SYSTEMATIC EXPERIMENT");
  console.log("Target Pool Sizes: 5, 8, 10, 12, 15, 20");
  console.log("Concurrency: 15 Concurrent Database Workers");
  console.log("Objective: Determine smallest pool providing stable throughput.");
  console.log("=============================================================");

  const poolSizes = [5, 8, 10, 12, 15, 20];
  const concurrency = 15;
  const durationSec = 8; // 8 seconds per pool size

  const results: PoolExperimentResult[] = [];

  for (const poolLimit of poolSizes) {
    const res = await testPoolSize(poolLimit, concurrency, durationSec);
    results.push(res);
    // Cooldown
    await new Promise((r) => setTimeout(r, 1500));
  }

  const outDir = path.resolve(__dirname, "../../QA-REPORT/PERFORMANCE/experiments");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(outDir, "connection_pool_experiment.json"),
    JSON.stringify(results, null, 2)
  );

  console.log("\n=============================================================");
  console.log("CONNECTION POOL EXPERIMENT RESULTS SUMMARY");
  console.log("=============================================================");
  console.table(
    results.map((r) => ({
      "Pool Size": r.poolLimit,
      "Throughput (QPS)": r.throughputQps,
      "p50 (ms)": r.p50Ms,
      "p95 (ms)": r.p95Ms,
      "p99 (ms)": r.p99Ms,
      "Errors (%)": r.errorRatePercent,
      "Stable": r.stable ? "YES" : "NO",
      "Notes": r.notes,
    }))
  );

  // Determine optimal pool size
  const stableResults = results.filter((r) => r.stable);
  if (stableResults.length > 0) {
    // Pick the one with the best throughput/latency balance
    stableResults.sort((a, b) => b.throughputQps - a.throughputQps);
    console.log(`\nOptimal Test Pool Size Recommended: connection_limit = ${stableResults[0].poolLimit} (Provides ${stableResults[0].throughputQps} QPS with p95 ${stableResults[0].p95Ms}ms)`);
  } else {
    console.log(`\nNo pool size satisfied strict stability under 15 concurrent workers on remote test DB.`);
  }
}

main().catch((err) => {
  console.error("Experiment failed:", err);
  process.exit(1);
});
