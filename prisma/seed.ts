import { PrismaClient } from "@prisma/client"
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient({} as any)

async function main() {
  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { id: 'org_main' }, // Using a fixed ID or finding by first
    update: {},
    create: {
      id: 'org_main',
      name: 'Main Microfinance Org',
    },
  })

  console.log(`Upserted Organization: ${org.name}`)

  // 2. Create Branches (Galle - SA01, Matara - SA02)
  const branches = [
    {
      code: 'SA01',
      name: 'GALLE',
      organizationId: org.id,
    },
    {
      code: 'SA02',
      name: 'MATARA',
      organizationId: org.id,
    }
  ]

  for (const b of branches) {
    const branch = await prisma.branch.upsert({
      where: { code: b.code },
      update: { organizationId: org.id },
      create: b,
    })
    console.log(`Upserted Branch: ${branch.name} (${branch.code})`)
  }

  // 3. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@micro.local' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      organizationId: org.id
    },
    create: {
      email: 'admin@micro.local',
      name: 'System Admin',
      password: adminPassword,
      role: 'ADMIN',
      organizationId: org.id
    }
  })

  console.log(`Upserted Admin User: ${adminUser.email}`)

  // 4. Create Loan Products (SGP's 3 Tiers)
  const products = [
    { name: 'Quick 13W', loanType: 'QUICK', numberOfWeeks: 13, multiplier: 1.17 },
    { name: 'Business 18W', loanType: 'BUSINESS', numberOfWeeks: 18, multiplier: 1.17 },
    { name: 'Micro 24W', loanType: 'MICRO', numberOfWeeks: 24, multiplier: 1.20 } // Just a guess for Micro 24W, 20%
  ] as const

  for (const p of products) {
    const product = await prisma.loanProduct.upsert({
      where: { name_organizationId: { name: p.name, organizationId: org.id } },
      update: {},
      create: { ...p, organizationId: org.id }
    })
    console.log(`Upserted Loan Product: ${product.name}`)
  }

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
