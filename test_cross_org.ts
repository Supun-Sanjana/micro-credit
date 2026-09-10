import { PrismaClient } from '@prisma/client'
import { withOrgScope } from './lib/prisma'
import assert from 'assert'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Setting up Cross-Org Test Data ---')
  
  // Org A (SGP - already seeded in db, but let's fetch it)
  let orgA = await prisma.organization.findFirst({ where: { name: 'Main Microfinance Org' } })
  if (!orgA) throw new Error('Org A missing')
  
  // Create Org B
  const orgB = await prisma.organization.create({ data: { name: 'Rival Microfinance Org' } })
  console.log(`Created Org B: ${orgB.name} (${orgB.id})`)

  // Create data in Org A
  const branchA = await prisma.branch.findFirst({ where: { organizationId: orgA.id } })
  if (!branchA) throw new Error('Branch A missing')
  
  const centreA = await prisma.centre.create({
    data: { name: 'Centre A', centreNumber: 101, centreCode: 'CA-101', branchId: branchA.id }
  })
  
  const memberA = await prisma.member.create({
    data: { name: 'Alice', memberNumber: 'MEM-A', centreId: centreA.id, organizationId: orgA.id }
  })
  
  // Create data in Org B
  const branchB = await prisma.branch.create({
    data: { name: 'Branch B', code: 'BB-01', organizationId: orgB.id }
  })
  const centreB = await prisma.centre.create({
    data: { name: 'Centre B', centreNumber: 201, centreCode: 'CB-201', branchId: branchB.id }
  })
  const memberB = await prisma.member.create({
    data: { name: 'Bob', memberNumber: 'MEM-B', centreId: centreB.id, organizationId: orgB.id }
  })

  console.log('--- Testing Data Isolation ---')
  
  // Simulate logging in as Org A user
  const scopedClientA = prisma.$extends(withOrgScope(orgA.id))

  // 1. Can we see Org B's Branch?
  const branchB_found = await scopedClientA.branch.findUnique({ where: { id: branchB.id } })
  assert(!branchB_found, "LEAKAGE: Org A could see Org B's Branch")

  // 2. Can we see Org B's Centre?
  const centreB_found = await scopedClientA.centre.findUnique({ where: { id: centreB.id } })
  assert(!centreB_found, "LEAKAGE: Org A could see Org B's Centre")

  // 3. Can we see Org B's Member?
  const memberB_found = await scopedClientA.member.findUnique({ where: { id: memberB.id } })
  assert(!memberB_found, "LEAKAGE: Org A could see Org B's Member")

  // 4. Can we see our OWN data?
  const branchA_found = await scopedClientA.branch.findUnique({ where: { id: branchA.id } })
  assert(branchA_found, "ERROR: Org A cannot see its own Branch")

  const centreA_found = await scopedClientA.centre.findUnique({ where: { id: centreA.id } })
  assert(centreA_found, "ERROR: Org A cannot see its own Centre")

  const memberA_found = await scopedClientA.member.findUnique({ where: { id: memberA.id } })
  assert(memberA_found, "ERROR: Org A cannot see its own Member")

  console.log('✅ Cross-org isolation tests passed! Data is strictly isolated.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
