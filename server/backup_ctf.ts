import prisma from "./src/lib/prisma";
import fs from "fs";

async function backup() {
  const comps = await prisma.ctfCompetition.findMany({
    include: {
      challenges: {
        include: {
          hints: true,
        },
      },
    },
  });
  fs.writeFileSync("./reference_ctf_data.json", JSON.stringify(comps, null, 2));
  console.log("Backed up", comps.length, "competitions with challenges and hints.");
}

backup()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
