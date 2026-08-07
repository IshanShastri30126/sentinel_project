declare const process: any;
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Chakravyuh Club database...\n");

  const password = await bcrypt.hash("Demo@CV_$2026", 10);

  // ─── Authorized Role Accounts ONLY (Faculty Only) ─────────────────
  const seedUsers = [
    { name: "Dr. Sharma (Faculty)", email: "faculty@chakravyuhclub.com", role: "FACULTY" as Role },
  ];

  for (const u of seedUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: password, isApproved: true, isActive: true },
      create: { name: u.name, email: u.email, passwordHash: password, role: u.role, isApproved: true, isActive: true },
    });
    console.log(`  ✅ ${u.role}: ${u.email}`);
  }

  // Find all non-Faculty users for clean deletion
  const nonFacultyUsers = await prisma.user.findMany({
    where: {
      AND: [
        { email: { not: "faculty@chakravyuhclub.com" } },
        { email: { not: "faculty@charkarvyhclub.com" } },
      ],
    },
    select: { id: true },
  });

  const nonFacultyIds = nonFacultyUsers.map((u) => u.id);

  if (nonFacultyIds.length > 0) {
    await prisma.notification.deleteMany({ where: { userId: { in: nonFacultyIds } } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: nonFacultyIds } } });
    await prisma.appreciationPoint.deleteMany({
      where: { OR: [{ giverId: { in: nonFacultyIds } }, { receiverId: { in: nonFacultyIds } }] },
    });
    await prisma.userBadge.deleteMany({ where: { userId: { in: nonFacultyIds } } });
    await prisma.eventRegistration.deleteMany({ where: { userId: { in: nonFacultyIds } } });
    await prisma.teamMember.deleteMany({ where: { userId: { in: nonFacultyIds } } });
    await prisma.team.deleteMany({ where: { leaderId: { in: nonFacultyIds } } });
    await prisma.attendance.deleteMany({ where: { userId: { in: nonFacultyIds } } });
    await prisma.certificateTemplate.deleteMany({ where: { createdById: { in: nonFacultyIds } } });
    await prisma.approvalStep.deleteMany({ where: { approverId: { in: nonFacultyIds } } });
    await prisma.approvalRequest.deleteMany({ where: { requesterId: { in: nonFacultyIds } } });
    await prisma.event.deleteMany({ where: { creatorId: { in: nonFacultyIds } } });
    await prisma.user.deleteMany({ where: { id: { in: nonFacultyIds } } });
    console.log(`  🧹 Cleaned up ${nonFacultyIds.length} non-Faculty accounts and associated records.`);
  }

  // Clear LANDING_PAGE_TEAM member directory in ClubSettings
  await prisma.clubSettings.upsert({
    where: { key: "LANDING_PAGE_TEAM" },
    update: { value: [] },
    create: { key: "LANDING_PAGE_TEAM", value: [] },
  });
  console.log("  🧹 Cleaned landing page member directory.");

  // ─── Seed Badges ──────────────────────────────────────────
  const badges = [
    { name: "Bronze Star", description: "Earned 50 appreciation points", icon: "🥉", pointThreshold: 50 },
    { name: "Silver Star", description: "Earned 150 appreciation points", icon: "🥈", pointThreshold: 150 },
    { name: "Gold Star", description: "Earned 300 appreciation points", icon: "🥇", pointThreshold: 300 },
    { name: "Platinum Star", description: "Earned 500 appreciation points", icon: "💎", pointThreshold: 500 },
    { name: "Diamond Legend", description: "Earned 1000 appreciation points", icon: "👑", pointThreshold: 1000 },
  ];

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    });
    console.log(`  🏅 Badge: ${b.name} (${b.pointThreshold} pts)`);
  }

  // ─── Seed Club Settings ────────────────────────────────────
  const settings = [
    { key: "academic_year", value: { year: "2025-2026", semester: "Spring" } },
    { key: "escalation_threshold_hours", value: { hours: 48 } },
    { key: "event_categories", value: { categories: ["Workshop", "Hackathon", "Seminar", "Competition", "Social", "Technical", "Other"] } },
    { key: "point_policies", value: { maxPerEvent: 50, deductionRequiresReason: true } },
    { key: "allow_public_registration", value: { enabled: false } },
  ];

  for (const s of settings) {
    await prisma.clubSettings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
    console.log(`  ⚙️  Setting: ${s.key}`);
  }

  console.log("\n🎉 Seed complete! Authorized accounts created with secure credentials.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
