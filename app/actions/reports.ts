"use server"

import { getScopedDal } from "@/lib/dal"
import { requireRole } from "@/lib/auth-utils"
import { Prisma } from "@prisma/client"

/**
 * Ensures the user is authorized to view reports.
 * Field Officers are typically excluded from global reporting.
 */
async function authorizeReporting() {
  await requireRole(["SYSTEM_ADMIN", "HEAD_OFFICE", "BRANCH_MANAGER", "ACCOUNTANT", "FIELD_OFFICER"])
}

export async function getPortfolioAtRisk() {
  await authorizeReporting()
  const dal = await getScopedDal()
  const now = new Date()

  const loans = await dal.prisma.loan.findMany({
    where: {
      status: 'ACTIVE',
      // withOrgScope handles branch isolation for Branch Managers automatically
    },
    include: {
      repaymentSchedule: {
        where: {
          isPaid: false,
          scheduledDate: { lt: now }
        },
        orderBy: { scheduledDate: 'asc' }
      }
    }
  })

  // Standard cumulative PAR: each threshold includes all loans at OR above it.
  // PAR 1  = all outstanding balances on loans >= 1 DPD  (includes 7, 30, 90)
  // PAR 7  = all outstanding balances on loans >= 7 DPD  (includes 30, 90)
  // PAR 30 = all outstanding balances on loans >= 30 DPD (includes 90)
  // PAR 90 = all outstanding balances on loans >= 90 DPD
  // parTotal == par1: the canonical headline PAR figure used by CGAP / MIX Market
  let par1 = 0, par7 = 0, par30 = 0, par90 = 0, totalOutstanding = 0

  for (const loan of loans) {
    totalOutstanding += loan.outstanding.toNumber()

    if (loan.repaymentSchedule.length > 0) {
      const oldestDue = loan.repaymentSchedule[0].scheduledDate
      const daysPastDue = Math.floor((now.getTime() - oldestDue.getTime()) / (1000 * 60 * 60 * 24))

      const outstanding = loan.outstanding.toNumber()
      // Each condition is independent (no else-if): a 90-DPD loan is counted in all four.
      if (daysPastDue >= 1)  par1  += outstanding
      if (daysPastDue >= 7)  par7  += outstanding
      if (daysPastDue >= 30) par30 += outstanding
      if (daysPastDue >= 90) par90 += outstanding
    }
  }

  return {
    totalOutstanding,
    par1,
    par7,
    par30,
    par90,
    // parTotal is par1: the standard headline figure (all at-risk outstanding)
    parTotal: par1
  }
}

export async function getCollectionEfficiency(startDateStr: string, endDateStr: string) {
  await authorizeReporting()
  const dal = await getScopedDal()

  const startDate = new Date(startDateStr)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(endDateStr)
  endDate.setHours(23, 59, 59, 999)

  // 1. Scheduled obligations due during the selected period
  const schedules = await dal.prisma.repaymentSchedule.findMany({
    where: {
      scheduledDate: { gte: startDate, lte: endDate },
      loan: { status: { in: ['ACTIVE', 'SETTLED', 'OVERDUE'] } }
    },
    include: {
      loan: {
        include: {
          member: {
            include: {
              centre: {
                include: { branch: true }
              }
            }
          }
        }
      }
    }
  })

  // 2. Actual cash payments received during the selected period (by paidDate)
  const repayments = await dal.prisma.loanRepayment.findMany({
    where: {
      paidDate: { gte: startDate, lte: endDate },
      transactionType: 'PAYMENT',
    },
    include: {
      paymentReversal: true,
      loan: {
        include: {
          member: {
            include: {
              centre: {
                include: { branch: true }
              }
            }
          }
        }
      }
    }
  })

  type BucketValue = {
    branchName: string
    centreName: string
    scheduled: number
    collected: number
    cohortCollected: number
  }
  const aggregated: Record<string, BucketValue> = {}

  // Aggregate scheduled obligations and cumulative cohort receipts
  for (const s of schedules) {
    const centre = s.loan.member.centre
    const key = `${centre.branchId}-${centre.id}`
    if (!aggregated[key]) {
      aggregated[key] = {
        branchName: centre.branch.name,
        centreName: centre.name,
        scheduled: 0,
        collected: 0,
        cohortCollected: 0
      }
    }
    aggregated[key].scheduled += s.scheduledAmount.toNumber()
    aggregated[key].cohortCollected += s.paidAmount.toNumber()
  }

  // Aggregate cash payments actually received during the period (excluding approved reversals)
  for (const r of repayments) {
    if (r.paymentReversal && r.paymentReversal.status === 'APPROVED') {
      continue
    }
    const centre = r.loan.member.centre
    const key = `${centre.branchId}-${centre.id}`
    if (!aggregated[key]) {
      aggregated[key] = {
        branchName: centre.branch.name,
        centreName: centre.name,
        scheduled: 0,
        collected: 0,
        cohortCollected: 0
      }
    }
    aggregated[key].collected += r.amount.toNumber()
  }

  return Object.values(aggregated).map((a) => ({
    branchName: a.branchName,
    centreName: a.centreName,
    scheduled: a.scheduled,
    collected: a.collected,
    cohortCollected: a.cohortCollected,
    efficiency: a.scheduled > 0 ? (a.collected / a.scheduled) * 100 : 0,
    cohortEfficiency: a.scheduled > 0 ? (a.cohortCollected / a.scheduled) * 100 : 0
  })).sort((a, b) => b.efficiency - a.efficiency)
}

