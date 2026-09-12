import { PrismaClient } from '@prisma/client'
import { withOrgScope } from './lib/prisma'

const prisma = new PrismaClient()

async function runTest() {
  console.log('--- Testing Member NIC Isolation ---')
  
  // Create two distinct orgs
  const orgA = await prisma.organization.create({ data: { name: 'Org A' } })
  const orgB = await prisma.organization.create({ data: { name: 'Org B' } })
  
  // Create branches and centres
  const branchA = await prisma.branch.create({ data: { name: 'Branch A', code: 'BA', organizationId: orgA.id } })
  const centreA = await prisma.centre.create({ data: { name: 'Centre A', centreNumber: 1, centreCode: 'BA01', branchId: branchA.id } })

  const branchB = await prisma.branch.create({ data: { name: 'Branch B', code: 'BB', organizationId: orgB.id } })
  const centreB = await prisma.centre.create({ data: { name: 'Centre B', centreNumber: 1, centreCode: 'BB01', branchId: branchB.id } })

  // Use scoped clients
  const clientA = prisma.$extends(withOrgScope(orgA.id))
  const clientB = prisma.$extends(withOrgScope(orgB.id))

  const testNic = '123456789V'
  
  // 1. Create first member in Org A
  await clientA.member.create({
    data: {
      name: 'Alice',
      memberNumber: 'BA01/001',
      nic: testNic,
      centreId: centreA.id,
      organizationId: orgA.id
    }
  })
  console.log('✅ Created first member in Org A with NIC:', testNic)

  // 2. Try to create second member in Org A with same NIC
  // We simulate the API route's `findFirst` check
  const existingA = await clientA.member.findFirst({ where: { nic: testNic } })
  if (existingA) {
    console.log('✅ Org A successfully rejected duplicate NIC.')
  } else {
    console.log('❌ Org A failed to detect duplicate NIC.')
    process.exit(1)
  }

  // 3. Create member in Org B with the exact same NIC
  const existingB = await clientB.member.findFirst({ where: { nic: testNic } })
  if (!existingB) {
    await clientB.member.create({
      data: {
        name: 'Bob',
        memberNumber: 'BB01/001',
        nic: testNic,
        centreId: centreB.id,
        organizationId: orgB.id
      }
    })
    console.log('✅ Created member in Org B with same NIC (Isolation Works).')
  } else {
    console.log('❌ Org B incorrectly detected duplicate NIC from Org A.')
    process.exit(1)
  }

  // Cleanup
  await prisma.member.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } })
  await prisma.centre.deleteMany({ where: { branchId: { in: [branchA.id, branchB.id] } } })
  await prisma.branch.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } })
  await prisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } })

  console.log('--- All tests passed ---')
}

runTest().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(() => prisma.$disconnect())
