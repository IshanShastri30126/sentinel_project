import dns from 'dns/promises';
import net from 'net';
import tls from 'tls';
import path from 'path';
import fs from 'fs';

// Native env loader (zero dependencies)
const serverEnvPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(serverEnvPath)) {
  const content = fs.readFileSync(serverEnvPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        let v = trimmed.slice(idx + 1).trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        if (!process.env[k]) process.env[k] = v;
      }
    }
  });
}

import prisma from '../../server/src/lib/prisma';
import { redisGet, redisSet } from '../../server/src/lib/redis';

interface TimingMetrics {
  dnsMs: number;
  tcpMs: number;
  tlsMs: number;
  totalHandshakeMs: number;
}

async function measureNetworkHandshake(host: string, port: number, isTls: boolean): Promise<TimingMetrics> {
  const dnsStart = performance.now();
  const lookup = await dns.lookup(host);
  const dnsMs = performance.now() - dnsStart;

  return new Promise((resolve, reject) => {
    const tcpStart = performance.now();
    const socket = net.connect(port, lookup.address, () => {
      const tcpMs = performance.now() - tcpStart;
      if (!isTls) {
        socket.end();
        resolve({
          dnsMs,
          tcpMs,
          tlsMs: 0,
          totalHandshakeMs: dnsMs + tcpMs,
        });
        return;
      }

      const tlsStart = performance.now();
      const secureSocket = tls.connect(
        {
          socket,
          servername: host,
        },
        () => {
          const tlsMs = performance.now() - tlsStart;
          secureSocket.end();
          resolve({
            dnsMs,
            tcpMs,
            tlsMs,
            totalHandshakeMs: dnsMs + tcpMs + tlsMs,
          });
        }
      );

      secureSocket.on('error', (err) => {
        socket.destroy();
        reject(err);
      });
    });

    socket.on('error', (err) => reject(err));
  });
}

