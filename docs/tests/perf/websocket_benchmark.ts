import { performance } from "perf_hooks";
import fs from "fs";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { io } = require("../../ctf-platform/client/node_modules/socket.io-client");

const CTF_WS_URL = "http://localhost:5001/ctf";

interface WebSocketStageResult {
  targetConnections: number;
  successfulConnections: number;
  failedConnections: number;
  connectionSuccessRatePercent: number;
  connectTimeP50Ms: number;
  connectTimeP95Ms: number;
  broadcastLatencyP50Ms: number;
  broadcastLatencyP95Ms: number;
  memoryRssMB: number;
  memoryHeapUsedMB: number;
  stable: boolean;
  notes: string;
}

function calculatePercentile(latencies: number[], p: number): number {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, index)] * 100) / 100;
}

async function runWebSocketStage(targetCount: number): Promise<WebSocketStageResult> {
  console.log(`\n-------------------------------------------------------------`);
  console.log(`[TESTING WEBSOCKET SCALE] Target Connections: ${targetCount}`);
  console.log(`-------------------------------------------------------------`);

  const clients: any[] = [];
  const connectTimes: number[] = [];
  let connectedCount = 0;
  let failedCount = 0;

  // 1. Connect Phase
  const connectPromises = Array.from({ length: targetCount }, (_, i) => {
    return new Promise<void>((resolve) => {
      const cStart = performance.now();
      const socket = io(CTF_WS_URL, {
        transports: ["websocket"],
        timeout: 5000,
        reconnection: false,
        forceNew: true,
      });

      const tm = setTimeout(() => {
        failedCount++;
        socket.disconnect();
        resolve();
      }, 5000);

      socket.on("connect", () => {
        clearTimeout(tm);
        const dur = performance.now() - cStart;
        connectTimes.push(dur);
        connectedCount++;
        clients.push(socket);
        resolve();
      });

      socket.on("connect_error", () => {
        clearTimeout(tm);
        failedCount++;
        socket.disconnect();
        resolve();
      });
    });
  });

  await Promise.all(connectPromises);

  const connectTimeP50 = calculatePercentile(connectTimes, 50);
  const connectTimeP95 = calculatePercentile(connectTimes, 95);

  // 2. Broadcast / Fanout Latency Phase
  const broadcastLatencies: number[] = [];
  if (clients.length >= 2) {
    const sender = clients[0];
    const receiver = clients[clients.length - 1];

    sender.emit("joinCompetition", "bench-comp-1");
    receiver.emit("joinCompetition", "bench-comp-1");

    // Wait 500ms for room join
    await new Promise((r) => setTimeout(r, 500));

    // Test 5 ping/presence emissions
    for (let test = 0; test < 5; test++) {
      const bStart = performance.now();
      await new Promise<void>((resolve) => {
        const bTimeout = setTimeout(resolve, 2000);
        receiver.once("challengePresence", () => {
          clearTimeout(bTimeout);
          broadcastLatencies.push(performance.now() - bStart);
          resolve();
        });
        sender.emit("viewChallenge", "bench-comp-1");
      });
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  const broadcastP50 = calculatePercentile(broadcastLatencies, 50);
  const broadcastP95 = calculatePercentile(broadcastLatencies, 95);

  const mem = process.memoryUsage();
  const memoryRssMB = Math.round((mem.rss / (1024 * 1024)) * 100) / 100;
  const memoryHeapUsedMB = Math.round((mem.heapUsed / (1024 * 1024)) * 100) / 100;

  // 3. Disconnect Cleanup Phase
  for (const socket of clients) {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  }

  // Wait 1s for server-side socket cleanup
  await new Promise((r) => setTimeout(r, 1000));

  const successRate = targetCount > 0 ? Math.round((connectedCount / targetCount) * 10000) / 100 : 0;
  const stable = successRate >= 95.0 && connectTimeP95 < 2000;
  let notes = "Stable connection scaling.";
  if (successRate < 95.0) notes = `Connection success rate ${successRate}% below 95% threshold.`;
  else if (connectTimeP95 >= 2000) notes = `Connect p95 latency ${connectTimeP95}ms excessive.`;

  console.log(`  Connected:          ${connectedCount} / ${targetCount} (${successRate}%)`);
  console.log(`  Connect p50 / p95:  ${connectTimeP50}ms / ${connectTimeP95}ms`);
  console.log(`  Broadcast p50 / p95:${broadcastP50}ms / ${broadcastP95}ms`);
  console.log(`  Process Memory:     ${memoryRssMB} MB RSS, ${memoryHeapUsedMB} MB Heap`);
  console.log(`  Stability:          ${stable ? "STABLE" : "UNSTABLE"} (${notes})`);

  return {
    targetConnections: targetCount,
    successfulConnections: connectedCount,
    failedConnections: failedCount,
    connectionSuccessRatePercent: successRate,
    connectTimeP50Ms: connectTimeP50,
    connectTimeP95Ms: connectTimeP95,
    broadcastLatencyP50Ms: broadcastP50,
    broadcastLatencyP95Ms: broadcastP95,
    memoryRssMB,
    memoryHeapUsedMB,
    stable,
    notes,
  };
}

async function main() {
  console.log("=============================================================");
  console.log("SENTINAL — CTF WEBSOCKET SCALABILITY EXPERIMENT");
  console.log("Target Stages: 10, 25, 50, 100, 200, 400 connections");
  console.log("Protocol: Escalate only when previous stage is stable.");
  console.log("=============================================================");

  const targetStages = [10, 25, 50, 100, 200, 400];
  const results: WebSocketStageResult[] = [];

  for (const count of targetStages) {
    const res = await runWebSocketStage(count);
    results.push(res);

    const outDir = path.resolve(__dirname, "../../QA-REPORT/PERFORMANCE/experiments");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(outDir, "websocket_scale_experiment.json"),
      JSON.stringify(results, null, 2)
    );

    if (!res.stable) {
      console.log(`\n[SATURATION DETECTED] WebSocket stage ${count} failed stability criteria.`);
      console.log(`Stopping escalation per Master Directive: "increase only when previous level is stable."`);
      break;
    }

    // Cooldown
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n=============================================================");
  console.log("WEBSOCKET EXPERIMENT SUMMARY");
  console.log("=============================================================");
  console.table(
    results.map((r) => ({
      "Target": r.targetConnections,
      "Connected": r.successfulConnections,
      "Success (%)": r.connectionSuccessRatePercent,
      "Connect p50": r.connectTimeP50Ms,
      "Connect p95": r.connectTimeP95Ms,
      "Broadcast p50": r.broadcastLatencyP50Ms,
      "Stable": r.stable ? "YES" : "NO",
      "Notes": r.notes,
    }))
  );

  const highestStable = results.filter((r) => r.stable).pop();
  console.log(`\nHighest Stable WebSocket Scale Observed: ${highestStable ? highestStable.targetConnections : 0} concurrent connections.`);
}

main().catch((err) => {
  console.error("WebSocket experiment failed:", err);
  process.exit(1);
});
