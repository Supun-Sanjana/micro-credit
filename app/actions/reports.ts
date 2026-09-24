"use server"

import { getScopedDal } from "@/lib/dal"
import { requireRole } from "@/lib/auth-utils"
import { Prisma } from "@prisma/client"

/**
 * Ensures the user is authorized to view reports.
 * Field Officers are typically excluded from global reporting.
 */
async function authorizeReporting() {
  await requireRole(["SYSTEM_ADMIN", "HEAD_OFFICE", "BRANCH_MANAGER", "ACCOUNTANT"])
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

  let par1 = 0, par7 = 0, par30 = 0, par90 = 0, totalOutstanding = 0

  for (const loan of loans) {
    totalOutstanding += loan.outstanding.toNumber()

    if (loan.repaymentSchedule.length > 0) {
      const oldestDue = loan.repaymentSchedule[0].scheduledDate
      const daysPastDue = Math.floor((now.getTime() - oldestDue.getTime()) / (1000 * 60 * 60 * 24))
      
      const outstanding = loan.outstanding.toNumber()
      if (daysPastDue >= 90) par90 += outstanding
      else if (daysPastDue >= 30) par30 += outstanding
      else if (daysPastDue >= 7) par7 += outstanding
      else if (daysPastDue >= 1) par1 += outstanding
    }
  }

  return {
    totalOutstanding,
    par1,
    par7,
    par30,
    par90,
    parTotal: par1 + par7 + par30 + par90
  }
}

export async function getCollectionEfficiency(startDateStr: string, endDateStr: string) {
  await authorizeReporting()
  const dal = await getScopedDal()
  
  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)

  const flows = await dal.prisma.cashFlow.findMany({
    where: {
      date: { gte: startDate, lte: endDate }
    },
    include: { branch: true }
  })

  const aggregated = flows.reduce((acc: any, flow) => {
    const key = `${flow.branchId}-${flow.centreName}`
    if (!acc[key]) {
      acc[key] = {
        branchName: flow.branch.name,
        centreName: flow.centreName,
        scheduled: 0, // Note: The old implementation used mock scheduled vs actual collected. We will use dcAmount vs expected.
        collected: 0
      }
    }
    // We approximate scheduled vs collected based on cashflow records
    acc[key].collected += flow.dcAmount.toNumber()
    acc[key].scheduled += flow.totalRecovery.toNumber() // Using totalRecovery as expected target for now
    return acc
  }, {})

  return Object.values(aggregated).map((a: any) => ({
    ...a,
    efficiency: a.scheduled > 0 ? (a.collected / a.scheduled) * 100 : 0
  }))
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
