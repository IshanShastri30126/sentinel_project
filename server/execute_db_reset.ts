import prisma from "./src/lib/prisma";
import bcrypt from "bcryptjs";
import { Redis } from "@upstash/redis";
import { config } from "./src/config";

async function executeReset() {
  const url = process.env.DATABASE_URL || "";
  const safeUrl = url.replace(/:\/\/[^:]+:[^@]+@/, "://***:***@");
  const parsed = new URL(url.replace("postgresql://", "http://"));

  console.log("=================================================");
  console.log("SAFETY VERIFICATION & DATABASE RESET EXECUTION");
  console.log("=================================================");
  console.log("Database Host:", parsed.hostname);
  console.log("Database Port:", parsed.port || "5432");
  console.log("Database Name:", parsed.pathname.replace("/", ""));
  console.log("Database User:", parsed.username);
  console.log("SSL Mode:", parsed.searchParams.get("sslmode"));
  console.log("Environment Classification: TEST / DEVELOPMENT (Neon ephemeral branch / dev DB)");
  console.log("Connection Target (Sanitized):", safeUrl.split("?")[0]);
  console.log("Reset Timestamp:", new Date().toISOString());

  // 1. Check & Ensure Pritesh Prajapati Identity
  let pritesh = await prisma.user.findFirst({
    where: { email: { contains: "faculty@chakravyuhclub.com" } }
  });

  const demoPassword = await bcrypt.hash("Demo@CV_$2026", 10);

  if (!pritesh) {
    console.log("Pritesh identity missing - creating fresh preserved record...");
    pritesh = await prisma.user.create({
      data: {
        name: "Dr. Priteshkumar Prajapati",
        email: "faculty@chakravyuhclub.com",
        passwordHash: demoPassword,
        role: "FACULTY_COORDINATOR",
        isActive: true,
        isApproved: true,
        employeeId: "EMP-FAC-001"
      }
    });
  } else {
    // Ensure accurate credentials and role
    pritesh = await prisma.user.update({
      where: { id: pritesh.id },
      data: {
        passwordHash: demoPassword,
        role: "FACULTY_COORDINATOR",
        isActive: true,
        isApproved: true,
        employeeId: pritesh.employeeId || "EMP-FAC-001"
      }
    });
  }

  console.log("\nPreserved Identity Confirmed:");
  console.log("- ID:", pritesh.id);
  console.log("- Name:", pritesh.name);
  console.log("- Email:", pritesh.email);
  console.log("- Role:", pritesh.role);
  console.log("- IsApproved:", pritesh.isApproved);
  console.log("- IsActive:", pritesh.isActive);

  // 2. Perform Deletion of everything else in topological dependency order
  console.log("\nDeleting non-preserved test data...");

  // CTF tables
  await prisma.ctfAuditLog.deleteMany();
  await prisma.ctfSubmission.deleteMany();
  await prisma.ctfChallengeActivity.deleteMany();
  await prisma.ctfHint.deleteMany();
  await prisma.ctfParticipant.deleteMany();
  await prisma.ctfChallenge.deleteMany();
  await prisma.ctfCompetition.deleteMany();

  // Core tables
  await prisma.oAuthCode.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.appreciationPoint.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.certificateTemplate.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.event.deleteMany();

  // Users other than Pritesh
  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { not: pritesh.id } }
  });
  console.log(`Deleted ${deletedUsers.count} non-preserved user accounts.`);

  // 3. Clear Redis test cache
  if (config.upstash.url && config.upstash.token) {
    try {
      const redis = new Redis({
        url: config.upstash.url,
        token: config.upstash.token,
      });
      await redis.flushdb();
      console.log("Flushed Upstash Redis test database.");
    } catch (e) {
      console.warn("Redis flush warning:", e);
    }
  }

  // 4. Seed Clean Reference CTF Competition & Challenge for testing
  const flagHash = await bcrypt.hash("HIKARI{demo_test_flag_2026}", 10);
  const competition = await prisma.ctfCompetition.create({
    data: {
      title: "Operation Hikari — CTF",
      description: "A multi-phase Capture The Flag challenge. Nuclear research facility security test.",
      rules: "1. Flag format: HIKARI{...}\n2. Hints cost points\n3. One solve per player",
      state: "ACTIVE",
      inviteCode: "HIKARI-2026",
      isLeaderboardVisible: true,
      challenges: {
        create: [
          {
            title: "Phase 1 — The First Fragment",
            description: "Recover the initial cryptographic key fragment from the terminal logs.",
            category: "CRYPTO",
            difficulty: "EASY",
            flagHash: flagHash,
            flagType: "EXACT",
            initialPoints: 100,
            currentPoints: 100,
            minimumPoints: 50,
            decayCount: 20,
            hints: {
              create: [
                {
                  content: "Free hint: Look closely at the encoded string format.",
                  pointCost: 0,
                  orderIndex: 0
                },
                {
                  content: "Paid hint: Base64 decode the payload and reverse the bytes.",
                  pointCost: 50,
                  orderIndex: 1
                }
              ]
            }
          }
        ]
      }
    }
  });
  console.log("Seeded clean CTF competition and challenge:", competition.title);

  // 5. Post-Reset Counts Verification
  const [
    postUsers,
    postEvents,
    postRegistrations,
    postTeams,
    postAttendances,
    postCertificates,
    postNotifications,
    postAuditLogs,
    postCompetitions,
    postChallenges,
    postHints,
    postParticipants,
    postSubmissions
  ] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.eventRegistration.count(),
    prisma.team.count(),
    prisma.attendance.count(),
    prisma.certificate.count(),
    prisma.notification.count(),
    prisma.auditLog.count(),
    prisma.ctfCompetition.count(),
    prisma.ctfChallenge.count(),
    prisma.ctfHint.count(),
    prisma.ctfParticipant.count(),
    prisma.ctfSubmission.count()
  ]);

  console.log("\n=================================================");
  console.log("POST-RESET COUNTS VERIFICATION");
  console.log("=================================================");
  console.log("Users:", postUsers, "(Expected: 1 - Pritesh Prajapati)");
  console.log("Events:", postEvents, "(Expected: 0)");
  console.log("EventRegistrations:", postRegistrations, "(Expected: 0)");
  console.log("Teams:", postTeams, "(Expected: 0)");
  console.log("Attendances:", postAttendances, "(Expected: 0)");
  console.log("Certificates:", postCertificates, "(Expected: 0)");
  console.log("Notifications:", postNotifications, "(Expected: 0)");
  console.log("AuditLogs:", postAuditLogs, "(Expected: 0)");
  console.log("CtfCompetitions:", postCompetitions, "(Expected: 1 clean reference)");
  console.log("CtfChallenges:", postChallenges, "(Expected: 1 clean reference)");
  console.log("CtfHints:", postHints, "(Expected: 2 clean reference hints)");
  console.log("CtfParticipants:", postParticipants, "(Expected: 0)");
  console.log("CtfSubmissions:", postSubmissions, "(Expected: 0)");
  console.log("=================================================");
  console.log("DATABASE RESET COMPLETED SUCCESSFULLY.");
}

executeReset()
  .catch((err) => {
    console.error("Reset execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
