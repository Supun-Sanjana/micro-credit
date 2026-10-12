const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.notificationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  });
  console.log("Notification Logs in DB:", logs);
}
main().finally(() => prisma.$disconnect());
