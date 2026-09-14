import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.user.updateMany({
    where: {
      email: {
        in: ['faculty@chakravyuhclub.com', 'bhatttirth18@gmail.com']
      }
    },
    data: {
      role: 'FACULTY_COORDINATOR'
    }
  });
  console.log("Roles updated successfully.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
