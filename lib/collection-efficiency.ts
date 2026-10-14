import { Prisma } from "@prisma/client"

export interface DueScheduleInput {
  loanId: string
  instalmentNumber: number
  scheduledAmount: Prisma.Decimal | number | string
  centreId: string
  centreName: string
  branchId: string
  branchName: string
  /** Repayments allocated to this instalment with paidDate <= the reporting cutoff. */
  repayments: Array<{ amount: Prisma.Decimal | number | string }>
}

export interface CashReceiptInput {
  amount: Prisma.Decimal | number | string
  centreId: string
  centreName: string
  branchId: string
  branchName: string
}

export interface CollectionEfficiencyRow {
  branchId: string
  branchName: string
  centreId: string
  centreName: string
  /** Instalments whose due date falls in the reporting window. */
  scheduled: number
  /**
   * Cash actually received during the window (payments and reversals),
   * including arrears and advance payments. This is the headline "collected" figure.
   */
  collected: number
  /** collected / scheduled × 100. Cash-received collection efficiency. */
  efficiency: number
  /**
   * Amount collected against instalments due in the window, measured at the
   * window cutoff. Includes partial payments and payments made before the
   * window. Excludes anything received after the cutoff.
   */
  dueCohortCollected: number
  dueCohortEfficiency: number
  metric: "cash_received"
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Inclusive reporting window.
 * `YYYY-MM-DD` is a calendar day in UTC (start of day through end of day).
 * A full timestamp is an exact inclusive instant. The cutoff for the
 * due-cohort metric is the end of this window.
 */
export function parseReportingWindow(startDateStr: string, endDateStr: string): { start: Date; end: Date; cutoff: Date } {
  if (!startDateStr || !endDateStr) throw new Error("Reporting window start and end are required")
  const start = parseBoundary(startDateStr, "start")
  const end = parseBoundary(endDateStr, "end")
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid reporting window")
  }
  if (start.getTime() > end.getTime()) throw new Error("Reporting window start is after end")
  return { start, end, cutoff: end }
}

function parseBoundary(value: string, edge: "start" | "end"): Date {
  const match = DATE_ONLY.exec(value.trim())
  if (match) {
    const day = `${match[1]}-${match[2]}-${match[3]}`
    return new Date(edge === "start" ? `${day}T00:00:00.000Z` : `${day}T23:59:59.999Z`)
  }
  return new Date(value)
}

function money(value: Prisma.Decimal | number | string): Prisma.Decimal {
  return new Prisma.Decimal(value)
}

function toMoneyNumber(value: Prisma.Decimal): number {
  return value.toDecimalPlaces(2).toNumber()
}

/**
 * Two collection-efficiency metrics, grouped by branch and centre.
 *
 * - Cash received: repayments dated inside the window ÷ amount due in the window.
 * - Due cohort: repayments allocated to those due instalments, as of the cutoff,
 *   ÷ amount due in the window.
 *
 * `scheduled` / `collected` / `efficiency` are the cash-received metric so
 * existing report columns stay meaningful. Due-cohort figures are separate.
 */
export function computeCollectionEfficiency(
  schedules: DueScheduleInput[],
  cashReceipts: CashReceiptInput[]
): CollectionEfficiencyRow[] {
  type Bucket = {
    branchId: string
    branchName: string
    centreId: string
    centreName: string
    scheduled: Prisma.Decimal
    collected: Prisma.Decimal
    dueCohortCollected: Prisma.Decimal
  }

  const buckets = new Map<string, Bucket>()
  const bucketFor = (row: { branchId: string; branchName: string; centreId: string; centreName: string }) => {
    const key = `${row.branchId}:${row.centreId}`
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = {
        branchId: row.branchId,
        branchName: row.branchName,
        centreId: row.centreId,
        centreName: row.centreName,
        scheduled: new Prisma.Decimal(0),
        collected: new Prisma.Decimal(0),
        dueCohortCollected: new Prisma.Decimal(0),
      }
      buckets.set(key, bucket)
    }
    return bucket
  }

  for (const schedule of schedules) {
    const bucket = bucketFor(schedule)
    bucket.scheduled = bucket.scheduled.plus(money(schedule.scheduledAmount))
    const collected = schedule.repayments.reduce(
      (sum, repayment) => sum.plus(money(repayment.amount)),
      new Prisma.Decimal(0)
    )
    bucket.dueCohortCollected = bucket.dueCohortCollected.plus(collected)
  }

  for (const receipt of cashReceipts) {
    const bucket = bucketFor(receipt)
    bucket.collected = bucket.collected.plus(money(receipt.amount))
  }

  return Array.from(buckets.values())
    .map((bucket) => {
      const scheduled = toMoneyNumber(bucket.scheduled)
      const collected = toMoneyNumber(bucket.collected)
      const dueCohortCollected = toMoneyNumber(bucket.dueCohortCollected)
      const ratio = (numerator: number) => (scheduled > 0 ? (numerator / scheduled) * 100 : 0)
      return {
        branchId: bucket.branchId,
        branchName: bucket.branchName,
        centreId: bucket.centreId,
        centreName: bucket.centreName,
        scheduled,
        collected,
        efficiency: ratio(collected),
        dueCohortCollected,
        dueCohortEfficiency: ratio(dueCohortCollected),
        metric: "cash_received" as const,
      }
    })
    .sort((a, b) => a.branchName.localeCompare(b.branchName) || a.centreName.localeCompare(b.centreName))
}