async function runBreakdown() {
  console.log('=============================================================');
  console.log('SENTINAL PERFORMANCE ENGINEERING — DECOMPOSED NETWORK & ENGINE AUDIT');
  console.log('=============================================================');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL not found in server/.env');
  }

  const parsedDb = new URL(dbUrl);
  const dbHost = parsedDb.hostname;
  const dbPort = parseInt(parsedDb.port || '5432');

  console.log(`\n[PHASE 1] Dissecting Neon PostgreSQL Latency (Host: ${dbHost})`);
  try {
    const dbNetwork = await measureNetworkHandshake(dbHost, dbPort, true);
    console.log(`  → DNS Resolution:          ${dbNetwork.dnsMs.toFixed(2)} ms`);
    console.log(`  → TCP Handshake:            ${dbNetwork.tcpMs.toFixed(2)} ms`);
    console.log(`  → TLS 1.3 Handshake:        ${dbNetwork.tlsMs.toFixed(2)} ms`);
    console.log(`  → Total Network Handshake:  ${dbNetwork.totalHandshakeMs.toFixed(2)} ms`);
  } catch (err: any) {
    console.warn(`  × Network handshake probe warning: ${err.message}`);
  }

  // Measure Prisma Connection Pool Acquisition
  const poolStart = performance.now();
  await prisma.$connect();
  const poolAcquisitionMs = performance.now() - poolStart;
  console.log(`  → Prisma Pool Connect:      ${poolAcquisitionMs.toFixed(2)} ms`);

  // Measure Ping Round-Trip vs Internal PostgreSQL Execution Time
  console.log('\n[PHASE 2] Measuring Database Engine Execution vs Network Transit');
  const pingExplains: any[] = await prisma.$queryRawUnsafe('EXPLAIN (ANALYZE, BUFFERS, TIMING) SELECT 1 as ping');
  console.log('  → EXPLAIN ANALYZE "SELECT 1":');
  pingExplains.forEach((row: any) => console.log(`     ${row['QUERY PLAN']}`));

  const pingTotalStart = performance.now();
  await prisma.$queryRawUnsafe('SELECT 1 as ping');
  const pingTotalMs = performance.now() - pingTotalStart;
  console.log(`  → Full Client-to-DB-to-Client Roundtrip: ${pingTotalMs.toFixed(2)} ms`);

  // Query Execution on Active Tables with EXPLAIN ANALYZE
  console.log('\n[PHASE 3] Candidate Query Profiling (Actual Engine Time & Plan Inspection)');

  // 1. Event Registration Count Query
  console.log('\n--- Query 1: Event Registration Count by eventId ---');
  const sampleEvent = await prisma.event.findFirst({ select: { id: true, title: true } });
  const eventId = sampleEvent?.id || 'dummy-event-id';
  console.log(`Target Event ID: ${eventId} (${sampleEvent?.title || 'None'})`);

  const eventCountPlan: any[] = await prisma.$queryRawUnsafe(
    `EXPLAIN (ANALYZE, BUFFERS, TIMING) SELECT COUNT(*) FROM "event_registrations" WHERE "eventId" = '${eventId}'`
  );
  eventCountPlan.forEach((r) => console.log(`  ${r['QUERY PLAN']}`));

  // 2. CTF Submission Lookup
  console.log('\n--- Query 2: CTF Submission Verification (participantId + challengeId) ---');
  const submissionPlan: any[] = await prisma.$queryRawUnsafe(
    `EXPLAIN (ANALYZE, BUFFERS, TIMING) SELECT * FROM "ctf_submissions" WHERE "participantId" = 'test-part' AND "challengeId" = 'test-chal'`
  );
  submissionPlan.forEach((r) => console.log(`  ${r['QUERY PLAN']}`));

  // 3. CTF Challenges by Competition
  console.log('\n--- Query 3: CTF Challenges by competitionId ---');
  const challengePlan: any[] = await prisma.$queryRawUnsafe(
    `EXPLAIN (ANALYZE, BUFFERS, TIMING) SELECT * FROM "ctf_challenges" WHERE "competitionId" = 'test-comp'`
  );
  challengePlan.forEach((r) => console.log(`  ${r['QUERY PLAN']}`));

  // 4. CTF Leaderboard Ordering
  console.log('\n--- Query 4: CTF Leaderboard Pre-Sorted Query ---');
  const leaderboardPlan: any[] = await prisma.$queryRawUnsafe(
    `EXPLAIN (ANALYZE, BUFFERS, TIMING) SELECT "id", "totalScore", "tier" FROM "ctf_participants" WHERE "competitionId" = 'test-comp' ORDER BY "totalScore" DESC`
  );
  leaderboardPlan.forEach((r) => console.log(`  ${r['QUERY PLAN']}`));

  // 5. Certificates by Event
  console.log('\n--- Query 5: Certificates by eventId ---');
  const certPlan: any[] = await prisma.$queryRawUnsafe(
    `EXPLAIN (ANALYZE, BUFFERS, TIMING) SELECT * FROM "certificates" WHERE "eventId" = '${eventId}'`
  );
  certPlan.forEach((r) => console.log(`  ${r['QUERY PLAN']}`));

  // Measure Upstash Redis Latency Decomposition
  console.log('\n[PHASE 4] Dissecting Upstash Redis REST Latency');
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  if (redisUrl) {
    const parsedRedis = new URL(redisUrl);
    const redisHost = parsedRedis.hostname;
    const redisPort = parseInt(parsedRedis.port || '443');

    const redisNet = await measureNetworkHandshake(redisHost, redisPort, true);
    console.log(`  → Host:                     ${redisHost}`);
    console.log(`  → DNS Resolution:          ${redisNet.dnsMs.toFixed(2)} ms`);
    console.log(`  → TCP Handshake:            ${redisNet.tcpMs.toFixed(2)} ms`);
    console.log(`  → TLS 1.3 Handshake:        ${redisNet.tlsMs.toFixed(2)} ms`);
    console.log(`  → Total Network Handshake:  ${redisNet.totalHandshakeMs.toFixed(2)} ms`);

    const redisOpStart = performance.now();
    await redisSet('probe:timing:test', '12345', 30);
    const redisSetMs = performance.now() - redisOpStart;

    const redisGetStart = performance.now();
    const val = await redisGet('probe:timing:test');
    const redisGetMs = performance.now() - redisGetStart;

    console.log(`  → REST API SET Duration:    ${redisSetMs.toFixed(2)} ms`);
    console.log(`  → REST API GET Duration:    ${redisGetMs.toFixed(2)} ms (Value: ${val})`);
  }

  await prisma.$disconnect();
  console.log('\n=============================================================');
  console.log('AUDIT DECOMPOSITION COMPLETE');
  console.log('=============================================================');
}

runBreakdown().catch((err) => {
  console.error('Fatal error during breakdown:', err);
  process.exit(1);
});
