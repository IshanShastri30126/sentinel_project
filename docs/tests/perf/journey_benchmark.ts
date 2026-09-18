import fs from 'fs';
import path from 'path';
import jwt from '../../server/node_modules/jsonwebtoken';

// Native env loader
const envPaths = [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), 'server/.env'), path.resolve(process.cwd(), '../server/.env')];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8');
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
    break;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-prod';
const API_BASE = 'http://localhost:4000/api';
const CTF_API_BASE = 'http://localhost:5001/api';

// Generate authentic tokens for verified accounts
const facultyToken = jwt.sign(
  {
    userId: '8aa7da70-ed4a-4424-9dd6-5d05564bf81a',
    email: 'd25ce145@charusat.edu.in',
    role: 'FACULTY_COORDINATOR',
    jti: 'perf-faculty-token-01',
  },
  JWT_SECRET,
  { expiresIn: '2h' }
);

const studentToken = jwt.sign(
  {
    userId: '3531f8a8-5824-453e-9d8b-c0eb6381d557',
    email: 'student_3194@charusat.edu.in',
    role: 'MEMBER',
    jti: 'perf-student-token-01',
  },
  JWT_SECRET,
  { expiresIn: '2h' }
);

interface BenchmarkResult {
  journey: string;
  action: string;
  method: string;
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  responseSizeBytes: number;
  timestamp: string;
}

const results: BenchmarkResult[] = [];

