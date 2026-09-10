import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const branches = await prisma.branch.findMany({
    where: {
      code: { in: ['SA01', 'SA02'] }
    }
  })

  console.log('Branches:', branches)
  if (branches.length === 2 && branches[0].organizationId === branches[1].organizationId) {
    console.log('TEST PASSED: Both branches have the same organizationId:', branches[0].organizationId)
  } else {
    console.log('TEST FAILED: Organization IDs do not match or branches not found.')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
