import { Prisma } from "@prisma/client"
import { getCollectionEfficiency, getPortfolioAtRisk } from "@/app/actions/reports"
import { getScopedDal } from "@/lib/dal"
import prisma from "@/lib/prisma"

jest.mock("@/lib/dal", () => ({
  getScopedDal: jest.fn(),
}))

jest.mock("@/lib/auth-utils", () => ({
  requireRole: jest.fn(),
}))

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    loan: { findMany: jest.fn() },
    repaymentSchedule: { findMany: jest.fn() },
    loanRepayment: { findMany: jest.fn() },
    cashFlow: { findMany: jest.fn() },
  },
}))

const scopedDal = getScopedDal as jest.Mock
const unscoped = prisma as unknown as {
  loan: { findMany: jest.Mock }
  repaymentSchedule: { findMany: jest.Mock }
  loanRepayment: { findMany: jest.Mock }
  cashFlow: { findMany: jest.Mock }
}

function money(value: string | number) {
  return new Prisma.Decimal(value)
}

function loan(outstanding: string, oldestDue: string | null, extraDue: string[] = []) {
  const dates = oldestDue ? [oldestDue, ...extraDue] : []
  return {
    outstanding: money(outstanding),
    repaymentSchedule: dates.map((scheduledDate) => ({ scheduledDate: new Date(scheduledDate) })),
  }
}

describe("getPortfolioAtRisk", () => {
  const now = new Date("2026-04-01T00:00:00.000Z")

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(now)
    unscoped.loan.findMany.mockClear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("buckets outstanding by the oldest unpaid due date using the real report", async () => {
    const findMany = jest.fn().mockResolvedValue([
      loan("100", "2026-03-31T00:00:00.000Z"),
      loan("200", "2026-03-25T00:00:00.000Z"),
      loan("300", "2026-03-02T00:00:00.000Z"),
      loan("400", "2026-01-01T00:00:00.000Z"),
      loan("50", "2026-03-26T00:00:00.000Z"),
      loan("80", "2026-01-02T00:00:00.000Z"),
      loan("10", "2026-04-01T00:00:00.000Z"),
      loan("25", null),
      loan("1000", "2026-01-01T00:00:00.000Z", ["2026-03-31T00:00:00.000Z"]),
    ])
    scopedDal.mockResolvedValue({ organizationId: "org-a", prisma: { loan: { findMany } } })

    const report = await getPortfolioAtRisk()

    expect(unscoped.loan.findMany).not.toHaveBeenCalled()
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: "ACTIVE" },
      include: expect.objectContaining({
        repaymentSchedule: expect.objectContaining({
          where: { isPaid: false, scheduledDate: { lt: now } },
          orderBy: { scheduledDate: "asc" },
        }),
      }),
    }))
    expect(report).toEqual({
      totalOutstanding: 2165,
      par1: 150,
      par7: 200,
      par30: 380,
      par90: 1400,
      parTotal: 2130,
    })
  })
})

