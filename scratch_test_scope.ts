import { PrismaClient } from '@prisma/client'
import { withOrgScope } from './lib/prisma'

const prisma = new PrismaClient({ log: ['query'] })

async function testWrapper() {
  const orgId = 'test-org-123'
  const scopedClient = prisma.$extends(withOrgScope(orgId))

  console.log('Querying members...')
  try {
    await scopedClient.member.findMany({
      where: { name: 'Sanjana' }
    })
  } catch (e) {
    console.error(e)
  }
}

testWrapper().then(() => process.exit(0))
