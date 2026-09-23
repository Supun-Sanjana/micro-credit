const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "MemberDocument" CASCADE;');
  console.log("Truncated MemberDocument");
}
main().finally(() => prisma.$disconnect());
