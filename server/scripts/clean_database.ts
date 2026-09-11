import prisma from "../src/lib/prisma";

const PRITESH_SIR_ID = "dc32c8ee-b321-44a7-9d48-0d547244ba71";
const PRITESH_SIR_EMAIL = "faculty@chakravyuhclub.com";

async function cleanDatabase() {
  console.log("================================================================================");
  console.log("DATABASE SANITIZATION & CLEANUP PROCEDURE");
  console.log("Preserving Account: Dr. Priteshkumar Prajapati (" + PRITESH_SIR_EMAIL + ")");
  console.log("Timestamp: " + new Date().toISOString());
  console.log("================================================================================\n");

  // 1. Verify Pritesh sir's account exists
  const priteshAccount = await prisma.user.findFirst({
    where: {
      OR: [
        { id: PRITESH_SIR_ID },
        { email: PRITESH_SIR_EMAIL }
      ]
    }
  });

  if (!priteshAccount) {
    throw new Error("CRITICAL SAFETY ABORT: Could not locate Dr. Priteshkumar Prajapati's account in database.");
  }

  const verifiedPriteshId = priteshAccount.id;
  console.log("Verified Dr. Priteshkumar Prajapati Account Found:");
  console.log("  ID:        " + verifiedPriteshId);
  console.log("  Name:      " + priteshAccount.name);
  console.log("  Email:     " + priteshAccount.email);
  console.log("  Role:      " + priteshAccount.role);
  console.log("  Status:    Active=" + priteshAccount.isActive + ", Approved=" + priteshAccount.isApproved + "\n");

  // 2. Perform Cascade Cleanup in Strict Foreign-Key Order
  console.log(">>> [1/15] Purging CTF activity, submissions, hints, challenges & competitions...");
  const delCtfAct = await prisma.ctfChallengeActivity.deleteMany({});
  const delCtfSub = await prisma.ctfSubmission.deleteMany({});
  const delCtfHint = await prisma.ctfHint.deleteMany({});
  const delCtfChal = await prisma.ctfChallenge.deleteMany({});
  const delCtfPart = await prisma.ctfParticipant.deleteMany({});
  const delCtfComp = await prisma.ctfCompetition.deleteMany({});
  const delCtfAudit = await prisma.ctfAuditLog.deleteMany({});
  console.log(`    → Deleted: ${delCtfAct.count} activities, ${delCtfSub.count} submissions, ${delCtfHint.count} hints, ${delCtfChal.count} challenges, ${delCtfPart.count} participants, ${delCtfComp.count} competitions, ${delCtfAudit.count} ctf audit logs`);

  console.log(">>> [2/15] Purging OAuth codes...");
  const delOauth = await prisma.oAuthCode.deleteMany({});
  console.log(`    → Deleted: ${delOauth.count} oauth codes`);

  console.log(">>> [3/15] Purging Event Registrations...");
  const delReg = await prisma.eventRegistration.deleteMany({});
  console.log(`    → Deleted: ${delReg.count} registrations`);

  console.log(">>> [4/15] Purging Team Memberships & Teams...");
  const delTm = await prisma.teamMember.deleteMany({});
  const delTeams = await prisma.team.deleteMany({});
  console.log(`    → Deleted: ${delTm.count} team members, ${delTeams.count} teams`);

  console.log(">>> [5/15] Purging Attendance Records...");
  const delAtt = await prisma.attendance.deleteMany({});
  console.log(`    → Deleted: ${delAtt.count} attendance records`);

  console.log(">>> [6/15] Purging Certificates & Certificate Templates...");
  const delCert = await prisma.certificate.deleteMany({});
  const delTpl = await prisma.certificateTemplate.deleteMany({});
  console.log(`    → Deleted: ${delCert.count} certificates, ${delTpl.count} certificate templates`);

  console.log(">>> [7/15] Purging Appreciation Points...");
  const delPoints = await prisma.appreciationPoint.deleteMany({});
  console.log(`    → Deleted: ${delPoints.count} appreciation points`);

  console.log(">>> [8/15] Purging Events...");
  const delEvents = await prisma.event.deleteMany({});
  console.log(`    → Deleted: ${delEvents.count} events`);

  console.log(">>> [9/15] Purging User Badges & Badges...");
  const delUb = await prisma.userBadge.deleteMany({});
  const delBadges = await prisma.badge.deleteMany({});
  console.log(`    → Deleted: ${delUb.count} user badges, ${delBadges.count} badges`);

  console.log(">>> [10/15] Purging Approval Steps & Requests...");
  const delSteps = await prisma.approvalStep.deleteMany({});
  const delReqs = await prisma.approvalRequest.deleteMany({});
  console.log(`    → Deleted: ${delSteps.count} approval steps, ${delReqs.count} approval requests`);

  console.log(">>> [11/15] Purging Notifications...");
  const delNotifs = await prisma.notification.deleteMany({});
  console.log(`    → Deleted: ${delNotifs.count} notifications`);

  console.log(">>> [12/15] Purging All Audit Logs...");
  const delAudit = await prisma.auditLog.deleteMany({});
  console.log(`    → Deleted: ${delAudit.count} audit logs`);

  console.log(">>> [13/15] Purging All Users Except Dr. Priteshkumar Prajapati...");
  const delUsers = await prisma.user.deleteMany({
    where: {
      id: { not: verifiedPriteshId }
    }
  });
  console.log(`    → Deleted: ${delUsers.count} dummy/test users`);

  console.log(">>> [14/15] Re-verifying Dr. Priteshkumar Prajapati Profile State...");
  const finalPritesh = await prisma.user.findUnique({
    where: { id: verifiedPriteshId }
  });

  if (!finalPritesh) {
    throw new Error("FATAL: Pritesh sir's account was lost during deletion.");
  }

  // Ensure faculty profile fields are clean
  await prisma.user.update({
    where: { id: verifiedPriteshId },
    data: {
      isActive: true,
      isApproved: true,
      semester: null, // Semester stripped for faculty per project requirements
      studentId: "001" // Employee ID
    }
  });

  console.log("    → Account successfully preserved and updated.");

  console.log(">>> [15/15] Querying Remaining Database Counts...");
  const remainingCounts = {
    users: await prisma.user.count(),
    events: await prisma.event.count(),
    eventRegistrations: await prisma.eventRegistration.count(),
    teams: await prisma.team.count(),
    teamMembers: await prisma.teamMember.count(),
    attendance: await prisma.attendance.count(),
    certificates: await prisma.certificate.count(),
    certificateTemplates: await prisma.certificateTemplate.count(),
    appreciationPoints: await prisma.appreciationPoint.count(),
    badges: await prisma.badge.count(),
    userBadges: await prisma.userBadge.count(),
    notifications: await prisma.notification.count(),
    approvalRequests: await prisma.approvalRequest.count(),
    approvalSteps: await prisma.approvalStep.count(),
    auditLogs: await prisma.auditLog.count(),
    clubSettings: await prisma.clubSettings.count(),
    oauthCodes: await prisma.oAuthCode.count(),
    ctfCompetitions: await prisma.ctfCompetition.count(),
    ctfChallenges: await prisma.ctfChallenge.count(),
    ctfParticipants: await prisma.ctfParticipant.count(),
    ctfSubmissions: await prisma.ctfSubmission.count(),
    ctfAuditLogs: await prisma.ctfAuditLog.count()
  };

  console.log("\n================================================================================");
  console.log("FINAL POST-CLEANUP DATABASE STATE");
  console.log("================================================================================");
  console.log(JSON.stringify(remainingCounts, null, 2));

  const remainingUsers = await prisma.user.findMany();
  console.log("\nRemaining Users in Database (" + remainingUsers.length + "):");
  for (const u of remainingUsers) {
    console.log(`  - [${u.role}] ${u.name} <${u.email}> (Employee ID: ${u.studentId}, Semester: ${u.semester})`);
  }

  console.log("\nDatabase cleanup successfully completed.");
}

cleanDatabase()
  .catch((err) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