async function benchmarkRequest(
  journey: string,
  action: string,
  method: string,
  url: string,
  options?: RequestInit
): Promise<{ status: number; body: any; latencyMs: number }> {
  const t0 = performance.now();
  try {
    const res = await fetch(url, {
      method,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    const latencyMs = performance.now() - t0;
    const text = await res.text();
    let body: any = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }

    results.push({
      journey,
      action,
      method,
      endpoint: url.replace(/http:\/\/localhost:\d+/, ''),
      statusCode: res.status,
      latencyMs: parseFloat(latencyMs.toFixed(2)),
      responseSizeBytes: Buffer.byteLength(text, 'utf8'),
      timestamp: new Date().toISOString(),
    });

    return { status: res.status, body, latencyMs };
  } catch (err: any) {
    const latencyMs = performance.now() - t0;
    results.push({
      journey,
      action,
      method,
      endpoint: url.replace(/http:\/\/localhost:\d+/, ''),
      statusCode: 0,
      latencyMs: parseFloat(latencyMs.toFixed(2)),
      responseSizeBytes: 0,
      timestamp: new Date().toISOString(),
    });
    return { status: 0, body: err.message, latencyMs };
  }
}

async function runJourneys() {
  console.log('=============================================================');
  console.log('SENTINAL 12 REAL USER JOURNEYS PERFORMANCE BENCHMARK (AUTHENTICATED)');
  console.log('=============================================================');

  // JOURNEY 1: Landing → Login → Dashboard
  console.log('\n[JOURNEY 1] Landing → Login → Dashboard');
  await benchmarkRequest('J01', 'Health Check', 'GET', `${API_BASE}/health`);
  await benchmarkRequest('J01', 'Clubs Lookup (L1 Cache)', 'GET', `${API_BASE}/clubs`);
  await benchmarkRequest('J01', 'Get Current User (Faculty Auth)', 'GET', `${API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  await benchmarkRequest('J01', 'Get Current User (Student Auth)', 'GET', `${API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  // JOURNEY 2: Dashboard → Events → Event Detail
  console.log('\n[JOURNEY 2] Dashboard → Events → Event Detail');
  const eventsRes = await benchmarkRequest('J02', 'List Public Events', 'GET', `${API_BASE}/events`);
  const activeEvents = eventsRes.body?.events || [];
  const targetEvent = activeEvents[0];
  const targetSlug = targetEvent?.slug || 'race-10-5-1785-1773491404104-mnsvz9';

  await benchmarkRequest('J02', 'Public Event Details by Slug', 'GET', `${API_BASE}/events/public/${targetSlug}`);

  // JOURNEY 3: Faculty Coordinator → Create Event
  console.log('\n[JOURNEY 3] Faculty Coordinator → Create Event');
  let createdEventId: string | null = null;
  const now = Date.now();
  const eventPayload = {
    title: `Perf Wargame ${now.toString().slice(-4)}`,
    description: 'Controlled benchmark event creation transaction',
    venue: 'Cyber Range Sector 7',
    startDate: new Date(now + 3600000).toISOString(),
    endDate: new Date(now + 86400000).toISOString(),
    registrationDeadline: new Date(now + 3600000).toISOString(),
    eventType: 'ctf',
    maxCapacity: 50,
  };
  const createRes = await benchmarkRequest('J03', 'Create Event (Draft)', 'POST', `${API_BASE}/events`, {
    headers: { Authorization: `Bearer ${facultyToken}` },
    body: JSON.stringify(eventPayload),
  });
  createdEventId = createRes.body?.event?.id;

  // JOURNEY 4: Student → Events → Register
  console.log('\n[JOURNEY 4] Student → Events → Register');
  const eventToRegister = createdEventId || targetEvent?.id;
  if (eventToRegister) {
    await benchmarkRequest('J04', 'Register Student for Event', 'POST', `${API_BASE}/events/${eventToRegister}/register`, {
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        name: 'Student Operative',
        studentId: 'ST-PERF-01',
        phone: '9876543210',
        department: 'Cyber Defense',
        institute: 'CSPIT',
      }),
    });
  }

  // JOURNEY 5: Event → Join Terminal → CTF
  console.log('\n[JOURNEY 5] Event → Join Terminal → CTF');
  await benchmarkRequest('J05', 'CTF Server Health Check', 'GET', `${CTF_API_BASE}/health`);
  const compRes = await benchmarkRequest('J05', 'List CTF Competitions', 'GET', `${CTF_API_BASE}/competitions`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const comps = compRes.body?.data || [];
  const targetComp = comps[0];
  const compId = targetComp?.id || 'demo-comp-id';

  // JOURNEY 6: CTF → Challenge List → Challenge Detail
  console.log('\n[JOURNEY 6] CTF → Challenge List → Challenge Detail');
  const challengesRes = await benchmarkRequest('J06', 'List CTF Challenges', 'GET', `${CTF_API_BASE}/challenges/competition/${compId}`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const challenges = challengesRes.body?.data || [];
  const targetChallenge = challenges[0];
  const challengeId = targetChallenge?.id || 'demo-challenge-id';

  if (targetChallenge) {
    await benchmarkRequest('J06', 'Get Challenge Detail', 'GET', `${CTF_API_BASE}/challenges/${challengeId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
  }

  // JOURNEY 7: CTF → Hint Unlock
  console.log('\n[JOURNEY 7] CTF → Hint Unlock');
  const hints = targetChallenge?.hints || [];
  if (hints.length > 0) {
    const hintId = hints[0].id;
    await benchmarkRequest('J07', 'Unlock CTF Hint', 'POST', `${CTF_API_BASE}/challenges/${challengeId}/hints/${hintId}/unlock`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
  }

  // JOURNEY 8: CTF → Flag Submission
  console.log('\n[JOURNEY 8] CTF → Flag Submission');
  await benchmarkRequest('J08', 'Submit CTF Flag', 'POST', `${CTF_API_BASE}/submissions`, {
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      challengeId,
      flag: 'flag{invalid_perf_probe}',
    }),
  });

  // JOURNEY 9: CTF → Scoreboard
  console.log('\n[JOURNEY 9] CTF → Scoreboard');
  await benchmarkRequest('J09', 'Get Leaderboard by Comp ID', 'GET', `${CTF_API_BASE}/leaderboard/${compId}`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  // JOURNEY 10: Notifications
  console.log('\n[JOURNEY 10] Notifications');
  await benchmarkRequest('J10', 'List User Notifications', 'GET', `${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  // JOURNEY 11: Profile / Account
  console.log('\n[JOURNEY 11] Profile / Account');
  await benchmarkRequest('J11', 'Get User Profile', 'GET', `${API_BASE}/users/profile`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  // JOURNEY 12: Back / Forward Navigation (Route HTML TTFB)
  console.log('\n[JOURNEY 12] Route Navigation (Client Frontend TTFB)');
  const clientRoutes = [
    'http://localhost:3000',
    'http://localhost:3000/auth',
    'http://localhost:3000/dashboard',
    'http://localhost:3001',
    'http://localhost:3001/challenges',
    'http://localhost:3001/leaderboard',
  ];
  for (const cr of clientRoutes) {
    await benchmarkRequest('J12', `Client Route TTFB (${cr.replace('http://localhost:300', '')})`, 'GET', cr);
  }

  console.log('\n=============================================================');
  console.log('AUTHENTICATED BENCHMARK SUMMARY TABLE');
  console.log('=============================================================');
  console.table(
    results.map((r) => ({
      Journey: r.journey,
      Action: r.action,
      Method: r.method,
      Endpoint: r.endpoint.length > 35 ? r.endpoint.slice(0, 32) + '...' : r.endpoint,
      Status: r.statusCode,
      'Latency (ms)': r.latencyMs,
      'Size (B)': r.responseSizeBytes,
    }))
  );

  const isAfter = process.argv.includes('--after');
  const folder = isAfter ? 'after' : 'baseline';
  const filename = isAfter ? 'journey_after.json' : 'journey_baseline.json';
  const outputDir = path.resolve(process.cwd(), `QA-REPORT/PERFORMANCE/${folder}`);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(results, null, 2));
  console.log(`\nSaved authenticated metrics to: QA-REPORT/PERFORMANCE/${folder}/${filename}`);
}

runJourneys().catch((err) => {
  console.error('Fatal error during benchmark:', err);
  process.exit(1);
});