export async function getAgingReport() {
  await authorizeReporting()
  const dal = await getScopedDal()
  const now = new Date()

  const loans = await dal.prisma.loan.findMany({
    where: { status: 'ACTIVE' },
    include: {
      member: true,
      repaymentSchedule: {
        where: { isPaid: false, scheduledDate: { lt: now } },
        orderBy: { scheduledDate: 'asc' }
      }
    }
  })

  const agingData = []

  for (const loan of loans) {
    if (loan.repaymentSchedule.length > 0) {
      const oldestDue = loan.repaymentSchedule[0].scheduledDate
      const daysPastDue = Math.floor((now.getTime() - oldestDue.getTime()) / (1000 * 60 * 60 * 24))
      
      const overdueAmount = loan.repaymentSchedule.reduce((acc, s) => acc + s.scheduledAmount.toNumber(), 0)

      agingData.push({
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        memberName: loan.member.name,
        daysPastDue,
        overdueAmount,
        outstanding: loan.outstanding.toNumber()
      })
    }
  }

  // Sort by highest days past due
  return agingData.sort((a, b) => b.daysPastDue - a.daysPastDue)
}

export async function getOutstandingByCentre() {
  await authorizeReporting()
  const dal = await getScopedDal()

  const centres = await dal.prisma.centre.findMany({
    include: {
      branch: true,
      members: {
        include: {
          loans: {
            where: { status: 'ACTIVE' }
          }
        }
      }
    }
  })

  return centres.map(centre => {
    let totalOutstanding = 0
    let activeLoans = 0

    centre.members.forEach(member => {
      member.loans.forEach(loan => {
        totalOutstanding += loan.outstanding.toNumber()
        activeLoans++
      })
    })

    return {
      centre: { id: centre.id, name: centre.name, branch: centre.branch },
      activeLoans,
      totalOutstanding
    }
  }).filter(c => c.activeLoans > 0).sort((a, b) => b.totalOutstanding - a.totalOutstanding)
}

export async function getMemberHistory(nic: string) {
  await authorizeReporting()
  const dal = await getScopedDal()

  const member = await dal.prisma.member.findFirst({
    where: { nic: nic.trim() },
    include: {
      centre: { include: { branch: true } },
      loans: {
        include: { loanProduct: true },
        orderBy: { createdAt: 'desc' }
      },
      guarantorFor: {
        include: {
          loan: { include: { member: true } }
        }
      },
      savingsAccounts: {
        include: { product: true }
      }
    }
  })

  return member
}

export async function getDailyReconciliation(dateStr: string) {
  await authorizeReporting()
  const dal = await getScopedDal()
  const date = new Date(dateStr)
  
  // Start of day to end of day
  const startOfDay = new Date(date)
  startOfDay.setHours(0,0,0,0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23,59,59,999)

  // Get cashflows for the day
  const cashFlows = await dal.prisma.cashFlow.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay }
    },
    include: { branch: true }
  })

  // Get journal entries involving cash for the day
  // Account 1000 is Cash
  const journals = await dal.prisma.journalEntry.findMany({
    where: {
      organizationId: dal.organizationId,
      entryDate: { gte: startOfDay, lte: endOfDay },
      lines: {
        some: {
          account: { code: '1000' }
        }
      }
    },
    include: {
      lines: {
        include: { account: true }
      }
    }
  })

  // We can calculate actual system cash movements vs field reported cash
  let systemCashIn = 0
  let systemCashOut = 0

  journals.forEach(journal => {
    journal.lines.forEach(line => {
      if (line.account.code === '1000') {
        systemCashIn += line.debit.toNumber()
        systemCashOut += line.credit.toNumber()
      }
    })
  })

  const fieldReportedCollection = cashFlows.reduce((acc, cf) => acc + cf.dcAmount.toNumber(), 0)
  const fieldReportedDisbursement = cashFlows.reduce((acc, cf) => acc + cf.amountIssued.toNumber(), 0)

  return {
    date: dateStr,
    cashFlows,
    systemCashIn,
    systemCashOut,
    fieldReportedCollection,
    fieldReportedDisbursement,
    discrepancyCollection: systemCashIn - fieldReportedCollection,
    discrepancyDisbursement: systemCashOut - fieldReportedDisbursement
  }
}
