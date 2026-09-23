import { PrismaClient } from "@prisma/client"
import { calculateCreditScore } from "./credit-engine"

const prisma = new PrismaClient()

export async function runCreditAssessment(memberId: string, organizationId: string, loanId?: string, createdById?: string) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      loans: {
        include: { repaymentSchedule: true, repayments: true }
      },
      financialProfiles: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  if (!member) throw new Error("Member not found")

  const fp = member.financialProfiles[0]

  const totalLoans = member.loans.length
  const activeLoans = member.loans.filter((l) => ['ACTIVE', 'PENDING', 'APPROVED', 'DISBURSED', 'OVERDUE'].includes(l.status)).length
  const settledLoans = member.loans.filter((l) => l.status === 'SETTLED').length
  const defaultedLoans = member.loans.filter((l) => l.status === 'DEFAULTED').length

  let settledPaid = 0
  let settledReceivable = 0
  let hasOverdueLoan30Days = false
  let currentOutstanding = 0
  let weeklyRentalOutstanding = 0

  for (const l of member.loans) {
    if (l.status === 'SETTLED') {
      settledPaid += Number(l.totalPaid)
      settledReceivable += Number(l.totalReceivable)
    } else if (['ACTIVE', 'OVERDUE'].includes(l.status)) {
      currentOutstanding += Number(l.outstanding)
      weeklyRentalOutstanding += Number(l.weeklyRental)

      const overdueSchedules = l.repaymentSchedule.filter((s) => 
        !s.isPaid && s.scheduledDate < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      )
      if (overdueSchedules.length > 0) {
        hasOverdueLoan30Days = true
      }
    }
  }

  let onTimeStreak = 0
  const allRepayments = member.loans.flatMap((l) => l.repayments).sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime())
  for (const r of allRepayments) {
    if (r.scheduledDate && new Date(r.paidDate) <= new Date(r.scheduledDate)) {
      onTimeStreak++
    } else {
      break
    }
  }

  const input = {
    totalLoans,
    activeLoans,
    settledLoans,
    defaultedLoans,
    settledPaid,
    settledReceivable,
    hasOverdueLoan30Days,
    monthlyIncome: fp ? Number(fp.monthlyIncome) : 0,
    householdIncome: fp ? Number(fp.householdIncome || 0) : 0,
    existingObligations: fp ? Number(fp.existingObligations) : 0,
    currentOutstanding,
    weeklyRentalOutstanding,
    onTimeStreak
  }

  const result = calculateCreditScore(input)

  return await prisma.creditAssessment.create({
    data: {
      organizationId,
      memberId,
      financialProfileId: fp?.id,
      loanId,
      score: result.score,
      grade: result.grade,
      factors: result.factors,
      inputs: result.inputs,
      totalLoans: result.computed.totalLoans,
      activeLoans: result.computed.activeLoans,
      settledLoans: result.computed.settledLoans,
      defaultedLoans: result.computed.defaultedLoans,
      repaymentRate: result.computed.repaymentRate,
      averageDaysLate: result.computed.averageDaysLate,
      currentOutstanding: result.computed.currentOutstanding,
      debtToIncomeRatio: result.computed.debtToIncomeRatio,
      createdById: createdById || 'system'
    }
  })
}
