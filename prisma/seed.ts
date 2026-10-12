import { PrismaClient, AccountType, Role, LoanType, SavingsType } from "@prisma/client"
import * as bcrypt from "bcrypt"

const prisma = new PrismaClient()

// Standard CGAP Chart of Accounts
const defaultChart = [
  // ASSETS
  { code: "1000", name: "Cash on Hand", type: AccountType.ASSET },
  { code: "1010", name: "Bank Accounts", type: AccountType.ASSET },
  { code: "1100", name: "Loan Receivable - Principal", type: AccountType.ASSET },
  { code: "1110", name: "Interest Receivable", type: AccountType.ASSET },
  { code: "1120", name: "Penalty Receivable", type: AccountType.ASSET },
  { code: "1130", name: "Fee Receivable", type: AccountType.ASSET },
  { code: "1200", name: "Allowance for Loan Losses", type: AccountType.ASSET },
  { code: "1500", name: "Fixed Assets", type: AccountType.ASSET },

  // LIABILITIES
  { code: "2000", name: "Compulsory Member Savings", type: AccountType.LIABILITY },
  { code: "2010", name: "Voluntary Member Savings", type: AccountType.LIABILITY },
  { code: "2100", name: "Accounts Payable", type: AccountType.LIABILITY },
  { code: "2200", name: "Short-term Borrowings", type: AccountType.LIABILITY },
  { code: "2300", name: "Long-term Debt", type: AccountType.LIABILITY },

  // EQUITY
  { code: "3000", name: "Paid-in Capital", type: AccountType.EQUITY },
  { code: "3100", name: "Retained Earnings", type: AccountType.EQUITY },
  { code: "3200", name: "Current Year Profit", type: AccountType.EQUITY },

  // INCOME
  { code: "4000", name: "Interest Income from Loans", type: AccountType.INCOME },
  { code: "4010", name: "Fee Income from Loans", type: AccountType.INCOME },
  { code: "4020", name: "Penalty Income from Loans", type: AccountType.INCOME },
  { code: "4100", name: "Investment Income", type: AccountType.INCOME },
  { code: "4200", name: "Other Income", type: AccountType.INCOME },

  // EXPENSES
  { code: "5000", name: "Write-Off Expense", type: AccountType.EXPENSE },
  { code: "5100", name: "Interest Expense on Borrowings", type: AccountType.EXPENSE },
  { code: "5200", name: "Interest Expense on Savings", type: AccountType.EXPENSE },
  { code: "6000", name: "Salaries and Benefits", type: AccountType.EXPENSE },
  { code: "6100", name: "Rent Expense", type: AccountType.EXPENSE },
  { code: "6200", name: "Utilities Expense", type: AccountType.EXPENSE },
  { code: "6300", name: "Other Administrative Expenses", type: AccountType.EXPENSE },
]

