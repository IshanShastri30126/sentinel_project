const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
  });
  console.log('Total users:', users.length);
  users.forEach(u => {
    console.log(`User: ${u.name} (${u.role}) -> avatarUrl: "${u.avatarUrl}"`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
