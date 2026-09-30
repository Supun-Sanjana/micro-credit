import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const claims = await prisma.paymentClaim.findMany({ orderBy: { submittedAt: 'desc' } });
  console.log(JSON.stringify(claims, null, 2));
}
main().finally(() => prisma.$disconnect());