async function main() {
  console.log("--- Starting Database Seeding ---")

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { id: "org_main" },
    update: {},
    create: {
      id: "org_main",
      name: "Main Microfinance Org",
    },
  })
  console.log(`✓ Organization: ${org.name}`)

  // 2. Subscription Plans
  const plansToSeed = [
    { id: "plan_starter", name: "Starter", maxOfficerSeats: 3, maxBranches: 1, storageQuotaMb: 512, monthlyPrice: 7500 },
    { id: "plan_placeholder", name: "Growth", maxOfficerSeats: 10, maxBranches: 3, storageQuotaMb: 3072, monthlyPrice: 15000 },
    { id: "plan_enterprise", name: "Enterprise", maxOfficerSeats: 30, maxBranches: 10, storageQuotaMb: 10240, monthlyPrice: 35000 },
  ]
  for (const p of plansToSeed) {
    await prisma.subscriptionPlan.upsert({
      where: { id: p.id },
      update: { ...p },
      create: p,
    })
  }
  console.log("✓ Subscription Plans seeded")

  // 3. Active Enterprise Subscription for Organization
  const nextYear = new Date()
  nextYear.setFullYear(nextYear.getFullYear() + 1)
  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    update: {
      status: "ACTIVE",
      planId: "plan_enterprise",
      currentPeriodEnd: nextYear,
    },
    create: {
      organizationId: org.id,
      planId: "plan_enterprise",
      status: "ACTIVE",
      currentPeriodEnd: nextYear,
    },
  })
  console.log("✓ Active Subscription configured")

  // 4. Create Branches (Galle - SA01, Matara - SA02)
  const branchGalle = await prisma.branch.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "SA01" } },
    update: { name: "GALLE" },
    create: {
      code: "SA01",
      name: "GALLE",
      organizationId: org.id,
      address: "No. 45, Main Street, Galle",
    },
  })
  const branchMatara = await prisma.branch.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "SA02" } },
    update: { name: "MATARA" },
    create: {
      code: "SA02",
      name: "MATARA",
      organizationId: org.id,
      address: "No. 12, Anagarika Dharmapala Mw, Matara",
    },
  })
  console.log("✓ Branches: Galle (SA01), Matara (SA02)")

  // 5. Create System Users
  const defaultPassword = await bcrypt.hash("admin123", 10)
  const usersToSeed = [
    { email: "admin@micro.local", name: "System Admin", role: "SYSTEM_ADMIN" as Role, branchId: branchGalle.id },
    { email: "manager@micro.local", name: "Sunil Perera (BM)", role: "BRANCH_MANAGER" as Role, branchId: branchGalle.id },
    { email: "officer@micro.local", name: "Kamal Silva (FO)", role: "FIELD_OFFICER" as Role, branchId: branchGalle.id },
    { email: "accountant@micro.local", name: "Nimali Fernando (Acc)", role: "ACCOUNTANT" as Role, branchId: branchGalle.id },
    { email: "headoffice@micro.local", name: "Ranil Wickrama (HO)", role: "HEAD_OFFICER" as any, branchId: null },
  ]

  const seededUsers: Record<string, any> = {}
  for (const u of usersToSeed) {
    const roleValue = u.role === ("HEAD_OFFICER" as any) ? ("HEAD_OFFICE" as Role) : u.role
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        password: defaultPassword,
        role: roleValue,
        organizationId: org.id,
        branchId: u.branchId,
        isActive: true,
      },
      create: {
        email: u.email,
        name: u.name,
        password: defaultPassword,
        role: roleValue,
        organizationId: org.id,
        branchId: u.branchId,
        isActive: true,
      },
    })
    seededUsers[u.email] = user
  }
  console.log("✓ Users seeded: admin@micro.local, manager@micro.local, officer@micro.local, accountant@micro.local")

  // Platform Admin
  const platformAdminPassword = await bcrypt.hash("supersecret123", 10)
  await prisma.platformAdmin.upsert({
    where: { email: "super@steep.local" },
    update: { password: platformAdminPassword },
    create: {
      email: "super@steep.local",
      password: platformAdminPassword,
    },
  })
  console.log("✓ Platform Admin: super@steep.local")

  // 6. Chart of Accounts
  for (const account of defaultChart) {
    await prisma.chartOfAccount.upsert({
      where: {
        organizationId_code: {
          organizationId: org.id,
          code: account.code,
        },
      },
      update: { name: account.name, type: account.type, isActive: true },
      create: {
        organizationId: org.id,
        code: account.code,
        name: account.name,
        type: account.type,
        isActive: true,
      },
    })
  }
  console.log("✓ Chart of Accounts seeded (28 accounts)")

  // 7. Loan Products
  const products = [
    { name: "Quick 13W", loanType: "QUICK" as LoanType, numberOfWeeks: 13, multiplier: 1.17 },
    { name: "Business 18W", loanType: "BUSINESS" as LoanType, numberOfWeeks: 18, multiplier: 1.17 },
    { name: "Micro 24W", loanType: "MICRO" as LoanType, numberOfWeeks: 24, multiplier: 1.20 },
  ]
  const seededProducts: Record<string, any> = {}
  for (const p of products) {
    const product = await prisma.loanProduct.upsert({
      where: { name_organizationId: { name: p.name, organizationId: org.id } },
      update: {},
      create: { ...p, organizationId: org.id },
    })
    seededProducts[p.name] = product
  }
  console.log("✓ Loan Products: Quick 13W, Business 18W, Micro 24W")

  // 8. Savings Products
  const compSavings = await prisma.savingsProduct.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "SAV-COMP" } },
    update: {},
    create: {
      name: "Compulsory Member Savings",
      code: "SAV-COMP",
      type: "COMPULSORY" as SavingsType,
      interestRate: 4.0,
      minimumBalance: 500,
      isActive: true,
      organizationId: org.id,
    },
  })
  const volSavings = await prisma.savingsProduct.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "SAV-VOL" } },
    update: {},
    create: {
      name: "Voluntary Member Savings",
      code: "SAV-VOL",
      type: "VOLUNTARY" as SavingsType,
      interestRate: 6.5,
      minimumBalance: 1000,
      isActive: true,
      organizationId: org.id,
    },
  })
  console.log("✓ Savings Products seeded")

  // 9. Centres
  const fieldOfficer = seededUsers["officer@micro.local"]

  const centreSamagi = await prisma.centre.upsert({
    where: { branchId_centreCode: { branchId: branchGalle.id, centreCode: "SA01-C01" } },
    update: { officerId: fieldOfficer.id },
    create: {
      centreNumber: 101,
      centreCode: "SA01-C01",
      name: "Samagi Centre",
      branchId: branchGalle.id,
      officerId: fieldOfficer.id,
    },
  })

  const centreSuhada = await prisma.centre.upsert({
    where: { branchId_centreCode: { branchId: branchGalle.id, centreCode: "SA01-C02" } },
    update: { officerId: fieldOfficer.id },
    create: {
      centreNumber: 102,
      centreCode: "SA01-C02",
      name: "Suhada Centre",
      branchId: branchGalle.id,
      officerId: fieldOfficer.id,
    },
  })

  const centreNilwala = await prisma.centre.upsert({
    where: { branchId_centreCode: { branchId: branchMatara.id, centreCode: "SA02-C01" } },
    update: {},
    create: {
      centreNumber: 201,
      centreCode: "SA02-C01",
      name: "Nilwala Centre",
      branchId: branchMatara.id,
    },
  })
  console.log("✓ Centres: Samagi, Suhada, Nilwala")

  // 10. Field Officer Assignments
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.fieldOfficerAssignment.upsert({
    where: {
      officerId_centreId_isActive: {
        officerId: fieldOfficer.id,
        centreId: centreSamagi.id,
        isActive: true,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branchGalle.id,
      officerId: fieldOfficer.id,
      centreId: centreSamagi.id,
      startDate: today,
      isActive: true,
    },
  })

  await prisma.fieldOfficerAssignment.upsert({
    where: {
      officerId_centreId_isActive: {
        officerId: fieldOfficer.id,
        centreId: centreSuhada.id,
        isActive: true,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branchGalle.id,
      officerId: fieldOfficer.id,
      centreId: centreSuhada.id,
      startDate: today,
      isActive: true,
    },
  })
  console.log("✓ Field Officer Assignments assigned to officer@micro.local")

  // 11. Groups
  const group1 = await prisma.group.upsert({
    where: { organizationId_centreId_groupNumber: { organizationId: org.id, centreId: centreSamagi.id, groupNumber: 1 } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branchGalle.id,
      centreId: centreSamagi.id,
      groupNumber: 1,
      name: "Ekatawa Group",
      meetingDay: "Monday",
    },
  })

  const group2 = await prisma.group.upsert({
    where: { organizationId_centreId_groupNumber: { organizationId: org.id, centreId: centreSamagi.id, groupNumber: 2 } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branchGalle.id,
      centreId: centreSamagi.id,
      groupNumber: 2,
      name: "Pragathi Group",
      meetingDay: "Tuesday",
    },
  })

  const group3 = await prisma.group.upsert({
    where: { organizationId_centreId_groupNumber: { organizationId: org.id, centreId: centreSuhada.id, groupNumber: 1 } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branchGalle.id,
      centreId: centreSuhada.id,
      groupNumber: 1,
      name: "Sahana Group",
      meetingDay: "Wednesday",
    },
  })

  // 12. Members
  const sampleMembersData = [
    { number: "M-001", name: "Kasun Jayawardena", nic: "198512345678", phone: "0771234567", centre: centreSamagi, group: group1, address: "14, Temple Rd, Galle" },
    { number: "M-002", name: "Anula Kumari", nic: "198856789012", phone: "0712345678", centre: centreSamagi, group: group1, address: "22, Beach Rd, Galle" },
    { number: "M-003", name: "Priyantha Bandara", nic: "199023456789", phone: "0753456789", centre: centreSamagi, group: group2, address: "8, Station Rd, Galle" },
    { number: "M-004", name: "Malini Wickramasinghe", nic: "198267890123", phone: "0764567890", centre: centreSamagi, group: group2, address: "35, Galle Fort, Galle" },
    { number: "M-005", name: "Chathura Senanayake", nic: "199334567890", phone: "0785678901", centre: centreSuhada, group: group3, address: "50, Post Office Rd, Galle" },
    { number: "M-006", name: "Dilani Perera", nic: "199178901234", phone: "0726789012", centre: centreSuhada, group: group3, address: "19, Circular Rd, Galle" },
  ]

  const seededMembers: Record<string, any> = {}
  for (const m of sampleMembersData) {
    const member = await prisma.member.upsert({
      where: { memberNumber_organizationId: { memberNumber: m.number, organizationId: org.id } },
      update: { name: m.name, nic: m.nic, contact1: m.phone, address: m.address },
      create: {
        memberNumber: m.number,
        name: m.name,
        nic: m.nic,
        contact1: m.phone,
        address: m.address,
        centreId: m.centre.id,
        groupNumber: m.group.groupNumber,
        organizationId: org.id,
      },
    })
    seededMembers[m.number] = member

    // Group membership
    const membership = await prisma.groupMembership.findFirst({
      where: { groupId: m.group.id, memberId: member.id },
    })
    if (!membership) {
      await prisma.groupMembership.create({
        data: { groupId: m.group.id, memberId: member.id, role: "MEMBER" },
      })
    }

    // Savings Account
    await prisma.savingsAccount.upsert({
      where: { organizationId_accountNumber: { organizationId: org.id, accountNumber: `SAV-${m.number}` } },
      update: {},
      create: {
        accountNumber: `SAV-${m.number}`,
        memberId: member.id,
        savingsProductId: compSavings.id,
        balance: 3500.0,
        status: "ACTIVE",
        organizationId: org.id,
      },
    })
  }
  console.log("✓ Members & Savings Accounts seeded (6 active members)")

  // 13. Active Loans and Schedules
  // Loan 1: Kasun Jayawardena (Quick 13W, granted 4 weeks ago)
  const m1 = seededMembers["M-001"]
  const fourWeeksAgo = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000)
  const existingLoan1 = await prisma.loan.findFirst({ where: { memberId: m1.id, loanNumber: "LN-2026-001" } })

  if (!existingLoan1) {
    const loan1 = await prisma.loan.create({
      data: {
        memberId: m1.id,
        loanProductId: seededProducts["Quick 13W"].id,
        loanType: "QUICK",
        loanNumber: "LN-2026-001",
        loanAmount: 30000,
        weeklyRental: 2700,
        numberOfWeeks: 13,
        totalReceivable: 35100,
        totalPaid: 10800,
        outstanding: 24300,
        status: "ACTIVE",
        grantedDate: fourWeeksAgo,
      },
    })

    // Repayment schedule: 4 paid, 1 due today, 8 future
    for (let w = 1; w <= 13; w++) {
      const scheduledDate = new Date(fourWeeksAgo.getTime() + w * 7 * 24 * 60 * 60 * 1000)
      const isPaid = w <= 4
      await prisma.repaymentSchedule.create({
        data: {
          loanId: loan1.id,
          instalmentNumber: w,
          scheduledDate,
          scheduledAmount: 2700,
          isPaid,
          paidAmount: isPaid ? 2700 : 0,
        },
      })

      if (isPaid) {
        await prisma.loanRepayment.create({
          data: {
            organizationId: org.id,
            loanId: loan1.id,
            instalmentNumber: w,
            scheduledDate,
            paidDate: scheduledDate,
            amount: 2700,
            method: "CASH",
            note: `RCP-100${w}`,
            collectedBy: fieldOfficer.id,
          },
        })
      }
    }
  }

  // Loan 2: Anula Kumari (Business 18W, granted 6 weeks ago, paid instalment today!)
  const m2 = seededMembers["M-002"]
  const sixWeeksAgo = new Date(today.getTime() - 42 * 24 * 60 * 60 * 1000)
  const existingLoan2 = await prisma.loan.findFirst({ where: { memberId: m2.id, loanNumber: "LN-2026-002" } })

  if (!existingLoan2) {
    const loan2 = await prisma.loan.create({
      data: {
        memberId: m2.id,
        loanProductId: seededProducts["Business 18W"].id,
        loanType: "BUSINESS",
        loanNumber: "LN-2026-002",
        loanAmount: 50000,
        weeklyRental: 3250,
        numberOfWeeks: 18,
        totalReceivable: 58500,
        totalPaid: 19500,
        outstanding: 39000,
        status: "ACTIVE",
        grantedDate: sixWeeksAgo,
      },
    })

    for (let w = 1; w <= 18; w++) {
      const scheduledDate = new Date(sixWeeksAgo.getTime() + w * 7 * 24 * 60 * 60 * 1000)
      const isPaid = w <= 6
      await prisma.repaymentSchedule.create({
        data: {
          loanId: loan2.id,
          instalmentNumber: w,
          scheduledDate,
          scheduledAmount: 3250,
          isPaid,
          paidAmount: isPaid ? 3250 : 0,
        },
      })

      if (isPaid) {
        const paidDate = w === 6 ? today : scheduledDate
        await prisma.loanRepayment.create({
          data: {
            organizationId: org.id,
            loanId: loan2.id,
            instalmentNumber: w,
            scheduledDate,
            paidDate,
            amount: 3250,
            method: "CASH",
            note: `RCP-200${w}`,
            collectedBy: fieldOfficer.id,
          },
        })
      }
    }
  }

  // Loan 3: Priyantha Bandara (Quick 13W, overdue instalment for PAR tracking)
  const m3 = seededMembers["M-003"]
  const threeWeeksAgo = new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000)
  const existingLoan3 = await prisma.loan.findFirst({ where: { memberId: m3.id, loanNumber: "LN-2026-003" } })

  if (!existingLoan3) {
    const loan3 = await prisma.loan.create({
      data: {
        memberId: m3.id,
        loanProductId: seededProducts["Quick 13W"].id,
        loanType: "QUICK",
        loanNumber: "LN-2026-003",
        loanAmount: 20000,
        weeklyRental: 1800,
        numberOfWeeks: 13,
        totalReceivable: 23400,
        totalPaid: 1800,
        outstanding: 21600,
        status: "ACTIVE",
        grantedDate: threeWeeksAgo,
      },
    })

    for (let w = 1; w <= 13; w++) {
      const scheduledDate = new Date(threeWeeksAgo.getTime() + w * 7 * 24 * 60 * 60 * 1000)
      const isPaid = w === 1
      await prisma.repaymentSchedule.create({
        data: {
          loanId: loan3.id,
          instalmentNumber: w,
          scheduledDate,
          scheduledAmount: 1800,
          isPaid,
          paidAmount: isPaid ? 1800 : 0,
        },
      })
      if (isPaid) {
        await prisma.loanRepayment.create({
          data: {
            organizationId: org.id,
            loanId: loan3.id,
            instalmentNumber: w,
            scheduledDate,
            paidDate: scheduledDate,
            amount: 1800,
            method: "CASH",
            note: `RCP-3001`,
            collectedBy: fieldOfficer.id,
          },
        })
      }
    }
  }

  // Loan 4: Malini Wickramasinghe (Micro 24W, granted 10 weeks ago with historical payments)
  const m4 = seededMembers["M-004"]
  const tenWeeksAgo = new Date(today.getTime() - 70 * 24 * 60 * 60 * 1000)
  const existingLoan4 = await prisma.loan.findFirst({ where: { memberId: m4.id, loanNumber: "LN-2026-004" } })

  if (!existingLoan4) {
    const loan4 = await prisma.loan.create({
      data: {
        memberId: m4.id,
        loanProductId: seededProducts["Micro 24W"].id,
        loanType: "MICRO",
        loanNumber: "LN-2026-004",
        loanAmount: 40000,
        weeklyRental: 2000,
        numberOfWeeks: 24,
        totalReceivable: 48000,
        totalPaid: 16000,
        outstanding: 32000,
        status: "ACTIVE",
        grantedDate: tenWeeksAgo,
      },
    })

    for (let w = 1; w <= 24; w++) {
      const scheduledDate = new Date(tenWeeksAgo.getTime() + w * 7 * 24 * 60 * 60 * 1000)
      const isPaid = w <= 8
      await prisma.repaymentSchedule.create({
        data: {
          loanId: loan4.id,
          instalmentNumber: w,
          scheduledDate,
          scheduledAmount: 2000,
          isPaid,
          paidAmount: isPaid ? 2000 : 0,
        },
      })
      if (isPaid) {
        await prisma.loanRepayment.create({
          data: {
            organizationId: org.id,
            loanId: loan4.id,
            instalmentNumber: w,
            scheduledDate,
            paidDate: scheduledDate,
            amount: 2000,
            method: "CASH",
            note: `RCP-400${w}`,
            collectedBy: fieldOfficer.id,
          },
        })
      }
    }
  }

  console.log("✓ Loans, schedules & historical repayments seeded")

  // 14. Audit Logs
  const auditLogsCount = await prisma.auditLog.count({ where: { organizationId: org.id } })
  if (auditLogsCount === 0) {
    await prisma.auditLog.createMany({
      data: [
        {
          organizationId: org.id,
          userId: seededUsers["admin@micro.local"].id,
          action: "CREATE",
          entityType: "ORGANIZATION",
          entityId: org.id,
          note: "Organization profile initialized",
          createdAt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          organizationId: org.id,
          userId: seededUsers["manager@micro.local"].id,
          action: "CREATE",
          entityType: "LOAN_PRODUCT",
          entityId: seededProducts["Quick 13W"].id,
          note: "Loan Product Quick 13W created",
          createdAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000),
        },
        {
          organizationId: org.id,
          userId: fieldOfficer.id,
          action: "CREATE",
          entityType: "MEMBER",
          entityId: m1.id,
          note: "Registered new member Kasun Jayawardena",
          createdAt: fourWeeksAgo,
        },
      ],
    })
    console.log("✓ Initial Audit Logs seeded")
  }

  // 15. PAR Testing Fixtures (Preserved for automated unit/e2e test compatibility)
  const galleBranch = await prisma.branch.findFirst({ where: { code: "SA01", organizationId: org.id } })
  const testCentre = await prisma.centre.upsert({
    where: { branchId_centreCode: { branchId: galleBranch!.id, centreCode: "PAR-TEST" } },
    update: {},
    create: {
      centreNumber: 999,
      centreCode: "PAR-TEST",
      name: "PAR Test Centre",
      branchId: galleBranch!.id,
    },
  })

  const testMember = await prisma.member.upsert({
    where: { memberNumber_organizationId: { memberNumber: "PAR-M1", organizationId: org.id } },
    update: {},
    create: {
      memberNumber: "PAR-M1",
      name: "PAR Test Member",
      nic: "PAR123456789",
      centreId: testCentre.id,
      organizationId: org.id,
    },
  })

  const sampleGroup = await prisma.group.upsert({
    where: { organizationId_centreId_groupNumber: { organizationId: org.id, centreId: testCentre.id, groupNumber: 1 } },
    update: { name: "PAR Test Group" },
    create: {
      organizationId: org.id,
      branchId: galleBranch!.id,
      centreId: testCentre.id,
      groupNumber: 1,
      name: "PAR Test Group",
      meetingDay: "Monday",
    },
  })
  const membership = await prisma.groupMembership.findFirst({
    where: { groupId: sampleGroup.id, memberId: testMember.id, status: "ACTIVE" },
  })
  if (!membership) {
    await prisma.groupMembership.create({
      data: { groupId: sampleGroup.id, memberId: testMember.id, role: "LEADER" },
    })
  }

  // PAR 30 (Missed 40 days ago)
  const past40Days = new Date(today.getTime() - 40 * 24 * 60 * 60 * 1000)
  const existingPar30 = await prisma.loan.findFirst({ where: { memberId: testMember.id, loanAmount: 10000, outstanding: 5000 } })
  if (!existingPar30) {
    await prisma.loan.create({
      data: {
        memberId: testMember.id,
        loanType: "QUICK",
        loanAmount: 10000,
        weeklyRental: 1000,
        numberOfWeeks: 10,
        totalReceivable: 10000,
        outstanding: 5000,
        status: "ACTIVE",
        grantedDate: past40Days,
        repaymentSchedule: {
          create: [{ instalmentNumber: 1, scheduledDate: past40Days, scheduledAmount: 1000, isPaid: false }],
        },
      },
    })
  }

  // Milestone 2 sample write-off fixture
  const eventLoan = await prisma.loan.findFirst({ where: { memberId: testMember.id, loanNumber: "M2-WRITEOFF" } })
  if (!eventLoan) {
    const adminUser = seededUsers["admin@micro.local"]
    const created = await prisma.loan.create({
      data: {
        memberId: testMember.id,
        loanType: "MICRO",
        loanNumber: "M2-WRITEOFF",
        loanAmount: 12000,
        weeklyRental: 1000,
        numberOfWeeks: 12,
        totalReceivable: 12000,
        outstanding: 12000,
        status: "DEFAULTED",
        grantedDate: today,
      },
    })
    const writeOff = await prisma.loanWriteOff.create({
      data: {
        organizationId: org.id,
        loanId: created.id,
        writtenOffPrincipal: 12000,
        writtenOffInterest: 0,
        reason: "Seed demonstration write-off",
        approvedById: adminUser.id,
      },
    })
    await prisma.writeOffRecovery.create({
      data: {
        writeOffId: writeOff.id,
        amount: 500,
        recoveredAt: today,
        note: "Seed recovery",
        collectedById: adminUser.id,
      },
    })
  }

  console.log("✓ PAR and Milestone 2 test fixtures preserved")
  console.log("--- Seeding Completed Successfully! ---")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
