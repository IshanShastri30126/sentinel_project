import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const hash = await bcrypt.hash("Password123!", 10);
  const user = await prisma.user.upsert({
    where: { email: "session_cert_user@charusat.edu.in" },
    update: {
      passwordHash: hash,
      isApproved: true,
      isActive: true,
      role: "MEMBER",
    },
    create: {
      email: "session_cert_user@charusat.edu.in",
      name: "Session Cert User",
      passwordHash: hash,
      role: "MEMBER",
      isApproved: true,
      isActive: true,
      phone: "9876543210",
      department: "CE",
      institute: "CSPIT",
    },
  });
  console.log("Upserted user:", user.email, "Approved:", user.isApproved);
  await prisma.$disconnect();
}

main().catch(console.error);
