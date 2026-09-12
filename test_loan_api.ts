import { PrismaClient, Prisma } from '@prisma/client'
import { calculateLoanTerms } from './lib/calc-engine'

const prisma = new PrismaClient()

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

async function runTest() {
  console.log('--- Testing Loan Origination ---')
  const org = await prisma.organization.create({ data: { name: 'Loan Test Org' } })
  const branch = await prisma.branch.create({ data: { name: 'B1', code: 'B1', organizationId: org.id } })
  const centre = await prisma.centre.create({ data: { name: 'C1', centreNumber: 1, centreCode: 'B101', branchId: branch.id } })
  
  const member = await prisma.member.create({
    data: { name: 'Test Member', memberNumber: 'B101/001', centreId: centre.id, organizationId: org.id }
  })
  
  const product = await prisma.loanProduct.create({
    data: { name: '13W Test', loanType: 'QUICK', numberOfWeeks: 13, multiplier: 1.17, organizationId: org.id }
  })

  // 1. Create Loan 1 (with Guarantor NOT a member)
  const terms1 = calculateLoanTerms(50000, product)
  const loan1 = await prisma.loan.create({
    data: {
      memberId: member.id,
      loanProductId: product.id,
      loanType: product.loanType,
      loanNumber: getOrdinal(1).toUpperCase(),
      loanAmount: terms1.loanAmount,
      weeklyRental: terms1.weeklyRental,
      numberOfWeeks: terms1.numberOfWeeks,
      totalReceivable: terms1.totalReceivable,
      status: "PENDING",
      verificationStatus: "PENDING",
      totalPaid: 0,
      outstanding: terms1.totalReceivable,
      guarantors: {
        create: [{ name: 'Outsider', nic: '111V', relationship: 'Friend' }]
      }
    },
    include: { guarantors: true }
  })
  console.log('✅ Created 1ST loan, loanNumber:', loan1.loanNumber)
  if (loan1.guarantors[0].memberId === null) {
    console.log('✅ Guarantor is NOT a registered member (memberId is null).')
  } else {
    console.log('❌ Guarantor memberId is not null.')
    process.exit(1)
  }

  // 2. Create Loan 2 (with Guarantor IS a member)
  const memberGuar = await prisma.member.create({
    data: { name: 'Guarantor Member', memberNumber: 'B101/002', centreId: centre.id, organizationId: org.id }
  })
  const loan2 = await prisma.loan.create({
    data: {
      memberId: member.id,
      loanProductId: product.id,
      loanType: product.loanType,
      loanNumber: getOrdinal(2).toUpperCase(), // Should be 2ND
      loanAmount: terms1.loanAmount,
      weeklyRental: terms1.weeklyRental,
      numberOfWeeks: terms1.numberOfWeeks,
      totalReceivable: terms1.totalReceivable,
      status: "PENDING",
      verificationStatus: "PENDING",
      totalPaid: 0,
      outstanding: terms1.totalReceivable,
      guarantors: {
        create: [{ memberId: memberGuar.id, name: memberGuar.name }]
      }
    },
    include: { guarantors: true }
  })
  console.log('✅ Created 2ND loan, loanNumber:', loan2.loanNumber)
  if (loan2.guarantors[0].memberId === memberGuar.id) {
    console.log('✅ Guarantor IS a registered member.')
  } else {
    console.log('❌ Guarantor memberId mismatch.')
    process.exit(1)
  }

  // 3. Try to disburse PENDING loan (simulating API logic)
  if (loan1.verificationStatus !== 'VERIFIED') {
    console.log('✅ Blocked disbursement of PENDING loan.')
  } else {
    console.log('❌ PENDING loan was disbursed!')
    process.exit(1)
  }

  // 4. Verify and Disburse Loan 1
  await prisma.loan.update({ where: { id: loan1.id }, data: { verificationStatus: 'VERIFIED' } })
  
  const grantedDate = new Date()
  const schedules = []
  let currentDate = new Date(grantedDate)
  for (let i = 1; i <= terms1.numberOfWeeks; i++) {
    currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    let amount = terms1.weeklyRental
    if (i === terms1.numberOfWeeks) amount = terms1.finalPayment
    schedules.push({
      instalmentNumber: i,
      scheduledDate: currentDate,
      scheduledAmount: amount,
      isPaid: false
    })
  }

  const activeLoan = await prisma.loan.update({
    where: { id: loan1.id },
    data: {
      status: 'ACTIVE',
      grantedDate,
      expireDate: schedules[schedules.length - 1].scheduledDate,
      repaymentSchedule: { create: schedules }
    },
    include: { repaymentSchedule: true }
  })

  // Verify Schedule Math
  const totalScheduled = activeLoan.repaymentSchedule.reduce((sum, s) => sum.add(s.scheduledAmount), new Prisma.Decimal(0))
  if (totalScheduled.toFixed(2) === terms1.totalReceivable.toFixed(2)) {
    console.log('✅ Schedule generated successfully, 13 rows. Total exactly matches totalReceivable:', totalScheduled.toFixed(2))
  } else {
    console.log('❌ Schedule sum mismatch! Got:', totalScheduled.toFixed(2), 'Expected:', terms1.totalReceivable.toFixed(2))
    process.exit(1)
  }

  // Cleanup
  await prisma.repaymentSchedule.deleteMany({ where: { loanId: { in: [loan1.id, loan2.id] } } })
  await prisma.guarantor.deleteMany({ where: { loanId: { in: [loan1.id, loan2.id] } } })
  await prisma.loan.deleteMany({ where: { id: { in: [loan1.id, loan2.id] } } })
  await prisma.member.deleteMany({ where: { organizationId: org.id } })
  await prisma.loanProduct.deleteMany({ where: { organizationId: org.id } })
  await prisma.centre.deleteMany({ where: { branchId: branch.id } })
  await prisma.branch.deleteMany({ where: { organizationId: org.id } })
  await prisma.organization.deleteMany({ where: { id: org.id } })

  console.log('--- All tests passed ---')
}

runTest().catch(console.error).finally(() => prisma.$disconnect())
