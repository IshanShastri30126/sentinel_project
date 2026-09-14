import prisma from "./src/lib/prisma";

async function checkCtf() {
  const comps = await prisma.ctfCompetition.findMany();
  const chs = await prisma.ctfChallenge.findMany();
  const hints = await prisma.ctfHint.findMany();
  console.log("COMPETITIONS:", JSON.stringify(comps, null, 2));
  console.log("CHALLENGES COUNT:", chs.length);
  console.log("CHALLENGES:", JSON.stringify(chs.map(c => ({ id: c.id, competitionId: c.competitionId, title: c.title, flag: c.flag, points: c.points })), null, 2));
  console.log("HINTS COUNT:", hints.length);
  console.log("HINTS:", JSON.stringify(hints, null, 2));
}

checkCtf()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
