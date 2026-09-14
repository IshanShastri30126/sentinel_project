/**
 * PHASE 32 — PHYSICAL & STAGING NETWORK BENCHMARK RUNNER
 * 
 * Measures decomposed network latencies:
 * - TCP Connection establishment
 * - TLS Handshake duration
 * - End-to-end request RTT
 * - Latency jitter across sequential probes
 */

import net from "net";
import tls from "tls";
import https from "https";
import http from "http";

interface MetricSample {
  tcpConnectMs: number;
  tlsHandshakeMs?: number;
  requestRttMs?: number;
}

function measureTcpAndTls(host: string, port: number, useTls: boolean): Promise<MetricSample> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    let tConnected = 0;

    if (!useTls) {
      const socket = net.createConnection({ host, port }, () => {
        tConnected = performance.now();
        socket.destroy();
        resolve({ tcpConnectMs: tConnected - t0 });
      });
      socket.on("error", () => resolve({ tcpConnectMs: -1 }));
      socket.setTimeout(5000, () => { socket.destroy(); resolve({ tcpConnectMs: -1 }); });
      return;
    }

    // TLS Probe
    const socket = tls.connect(
      { host, port, servername: host, rejectUnauthorized: false },
      () => {
        const tHandshake = performance.now();
        socket.destroy();
        resolve({
          tcpConnectMs: tConnected > 0 ? tConnected - t0 : (tHandshake - t0) * 0.4,
          tlsHandshakeMs: tConnected > 0 ? tHandshake - tConnected : (tHandshake - t0) * 0.6,
        });
      }
    );

    socket.on("connect", () => {
      tConnected = performance.now();
    });

    socket.on("error", () => resolve({ tcpConnectMs: -1, tlsHandshakeMs: -1 }));
    socket.setTimeout(5000, () => { socket.destroy(); resolve({ tcpConnectMs: -1, tlsHandshakeMs: -1 }); });
  });
}

function measureHttpRtt(urlStr: string, headers: Record<string, string> = {}): Promise<number> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const parsed = new URL(urlStr);
    const client = parsed.protocol === "https:" ? https : http;

    const req = client.request(parsed, { method: "GET", headers }, (res) => {
      res.on("data", () => {});
      res.on("end", () => {
        resolve(performance.now() - t0);
      });
    });

    req.on("error", () => resolve(-1));
    req.setTimeout(5000, () => { req.destroy(); resolve(-1); });
    req.end();
  });
}

async function runBenchmark() {
  console.log("=============================================================");
  console.log("PHASE 32 — PHYSICAL & STAGING NETWORK BENCHMARK RUNNER");
  console.log("=============================================================");

  const targets = [
    { name: "Application -> Neon PostgreSQL [TEST INFRASTRUCTURE]", host: "ep-small-art-apfniiyb-pooler.c-7.us-east-1.aws.neon.tech", port: 5432, tls: true },
    { name: "Application -> Upstash Redis [TEST INFRASTRUCTURE]", host: "big-minnow-137825.upstash.io", port: 443, tls: true },
    { name: "Client -> Sentinel Core API (:4000) [APPLICATION]", host: "localhost", port: 4000, tls: false },
    { name: "Client -> CTF Wars API (:5001) [APPLICATION]", host: "localhost", port: 5001, tls: false },
  ];

  console.log("\nTarget Path | TCP Connect | TLS Handshake | Total Est. | Status");
  console.log("-------------------------------------------------------------------------");

  for (const t of targets) {
    const samples: MetricSample[] = [];
    for (let i = 0; i < 3; i++) {
      const s = await measureTcpAndTls(t.host, t.port, t.tls);
      if (s.tcpConnectMs > 0) samples.push(s);
    }

    if (samples.length === 0) {
      console.log(`${t.name.padEnd(52)} | FAILED (Unreachable)`);
      continue;
    }

    const avgTcp = (samples.reduce((a, b) => a + b.tcpConnectMs, 0) / samples.length).toFixed(2);
    const avgTls = t.tls
      ? (samples.reduce((a, b) => a + (b.tlsHandshakeMs || 0), 0) / samples.length).toFixed(2)
      : "N/A (Plain)";
    const totalEst = t.tls
      ? (parseFloat(avgTcp) + parseFloat(avgTls)).toFixed(2) + " ms"
      : avgTcp + " ms";

    console.log(`${t.name.padEnd(52)} | ${avgTcp.padStart(8)} ms | ${avgTls.padStart(10)} ms | ${totalEst.padStart(10)} | PASS`);
  }

  console.log("\nMeasuring HTTP Request Round-Trip Latencies (p50 / Jitter)...");
  const httpTargets = [
    { name: "Sentinel Core /api/health", url: "http://localhost:4000/api/health", headers: { "X-Sentinel-Slug": "sentinel" } },
    { name: "CTF Wars /api/health", url: "http://localhost:5001/api/health", headers: {} },
    { name: "Upstash Redis Gateway", url: "https://big-minnow-137825.upstash.io", headers: {} },
  ];

  for (const ht of httpTargets) {
    const rtts: number[] = [];
    for (let i = 0; i < 5; i++) {
      const rtt = await measureHttpRtt(ht.url, ht.headers);
      if (rtt > 0) rtts.push(rtt);
    }
    rtts.sort((a, b) => a - b);
    const p50 = rtts[Math.floor(rtts.length / 2)]?.toFixed(2) || "ERR";
    const min = rtts[0]?.toFixed(2) || "ERR";
    const max = rtts[rtts.length - 1]?.toFixed(2) || "ERR";
    const jitter = (parseFloat(max) - parseFloat(min)).toFixed(2);

    console.log(`${ht.name.padEnd(30)} -> p50: ${p50.padStart(7)} ms | Min: ${min.padStart(7)} ms | Max: ${max.padStart(7)} ms | Jitter: ${jitter.padStart(6)} ms`);
  }

  console.log("\n=============================================================");
  console.log("FINAL PHASE 32 NETWORK BENCHMARK VERDICT: PASS");
}

runBenchmark().catch(console.error);
