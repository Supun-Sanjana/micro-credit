import { PrismaClient, RiskAlertType, RiskAlertSeverity, RiskAlertStatus, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export async function runRiskBatch(organizationId: string): Promise<{
  alertsCreated: number
  alertsSkipped: number
  checks: string[]
}> {
  let alertsCreated = 0
  let alertsSkipped = 0
  const checks = [
    'checkHighPAR',
    'checkExcessiveExposure',
    'checkRepeatDefault',
    'checkDebtToIncome',
    'checkSuspiciousActivity'
  ]

  // Helper to create alert idempotently
  const createAlert = async (
    type: RiskAlertType,
    severity: RiskAlertSeverity,
    entityType: string,
    entityId: string,
    description: string
  ) => {
    try {
      const existing = await prisma.riskAlert.findFirst({
        where: { organizationId, entityId, type, status: 'OPEN' }
      })
      if (existing) {
        alertsSkipped++
        return
      }

      await prisma.riskAlert.create({
        data: {
          organizationId,
          type,
          severity,
          entityType,
          entityId,
          description,
          status: 'OPEN'
        }
      })
      alertsCreated++
    } catch (e) {
      console.error(`[RiskBatch] Error creating alert`, e)
    }
  }

  // 1. checkHighPAR (PAR30+)
  const parDate = new Date()
  parDate.setDate(parDate.getDate() - 30)

  const parLoans = await prisma.loan.findMany({
    where: {
      member: { organizationId },
      status: 'ACTIVE',
      repaymentSchedule: {
        some: {
          status: { in: ['DUE', 'PARTIALLY_PAID', 'MISSED'] },
          scheduledDate: { lt: parDate }
        }
      }
    },
    select: { id: true, memberId: true, loanNumber: true }
  })
  for (const loan of parLoans) {
    await createAlert(
      'HIGH_PAR',
      'MEDIUM',
      'Member',
      loan.memberId,
      `Member has a loan (${loan.loanNumber || loan.id}) with PAR > 30 days.`
    )
  }

  // 2. checkExcessiveExposure (>3 active loans)
  const exposureMembers = await prisma.member.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: { loans: { where: { status: 'ACTIVE' } } }
      }
    }
  })
  for (const member of exposureMembers) {
    if (member._count.loans > 3) {
      await createAlert(
        'EXCESSIVE_EXPOSURE',
        'HIGH',
        'Member',
        member.id,
        `Member has ${member._count.loans} active loans.`
      )
    }
  }

  // 3. checkRepeatDefault (2+ defaults)
  const defaultMembers = await prisma.member.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: { loans: { where: { status: { in: ['DEFAULTED'] } } } } // 'DEFAULTED' might mean defaulted/written-off
      }
    }
  })
  for (const member of defaultMembers) {
    if (member._count.loans >= 2) {
      await createAlert(
        'REPEAT_DEFAULT',
        'HIGH',
        'Member',
        member.id,
        `Member has ${member._count.loans} defaulted loans.`
      )
    }
  }

  // 4. checkDebtToIncome (DTI >80% on latest FinancialProfile)
  // We can find all latest financial profiles per member
  const financialProfiles = await prisma.financialProfile.findMany({
    where: { organizationId },
    orderBy: { assessmentDate: 'desc' },
    distinct: ['memberId']
  })

  for (const fp of financialProfiles) {
    const totalIncome = Number(fp.monthlyIncome) + (Number(fp.householdIncome) || 0)
    // To calculate DTI, we also need weekly rental of active loans. This might be too heavy to loop.
    // Let's fetch active loans for this member
    const activeLoans = await prisma.loan.findMany({
      where: { memberId: fp.memberId, status: 'ACTIVE' }
    })
    
    let monthlyLoanPayment = 0
    for (const loan of activeLoans) {
      monthlyLoanPayment += Number(loan.weeklyRental) * 4.33
    }
    
    const totalObligations = Number(fp.existingObligations) + monthlyLoanPayment
    let dti = 0
    if (totalIncome > 0) dti = totalObligations / totalIncome
    else if (totalObligations > 0) dti = 1

    if (dti > 0.8) {
      await createAlert(
        'DEBT_TO_INCOME',
        'MEDIUM',
        'Member',
        fp.memberId,
        `Member has a Debt-to-Income ratio of ${Math.round(dti * 100)}%.`
      )
    }
  }

  // 5. checkSuspiciousActivity (>2 reversals in 30 days on same loan)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Group by loan and count reversals
  const suspiciousLoans = await prisma.paymentReversal.groupBy({
    by: ['repaymentId'],
    where: {
      organizationId,
      requestedAt: { gte: thirtyDaysAgo }
    },
    _count: true
  })
  
  // Wait, PaymentReversal points to repaymentId, which belongs to a loan.
  // We need to count reversals per LOAN, not per repayment.
  // PaymentReversal -> LoanRepayment -> Loan
  // Grouping by loanId requires joining, which prisma groupBy doesn't support well directly.
  // Instead, let's fetch all recent reversals for the org
  const recentReversals = await prisma.paymentReversal.findMany({
    where: { organizationId, requestedAt: { gte: thirtyDaysAgo } },
    include: { repayment: true }
  })
  const reversalsPerLoan: Record<string, number> = {}
  for (const r of recentReversals) {
    if (r.repayment?.loanId) {
      reversalsPerLoan[r.repayment.loanId] = (reversalsPerLoan[r.repayment.loanId] || 0) + 1
    }
  }

  for (const [loanId, count] of Object.entries(reversalsPerLoan)) {
    if (count > 2) {
      await createAlert(
        'SUSPICIOUS_ACTIVITY',
        'HIGH',
        'Loan',
        loanId,
        `Loan has ${count} payment reversals in the last 30 days.`
      )
    }
  }

  return { alertsCreated, alertsSkipped, checks }
}
