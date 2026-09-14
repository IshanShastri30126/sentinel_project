import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' as any }
  });
  console.log(`Found ${adminUsers.length} ADMIN users.`);
  
  for (const user of adminUsers) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'FACULTY_COORDINATOR' as any }
    });
    console.log(`Updated ${user.email} to FACULTY_COORDINATOR`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
