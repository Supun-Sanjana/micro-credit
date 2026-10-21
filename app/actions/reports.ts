"use server"

import { getScopedDal } from "@/lib/dal"
import { requireRole } from "@/lib/auth-utils"
import { computeCollectionEfficiency, parseReportingWindow } from "@/lib/collection-efficiency"
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
  // RepaymentSchedule.scheduledDate is a database DATE. Evaluate delinquency
  // against the UTC calendar day so a loan is one day past due at the start of
  // the following UTC day, irrespective of the server's local timezone.
  const now = new Date()
  const asOfDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const loans = await dal.prisma.loan.findMany({
    where: {
      status: 'ACTIVE',
      // withOrgScope handles branch isolation for Branch Managers automatically
    },
    include: {
      repaymentSchedule: {
        where: {
          isPaid: false,
          supersededAt: null,
          scheduledDate: { lt: asOfDate }
        },
        orderBy: { scheduledDate: 'asc' }
      }
    }
  })

  let par1 = new Prisma.Decimal(0)
  let par7 = new Prisma.Decimal(0)
  let par30 = new Prisma.Decimal(0)
  let par90 = new Prisma.Decimal(0)
  let totalOutstanding = new Prisma.Decimal(0)

  for (const loan of loans) {
    // Gross portfolio is the positive outstanding balance of eligible active
    // loans. Settled/zero-balance records must not inflate its denominator.
    const outstanding = new Prisma.Decimal(loan.outstanding)
    if (outstanding.lte(0)) continue

    totalOutstanding = totalOutstanding.plus(outstanding)

    if (loan.repaymentSchedule.length > 0) {
      const oldestDue = loan.repaymentSchedule[0].scheduledDate
      const dueDate = new Date(Date.UTC(
        oldestDue.getUTCFullYear(),
        oldestDue.getUTCMonth(),
        oldestDue.getUTCDate()
      ))
      const daysPastDue = Math.floor((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      // Cumulative PAR: one exposure is counted once per threshold it meets,
      // never once per overdue schedule.
      if (daysPastDue >= 1) par1 = par1.plus(outstanding)
      if (daysPastDue >= 7) par7 = par7.plus(outstanding)
      if (daysPastDue >= 30) par30 = par30.plus(outstanding)
      if (daysPastDue >= 90) par90 = par90.plus(outstanding)
    }
  }

  const ratio = (exposure: Prisma.Decimal) =>
    totalOutstanding.gt(0)
      ? exposure.dividedBy(totalOutstanding).mul(100).toDecimalPlaces(2).toNumber()
      : 0

  return {
    totalOutstanding: totalOutstanding.toNumber(),
    par1: par1.toNumber(),
    par7: par7.toNumber(),
    par30: par30.toNumber(),
    par90: par90.toNumber(),
    // Total PAR is explicitly the PAR 1+ exposure, not a sum of the
    // overlapping cumulative threshold values.
    parTotal: par1.toNumber(),
    par1Ratio: ratio(par1),
    par7Ratio: ratio(par7),
    par30Ratio: ratio(par30),
    par90Ratio: ratio(par90),
    parTotalRatio: ratio(par1),
    asOfDate: asOfDate.toISOString().slice(0, 10),
  }
}

export async function getCollectionEfficiency(startDateStr: string, endDateStr: string) {
  await authorizeReporting()
  const dal = await getScopedDal()
  const window = parseReportingWindow(startDateStr, endDateStr)

  // Both queries run on the scoped client from getScopedDal(). RepaymentSchedule
  // and LoanRepayment are organization-scoped through the loan's member, and
  // branch-scoped for field officers and branch managers. Do not query the
  // unscoped Prisma client here.
  const [schedules, receipts] = await Promise.all([
    dal.prisma.repaymentSchedule.findMany({
      where: {
        scheduledDate: { gte: window.start, lte: window.end },
        supersededAt: null,
      },
      include: {
        loan: {
          include: {
            member: { include: { centre: { include: { branch: true } } } },
            repayments: {
              where: {
                paidDate: { lte: window.cutoff },
                transactionType: { in: ["PAYMENT", "REVERSAL"] },
              },
            },
          },
        },
      },
    }),
    dal.prisma.loanRepayment.findMany({
      where: {
        paidDate: { gte: window.start, lte: window.end },
        transactionType: { in: ["PAYMENT", "REVERSAL"] },
      },
      include: {
        loan: {
          include: {
            member: { include: { centre: { include: { branch: true } } } },
          },
        },
      },
    }),
  ])

  return computeCollectionEfficiency(
    schedules.map((schedule) => ({
      loanId: schedule.loanId,
      instalmentNumber: schedule.instalmentNumber,
      scheduledAmount: schedule.scheduledAmount,
      centreId: schedule.loan.member.centre.id,
      centreName: schedule.loan.member.centre.name,
      branchId: schedule.loan.member.centre.branchId,
      branchName: schedule.loan.member.centre.branch.name,
      repayments: schedule.loan.repayments
        .filter((repayment) => repayment.instalmentNumber === schedule.instalmentNumber)
        .map((repayment) => ({ amount: repayment.amount })),
    })),
    receipts.map((receipt) => ({
      amount: receipt.amount,
      centreId: receipt.loan.member.centre.id,
      centreName: receipt.loan.member.centre.name,
      branchId: receipt.loan.member.centre.branchId,
      branchName: receipt.loan.member.centre.branch.name,
    }))
  )
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