describe("getCollectionEfficiency", () => {
  const centre = {
    id: "centre-1",
    name: "Harbour",
    branchId: "branch-1",
    branch: { name: "Colombo" },
  }
  const otherBranchCentre = {
    id: "centre-2",
    name: "Harbour",
    branchId: "branch-2",
    branch: { name: "Galle" },
  }

  function schedule(opts: {
    loanId: string
    instalmentNumber: number
    scheduledDate: string
    scheduledAmount: string
    centre?: typeof centre
    repayments: Array<{ instalmentNumber: number | null; paidDate: string; amount: string }>
  }) {
    const place = opts.centre ?? centre
    return {
      loanId: opts.loanId,
      instalmentNumber: opts.instalmentNumber,
      scheduledDate: new Date(opts.scheduledDate),
      scheduledAmount: money(opts.scheduledAmount),
      loan: {
        member: { centre: place },
        repayments: opts.repayments.map((repayment) => ({
          instalmentNumber: repayment.instalmentNumber,
          paidDate: new Date(repayment.paidDate),
          amount: money(repayment.amount),
        })),
      },
    }
  }

  function receipt(amount: string, paidDate: string, place = centre) {
    return {
      paidDate: new Date(paidDate),
      amount: money(amount),
      loan: { member: { centre: place } },
    }
  }

  beforeEach(() => {
    unscoped.repaymentSchedule.findMany.mockClear()
    unscoped.loanRepayment.findMany.mockClear()
    unscoped.cashFlow.findMany.mockClear()
  })

  async function run(schedules: unknown[], receipts: unknown[], start = "2026-03-01", end = "2026-03-31") {
    const findSchedules = jest.fn().mockResolvedValue(schedules)
    const findReceipts = jest.fn().mockResolvedValue(receipts)
    scopedDal.mockResolvedValue({
      organizationId: "org-a",
      role: "BRANCH_MANAGER",
      prisma: {
        repaymentSchedule: { findMany: findSchedules },
        loanRepayment: { findMany: findReceipts },
        cashFlow: { findMany: jest.fn() },
      },
    })
    const rows = await getCollectionEfficiency(start, end)
    return { rows, findSchedules, findReceipts }
  }

  it("separates cash received in the window from the due-cohort balance at the cutoff", async () => {
    const { rows } = await run(
      [
        schedule({
          loanId: "loan-1",
          instalmentNumber: 2,
          scheduledDate: "2026-03-15T00:00:00.000Z",
          scheduledAmount: "100.00",
          repayments: [
            { instalmentNumber: 2, paidDate: "2026-02-20T00:00:00.000Z", amount: "40.00" },
            { instalmentNumber: 2, paidDate: "2026-03-20T00:00:00.000Z", amount: "30.00" },
            { instalmentNumber: 1, paidDate: "2026-03-20T00:00:00.000Z", amount: "999.00" },
          ],
        }),
      ],
      [
        receipt("30.00", "2026-03-20T00:00:00.000Z"),
        receipt("15.00", "2026-03-21T00:00:00.000Z"),
        receipt("-15.00", "2026-03-22T00:00:00.000Z"),
      ]
    )

    expect(rows).toEqual([
      expect.objectContaining({
        branchId: "branch-1",
        branchName: "Colombo",
        centreName: "Harbour",
        scheduled: 100,
        collected: 30,
        efficiency: 30,
        dueCohortCollected: 70,
        dueCohortEfficiency: 70,
        metric: "cash_received",
      }),
    ])
  })

  it("applies inclusive date boundaries and does not merge branches", async () => {
    const { rows, findSchedules, findReceipts } = await run(
      [
        schedule({
          loanId: "loan-1",
          instalmentNumber: 1,
          scheduledDate: "2026-03-01T00:00:00.000Z",
          scheduledAmount: "10.00",
          repayments: [],
        }),
        schedule({
          loanId: "loan-1",
          instalmentNumber: 2,
          scheduledDate: "2026-03-31T00:00:00.000Z",
          scheduledAmount: "20.00",
          repayments: [{ instalmentNumber: 2, paidDate: "2026-03-31T00:00:00.000Z", amount: "20.00" }],
        }),
        schedule({
          loanId: "loan-2",
          instalmentNumber: 1,
          scheduledDate: "2026-03-15T00:00:00.000Z",
          scheduledAmount: "50.00",
          centre: otherBranchCentre,
          repayments: [],
        }),
      ],
      [
        receipt("5.00", "2026-03-01T00:00:00.000Z"),
        receipt("7.00", "2026-03-31T00:00:00.000Z"),
        receipt("50.00", "2026-03-15T00:00:00.000Z", otherBranchCentre),
      ],
      "2026-03-01T00:00:00.000Z",
      "2026-03-31T00:00:00.000Z"
    )

    expect(findSchedules).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        scheduledDate: {
          gte: new Date("2026-03-01T00:00:00.000Z"),
          lte: new Date("2026-03-31T00:00:00.000Z"),
        },
        supersededAt: null,
      },
    }))
    expect(findReceipts.mock.calls[0][0].where.paidDate).toEqual({
      gte: new Date("2026-03-01T00:00:00.000Z"),
      lte: new Date("2026-03-31T00:00:00.000Z"),
    })
    expect(unscoped.repaymentSchedule.findMany).not.toHaveBeenCalled()
    expect(unscoped.loanRepayment.findMany).not.toHaveBeenCalled()
    expect(unscoped.cashFlow.findMany).not.toHaveBeenCalled()
    expect(JSON.stringify(findSchedules.mock.calls[0][0])).not.toContain("paidAmount")

    const colombo = rows.find((row) => row.branchId === "branch-1")
    const galle = rows.find((row) => row.branchId === "branch-2")
    expect(colombo).toEqual(expect.objectContaining({ scheduled: 30, collected: 12, dueCohortCollected: 20 }))
    expect(galle).toEqual(expect.objectContaining({ scheduled: 50, collected: 50, centreName: "Harbour" }))
  })

  it("expands a calendar end date through the end of that day", async () => {
    const { findSchedules } = await run([], [], "2026-03-01", "2026-03-31")
    expect(findSchedules.mock.calls[0][0].where.scheduledDate).toEqual({
      gte: new Date("2026-03-01T00:00:00.000Z"),
      lte: new Date("2026-03-31T23:59:59.999Z"),
    })
  })

  it("rejects an inverted reporting window", async () => {
    scopedDal.mockResolvedValue({ prisma: {} })
    await expect(getCollectionEfficiency("2026-04-02", "2026-04-01")).rejects.toThrow(/start is after end/)
  })
})
