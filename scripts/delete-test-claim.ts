import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.paymentClaim.deleteMany({
    where: { bankReference: 'BOC-123456', status: 'PENDING' }
  });
  console.log("Deleted the test claim created by the E2E script.");
}
main().finally(() => prisma.$disconnect());
