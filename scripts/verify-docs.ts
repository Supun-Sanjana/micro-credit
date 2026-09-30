import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const res = await prisma.memberDocument.updateMany({
    where: { status: 'PENDING' },
    data: { status: 'VERIFIED' }
  });
  console.log('Updated', res.count, 'documents');
}
main().finally(() => prisma.$disconnect());
