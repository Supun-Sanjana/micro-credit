const { PrismaClient } = require('./node_modules/@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const subs = await prisma.subscription.findMany({ include: { plan: { select: { name: true } } } })
  console.log('=== Subscriptions ===')
  console.log(JSON.stringify(subs, null, 2))

  const logs = await prisma.platformAdminAuditLog.findMany({ orderBy: { createdAt: 'asc' } })
  console.log('\n=== All Audit Logs ===')
  console.log(JSON.stringify(logs, null, 2))
}
main().catch(console.error).finally(() => prisma.$disconnect())
