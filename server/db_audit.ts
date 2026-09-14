import prisma from "./src/lib/prisma";

async function verifyDb() {
  const url = process.env.DATABASE_URL || "";
  const safeUrl = url.replace(/:\/\/[^:]+:[^@]+@/, "://***:***@");
  const parsed = new URL(url.replace("postgresql://", "http://"));
  
  console.log("=== DATABASE CONFIGURATION (SAFE LOG) ===");
  console.log("Host:", parsed.hostname);
  console.log("Port:", parsed.port || "5432");
  console.log("Database:", parsed.pathname.replace("/", ""));
  console.log("User:", parsed.username);
  console.log("SSL Mode:", parsed.searchParams.get("sslmode"));
  console.log("Environment Mode:", process.env.NODE_ENV || "development");
  console.log("Safe Target:", safeUrl.split("?")[0]);

  const [
    users,
    events,
    registrations,
    teams,
    teamMembers,
    attendances,
    certificates,
    certificateTemplates,
    approvalRequests,
    approvalSteps,
    notifications,
    auditLogs,
    appreciations,
    badges,
    userBadges,
    clubSettings,
    oauthCodes,
    ctfCompetitions,
    ctfChallenges,
    ctfHints,
    ctfParticipants,
    ctfActivities,
    ctfSubmissions,
    ctfAuditLogs
  ] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.eventRegistration.count(),
    prisma.team.count(),
    prisma.teamMember.count(),
    prisma.attendance.count(),
    prisma.certificate.count(),
    prisma.certificateTemplate.count(),
    prisma.approvalRequest.count(),
    prisma.approvalStep.count(),
    prisma.notification.count(),
    prisma.auditLog.count(),
    prisma.appreciationPoint.count(),
    prisma.badge.count(),
    prisma.userBadge.count(),
    prisma.clubSettings.count(),
    prisma.oAuthCode.count(),
    prisma.ctfCompetition.count(),
    prisma.ctfChallenge.count(),
    prisma.ctfHint.count(),
    prisma.ctfParticipant.count(),
    prisma.ctfChallengeActivity.count(),
    prisma.ctfSubmission.count(),
    prisma.ctfAuditLog.count(),
  ]);

  console.log("\n=== COMPLETE RECORD COUNTS BEFORE RESET ===");
  console.log("Users:", users);
  console.log("Events:", events);
  console.log("EventRegistrations:", registrations);
  console.log("Teams:", teams);
  console.log("TeamMembers:", teamMembers);
  console.log("Attendances:", attendances);
  console.log("Certificates:", certificates);
  console.log("CertificateTemplates:", certificateTemplates);
  console.log("ApprovalRequests:", approvalRequests);
  console.log("ApprovalSteps:", approvalSteps);
  console.log("Notifications:", notifications);
  console.log("AuditLogs:", auditLogs);
  console.log("AppreciationPoints:", appreciations);
  console.log("Badges:", badges);
  console.log("UserBadges:", userBadges);
  console.log("ClubSettings:", clubSettings);
  console.log("OAuthCodes:", oauthCodes);
  console.log("CtfCompetitions:", ctfCompetitions);
  console.log("CtfChallenges:", ctfChallenges);
  console.log("CtfHints:", ctfHints);
  console.log("CtfParticipants:", ctfParticipants);
  console.log("CtfActivities:", ctfActivities);
  console.log("CtfSubmissions:", ctfSubmissions);
  console.log("CtfAuditLogs:", ctfAuditLogs);

  const pritesh = await prisma.user.findFirst({
    where: { email: { contains: "faculty@chakravyuhclub.com" } }
  });
  console.log("\n=== PRESERVED IDENTITY CHECK ===");
  console.log("Pritesh Prajapati Found:", pritesh ? {
    id: pritesh.id,
    email: pritesh.email,
    name: pritesh.name,
    role: pritesh.role,
    isActive: pritesh.isActive,
    isApproved: pritesh.isApproved,
    employeeId: pritesh.employeeId,
  } : "NOT FOUND");
}

verifyDb()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
