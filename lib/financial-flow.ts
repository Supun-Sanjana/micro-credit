import prisma from "@/lib/prisma"

export interface MonthlyFlowPoint {
  month: string
  lending: number
  repayment: number
}

export interface FinancialFlowData {
  data6Months: MonthlyFlowPoint[]
  dataThisYear: MonthlyFlowPoint[]
}

/**
 * Aggregates actual monthly disbursements (loans granted) and collections (repayments received)
 * for a specific organization, supporting both 6-month trailing and 12-month calendar year views.
 */
export async function getFinancialFlowData(orgId: string): Promise<FinancialFlowData> {
  const now = new Date()
  const currentYear = now.getFullYear()

  // 1. Generate 6-month sequence (current month and previous 5 months)
  const months6: { key: string; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleString("en-US", { month: "short" })
    months6.push({ key, label })
  }

  // 2. Generate 12-month sequence for current year
  const monthsThisYear: { key: string; label: string }[] = []
  for (let m = 0; m < 12; m++) {
    const d = new Date(currentYear, m, 1)
    const key = `${currentYear}-${String(m + 1).padStart(2, "0")}`
    const label = d.toLocaleString("en-US", { month: "short" })
    monthsThisYear.push({ key, label })
  }

  // Earliest date boundary
  const earliestDate = new Date(
    Math.min(
      new Date(currentYear, 0, 1).getTime(),
      new Date(now.getFullYear(), now.getMonth() - 5, 1).getTime()
    )
  )

  const [loans, repayments] = await Promise.all([
    prisma.loan.findMany({
      where: {
        member: { organizationId: orgId },
        status: { in: ["DISBURSED", "ACTIVE", "OVERDUE", "SETTLED", "DEFAULTED"] },
        OR: [
          { grantedDate: { gte: earliestDate } },
          { grantedDate: null, createdAt: { gte: earliestDate } }
        ]
      },
      select: {
        loanAmount: true,
        grantedDate: true,
        createdAt: true,
      }
    }),
    prisma.loanRepayment.findMany({
      where: {
        organizationId: orgId,
        paidDate: { gte: earliestDate }
      },
      select: {
        amount: true,
        paidDate: true,
      }
    })
  ])

  function getMonthKey(date: Date) {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  }

  const lendingByMonth: Record<string, number> = {}
  for (const l of loans) {
    const date = l.grantedDate || l.createdAt
    const key = getMonthKey(date)
    lendingByMonth[key] = (lendingByMonth[key] || 0) + Number(l.loanAmount)
  }

  const repaymentsByMonth: Record<string, number> = {}
  for (const r of repayments) {
    const key = getMonthKey(r.paidDate)
    repaymentsByMonth[key] = (repaymentsByMonth[key] || 0) + Number(r.amount)
  }

  const data6Months: MonthlyFlowPoint[] = months6.map((m) => ({
    month: m.label,
    lending: Math.round(lendingByMonth[m.key] || 0),
    repayment: Math.round(repaymentsByMonth[m.key] || 0),
  }))

  const dataThisYear: MonthlyFlowPoint[] = monthsThisYear.map((m) => ({
    month: m.label,
    lending: Math.round(lendingByMonth[m.key] || 0),
    repayment: Math.round(repaymentsByMonth[m.key] || 0),
  }))

  return {
    data6Months,
    dataThisYear,
  }
}
