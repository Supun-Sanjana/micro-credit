import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function runTest() {
  console.log('--- Testing Repayment Collection ---')
  const org = await prisma.organization.create({ data: { name: 'Repayment Org' } })
  const branch = await prisma.branch.create({ data: { name: 'B1', code: 'B1', organizationId: org.id } })
  const centre = await prisma.centre.create({ data: { name: 'C1', centreNumber: 1, centreCode: 'B101', branchId: branch.id } })
  
  const member = await prisma.member.create({
    data: { name: 'Test Member', memberNumber: 'B101/001', centreId: centre.id, organizationId: org.id }
  })
  
  const product = await prisma.loanProduct.create({
    data: { name: '4W Test', loanType: 'QUICK', numberOfWeeks: 4, multiplier: 1.0, organizationId: org.id }
  })

  // Create an ACTIVE loan with 4 schedules
  const loanAmount = 4000
  const weekly = 1000
  const grantedDate = new Date('2026-09-01T00:00:00Z')

  const loan = await prisma.loan.create({
    data: {
      memberId: member.id,
      loanProductId: product.id,
      loanType: product.loanType,
      loanNumber: '1ST',
      loanAmount: loanAmount,
      weeklyRental: weekly,
      numberOfWeeks: 4,
      totalReceivable: loanAmount, // multiplier 1.0
      status: "ACTIVE",
      verificationStatus: "VERIFIED",
      totalPaid: 0,
      outstanding: loanAmount,
      grantedDate: grantedDate,
      repaymentSchedule: {
        create: [
          { instalmentNumber: 1, scheduledDate: new Date('2026-09-08T00:00:00Z'), scheduledAmount: weekly, isPaid: false },
          { instalmentNumber: 2, scheduledDate: new Date('2026-09-15T00:00:00Z'), scheduledAmount: weekly, isPaid: false },
          { instalmentNumber: 3, scheduledDate: new Date('2026-09-22T00:00:00Z'), scheduledAmount: weekly, isPaid: false },
          { instalmentNumber: 4, scheduledDate: new Date('2026-09-29T00:00:00Z'), scheduledAmount: weekly, isPaid: false },
        ]
      }
    },
    include: { repaymentSchedule: { orderBy: { instalmentNumber: 'asc' } } }
  })

  // We have 4 schedules.
  // We simulate a POST request to our logic.
  
  const simulatePayment = async (amount: number, scheduleId?: string) => {
    return await prisma.$transaction(async (tx) => {
      const dbLoan = await tx.loan.findUnique({
        where: { id: loan.id },
        include: { repaymentSchedule: { where: { isPaid: false }, orderBy: { instalmentNumber: 'asc' } } }
      })

      const payAmount = new Prisma.Decimal(amount)
      
      const newTotalPaid = dbLoan!.totalPaid.add(payAmount)
      const newOutstanding = dbLoan!.totalReceivable.minus(newTotalPaid)
      let newStatus = dbLoan!.status
      if (newOutstanding.lte(0)) {
        newStatus = 'SETTLED'
      }

      await tx.loan.update({
        where: { id: loan.id },
        data: { totalPaid: newTotalPaid, outstanding: newOutstanding, status: newStatus }
      })

      await tx.loanRepayment.create({
        data: { loanId: loan.id, amount: payAmount, paidDate: new Date() }
      })

      let remainingToAllocate = payAmount
      for (const s of dbLoan!.repaymentSchedule) {
        if (remainingToAllocate.lte(0)) break
        if (remainingToAllocate.gte(s.scheduledAmount)) {
          await tx.repaymentSchedule.update({ where: { id: s.id }, data: { isPaid: true } })
          remainingToAllocate = remainingToAllocate.minus(s.scheduledAmount)
        } else {
          break
        }
      }
    })
  }

  // 1. Partial/Single Payment (1000)
  await simulatePayment(1000, loan.repaymentSchedule[0].id)
  
  let updatedLoan = await prisma.loan.findUnique({
    where: { id: loan.id },
    include: { repaymentSchedule: { orderBy: { instalmentNumber: 'asc' } } }
  })
  
  if (updatedLoan?.outstanding.toNumber() === 3000 && updatedLoan.totalPaid.toNumber() === 1000) {
    console.log('✅ Single payment updated outstanding/totalPaid.')
  } else {
    console.log('❌ Single payment failed.', updatedLoan)
    process.exit(1)
  }

  if (updatedLoan.repaymentSchedule[0].isPaid === true && updatedLoan.repaymentSchedule[1].isPaid === false) {
    console.log('✅ Schedule 1 marked paid.')
  } else {
    console.log('❌ Schedule 1 not marked paid.')
    process.exit(1)
  }

  // 2. Lump-Sum Payment (3000) -> Should settle
  await simulatePayment(3000)

  updatedLoan = await prisma.loan.findUnique({
    where: { id: loan.id },
    include: { repaymentSchedule: { orderBy: { instalmentNumber: 'asc' } } }
  })

  if (updatedLoan?.outstanding.toNumber() === 0 && updatedLoan.status === 'SETTLED') {
    console.log('✅ Lump-sum flipped status to SETTLED and outstanding to 0.')
  } else {
    console.log('❌ Lump-sum failed to settle.', updatedLoan)
    process.exit(1)
  }

  if (updatedLoan.repaymentSchedule[1].isPaid && updatedLoan.repaymentSchedule[2].isPaid && updatedLoan.repaymentSchedule[3].isPaid) {
    console.log('✅ All remaining schedules marked as PAID.')
  } else {
    console.log('❌ Remaining schedules not marked paid.', updatedLoan.repaymentSchedule)
    process.exit(1)
  }

  // Cleanup
  await prisma.loanRepayment.deleteMany({ where: { loanId: loan.id } })
  await prisma.repaymentSchedule.deleteMany({ where: { loanId: loan.id } })
  await prisma.loan.deleteMany({ where: { id: loan.id } })
  await prisma.member.deleteMany({ where: { id: member.id } })
  await prisma.loanProduct.deleteMany({ where: { id: product.id } })
  await prisma.centre.deleteMany({ where: { id: centre.id } })
  await prisma.branch.deleteMany({ where: { id: branch.id } })
  await prisma.organization.deleteMany({ where: { id: org.id } })

  console.log('--- All tests passed ---')
}

runTest().catch(console.error).finally(() => prisma.$disconnect())
