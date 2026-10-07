const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const migs = await prisma.$queryRaw`SELECT migration_name FROM _prisma_migrations`;
  console.log(migs);
}
main().finally(() => prisma.$disconnect());
