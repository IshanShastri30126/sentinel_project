import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

const ROLES: Role[] = [
  "FACULTY_COORDINATOR",
  "STUDENT_COORDINATOR",
  "DEVELOPMENT_TEAM",
  "SOCIAL_MEDIA_COORDINATOR",
  "MEMBER",
];

async function seed() {
  const hash = await bcrypt.hash("Password123!", 10);
  const userMap: Record<string, string> = {};

  for (const role of ROLES) {
    const email = `test_${role.toLowerCase()}@charusat.edu.in`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role,
        isApproved: true,
        isActive: true,
        passwordHash: hash,
      },
      create: {
        email,
        name: `Test ${role}`,
        role,
        isApproved: true,
        isActive: true,
        passwordHash: hash,
        phone: "9876543210",
        department: "CE",
        institute: "CSPIT",
      },
    });
    userMap[role] = user.id;
    console.log(`Seeded user for ${role}: ${user.id}`);
  }

  console.log("SEEDED_USER_MAP:", JSON.stringify(userMap));
  await prisma.$disconnect();
}

seed().catch(console.error);
