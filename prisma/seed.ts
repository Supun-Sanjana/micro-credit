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

  // Create a Centre for testing
  const galleBranch = await prisma.branch.findUnique({ where: { code: 'SA01' } })
  const testCentre = await prisma.centre.upsert({
    where: { centreCode: 'PAR-TEST' },
    update: {},
    create: {
      centreNumber: 999,
      centreCode: 'PAR-TEST',
      name: 'PAR Test Centre',
      branchId: galleBranch!.id,
    }
  })

  // Create a Member for PAR testing
  const testMember = await prisma.member.upsert({
    where: { memberNumber_organizationId: { memberNumber: 'PAR-M1', organizationId: org.id } },
    update: {},
    create: {
      memberNumber: 'PAR-M1',
      name: 'PAR Test Member',
      nic: 'PAR123456789',
      centreId: testCentre.id,
      organizationId: org.id
    }
  })

  // Milestone 1 sample group. groupNumber remains on Member for backward compatibility.
  const sampleGroup = await prisma.group.upsert({
    where: { organizationId_centreId_groupNumber: { organizationId: org.id, centreId: testCentre.id, groupNumber: 1 } },
    update: { name: 'PAR Test Group' },
    create: { organizationId: org.id, branchId: galleBranch!.id, centreId: testCentre.id, groupNumber: 1, name: 'PAR Test Group', meetingDay: 'Monday' }
  })
  const membership = await prisma.groupMembership.findFirst({ where: { groupId: sampleGroup.id, memberId: testMember.id, status: 'ACTIVE' } })
  if (!membership) await prisma.groupMembership.create({ data: { groupId: sampleGroup.id, memberId: testMember.id, role: 'LEADER' } })

  // Create Loans with Missed Installments for PAR testing
  const now = new Date()
  
  // PAR 30 (Missed 40 days ago)
  const past40Days = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000)
  await prisma.loan.create({
    data: {
      memberId: testMember.id,
      loanType: 'QUICK',
      loanAmount: 10000,
      weeklyRental: 1000,
      numberOfWeeks: 10,
      totalReceivable: 10000,
      outstanding: 5000,
      status: 'ACTIVE',
      grantedDate: past40Days,
      repaymentSchedule: {
        create: [
          { instalmentNumber: 1, scheduledDate: past40Days, scheduledAmount: 1000, isPaid: false }
        ]
      }
    }
  })

  // PAR 7 (Missed 10 days ago)
  const past10Days = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
  await prisma.loan.create({
    data: {
      memberId: testMember.id,
      loanType: 'QUICK',
      loanAmount: 10000,
      weeklyRental: 1000,
      numberOfWeeks: 10,
      totalReceivable: 10000,
      outstanding: 10000,
      status: 'ACTIVE',
      grantedDate: past10Days,
      repaymentSchedule: {
        create: [
          { instalmentNumber: 1, scheduledDate: past10Days, scheduledAmount: 1000, isPaid: false }
        ]
      }
    }
  })

  // 5. Create Placeholder Subscription Plan
  const plan = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan_placeholder' },
    update: {},
    create: {
      id: 'plan_placeholder',
      name: 'Standard Tier (Placeholder)',
      maxOfficerSeats: 10,
      maxBranches: 3,
      storageQuotaMb: 5000,
      monthlyPrice: 15000.00
    }
  })
  console.log(`Upserted Subscription Plan: ${plan.name}`)

  // 6. Create Platform Admin
  const platformAdminPassword = await bcrypt.hash('supersecret123', 10)
  const platformAdmin = await prisma.platformAdmin.upsert({
    where: { email: 'super@steep.local' },
    update: { password: platformAdminPassword },
    create: {
      email: 'super@steep.local',
      password: platformAdminPassword
    }
  })
  console.log(`Upserted Platform Admin: ${platformAdmin.email}`)

  // Milestone 2 sample financial-event trail. It is idempotent and does not alter existing PAR fixtures.
  const eventLoan = await prisma.loan.findFirst({ where: { memberId: testMember.id, loanNumber: 'M2-WRITEOFF' } })
  if (!eventLoan) {
    const created = await prisma.loan.create({ data: { memberId: testMember.id, loanType: 'MICRO', loanNumber: 'M2-WRITEOFF', loanAmount: 12000, weeklyRental: 1000, numberOfWeeks: 12, totalReceivable: 12000, outstanding: 12000, status: 'DEFAULTED', grantedDate: now } })
    const writeOff = await prisma.loanWriteOff.create({ data: { organizationId: org.id, loanId: created.id, writtenOffPrincipal: 12000, writtenOffInterest: 0, reason: 'Seed demonstration write-off', approvedById: adminUser.id } })
    await prisma.writeOffRecovery.create({ data: { writeOffId: writeOff.id, amount: 500, recoveredAt: now, note: 'Seed recovery', collectedById: adminUser.id } })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
