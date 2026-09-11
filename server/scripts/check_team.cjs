const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const s = await prisma.clubSettings.findUnique({ where: { key: 'LANDING_PAGE_TEAM' } });
  console.log('LANDING_PAGE_TEAM count:', Array.isArray(s?.value) ? s.value.length : 'not array');
  if (Array.isArray(s?.value)) {
    s.value.forEach((m, idx) => {
      console.log(`[${idx}] name: ${m.name}, role: ${m.role}, imageUrl: ${m.imageUrl}, avatarUrl: ${m.avatarUrl}`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
