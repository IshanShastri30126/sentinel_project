import prisma from "./src/lib/prisma";

async function main() {
  console.log("Checking and altering users table for employeeId...");
  await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employeeId" TEXT;`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "users_employeeId_key" ON "users"("employeeId");`);
  console.log("Successfully ensured employeeId column exists on users table!");
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
