import prisma from "../../server/src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, isApproved: true },
    take: 10,
  });
  console.log("Users in DB:");
  console.table(users);
  await prisma.$disconnect();
}

main().catch(console.error);
