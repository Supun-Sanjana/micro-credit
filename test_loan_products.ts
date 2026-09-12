import { PrismaClient } from '@prisma/client'
import { withOrgScope } from './lib/prisma'

const prisma = new PrismaClient()

async function runTest() {
  console.log('--- Testing LoanProduct Isolation ---')
  
  // Create two distinct orgs
  const orgA = await prisma.organization.create({ data: { name: 'Org A' } })
  const orgB = await prisma.organization.create({ data: { name: 'Org B' } })
  
  // Use scoped clients
  const clientA = prisma.$extends(withOrgScope(orgA.id))
  const clientB = prisma.$extends(withOrgScope(orgB.id))
  
  // 1. Create product in Org A
  const prodA = await clientA.loanProduct.create({
    data: {
      name: 'Org A Exclusive',
      loanType: 'QUICK',
      numberOfWeeks: 13,
      multiplier: 1.17,
      organizationId: orgA.id // This is required in create
    }
  })
  console.log('✅ Created product in Org A:', prodA.id)
  
  // 2. Read products from Org B
  const productsB = await clientB.loanProduct.findMany()
  if (productsB.length === 0) {
    console.log('✅ Org B cannot see Org A products.')
  } else {
    console.log('❌ Isolation failure! Org B saw products:', productsB)
    process.exit(1)
  }
  
  // 3. Deactivate product in Org A
  const updatedA = await clientA.loanProduct.update({
    where: { id: prodA.id },
    data: { isActive: false }
  })
  if (!updatedA.isActive) {
    console.log('✅ Deactivated product in Org A.')
  } else {
    console.log('❌ Failed to deactivate product.')
    process.exit(1)
  }
  
  // 4. Try to update product from Org B (should fail)
  try {
    await clientB.loanProduct.update({
      where: { id: prodA.id },
      data: { name: 'Hacked by B' }
    })
    console.log('❌ Isolation failure! Org B modified Org A product.')
    process.exit(1)
  } catch (err: any) {
    if (err.code === 'P2025') {
      console.log('✅ Org B blocked from updating Org A product (RecordNotFound).')
    } else {
      console.log('❌ Unexpected error when Org B tried to update:', err)
      process.exit(1)
    }
  }

  // Cleanup
  await prisma.loanProduct.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } })
  await prisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } })

  console.log('--- All tests passed ---')
}

runTest().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(() => prisma.$disconnect())
