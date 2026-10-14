import { getPortfolioAtRisk, getCollectionEfficiency } from "@/app/actions/reports"
import { getScopedDal } from "@/lib/dal"
import { requireRole } from "@/lib/auth-utils"
import { Prisma } from "@prisma/client"

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock("@/lib/dal", () => ({
  getScopedDal: jest.fn(),
}))

jest.mock("@/lib/auth-utils", () => ({
  requireRole: jest.fn(),
  hasRole: jest.fn(),
  canAccessBranch: jest.fn(),
}))

describe("Reports Action - Portfolio at Risk & Collection Efficiency", () => {
  let mockPrisma: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockPrisma = {
      loan: {
        findMany: jest.fn(),
      },
      repaymentSchedule: {
        findMany: jest.fn(),
      },
      loanRepayment: {
        findMany: jest.fn(),
      },
    }

    ;(requireRole as jest.Mock).mockResolvedValue(undefined)
    ;(getScopedDal as jest.Mock).mockResolvedValue({
      organizationId: "org-test-1",
      userId: "user-1",
      role: "HEAD_OFFICE",
      prisma: mockPrisma,
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // getPortfolioAtRisk()
  // ════════════════════════════════════════════════════════════════════════════

  describe("getPortfolioAtRisk()", () => {
    it("should reject when user lacks authorized role", async () => {
      ;(requireRole as jest.Mock).mockRejectedValueOnce(new Error("Forbidden: requires one of authorized roles"))

      await expect(getPortfolioAtRisk()).rejects.toThrow("Forbidden")
    })

    it("should return zero PAR when all loans are fully performing (0 DPD)", async () => {
      mockPrisma.loan.findMany.mockResolvedValueOnce([
        {
          id: "loan-1",
          outstanding: new Prisma.Decimal(5000),
          repaymentSchedule: [],
        },
        {
          id: "loan-2",
          outstanding: new Prisma.Decimal(3000),
          repaymentSchedule: [],
        },
      ])

      const result = await getPortfolioAtRisk()

      expect(result.totalOutstanding).toBe(8000)
      expect(result.par1).toBe(0)
      expect(result.par7).toBe(0)
      expect(result.par30).toBe(0)
      expect(result.par90).toBe(0)
      expect(result.parTotal).toBe(0)
    })

    it("should correctly classify loans into cumulative PAR thresholds (PAR 1, 7, 30, 90)", async () => {
      const now = new Date()
      const daysAgo = (days: number) =>
        new Date(now.getTime() - days * 24 * 60 * 60 * 1000 - 1000)

      mockPrisma.loan.findMany.mockResolvedValueOnce([
        // Loan A: 3 DPD -> PAR 1 only (1,000)
        {
          id: "loan-a",
          outstanding: new Prisma.Decimal(1000),
          repaymentSchedule: [{ scheduledDate: daysAgo(3) }],
        },
        // Loan B: 15 DPD -> PAR 1, PAR 7 (2,000)
        {
          id: "loan-b",
          outstanding: new Prisma.Decimal(2000),
          repaymentSchedule: [{ scheduledDate: daysAgo(15) }],
        },
        // Loan C: 45 DPD -> PAR 1, PAR 7, PAR 30 (3,000)
        {
          id: "loan-c",
          outstanding: new Prisma.Decimal(3000),
          repaymentSchedule: [{ scheduledDate: daysAgo(45) }],
        },
        // Loan D: 95 DPD -> PAR 1, PAR 7, PAR 30, PAR 90 (4,000)
        {
          id: "loan-d",
          outstanding: new Prisma.Decimal(4000),
          repaymentSchedule: [{ scheduledDate: daysAgo(95) }],
        },
        // Loan E: Current / 0 DPD -> Not in PAR (5,000)
        {
          id: "loan-e",
          outstanding: new Prisma.Decimal(5000),
          repaymentSchedule: [],
        },
      ])

      const result = await getPortfolioAtRisk()

      // Cumulative checks:
      // PAR 90: Loan D = 4,000
      expect(result.par90).toBe(4000)

      // PAR 30: Loan C (3,000) + Loan D (4,000) = 7,000
      expect(result.par30).toBe(7000)

      // PAR 7:  Loan B (2,000) + Loan C (3,000) + Loan D (4,000) = 9,000
      expect(result.par7).toBe(9000)

      // PAR 1:  Loan A (1,000) + Loan B (2,000) + Loan C (3,000) + Loan D (4,000) = 10,000
      expect(result.par1).toBe(10000)

      // parTotal is the headline cumulative PAR (par1)
      expect(result.parTotal).toBe(10000)
      expect(result.parTotal).toBe(result.par1)

      // Total portfolio outstanding includes performing loan E
      expect(result.totalOutstanding).toBe(15000)
    })

    it("should measure DPD from the oldest overdue instalment when a loan has multiple past-due instalments", async () => {
      const now = new Date()
      const daysAgo = (days: number) =>
        new Date(now.getTime() - days * 24 * 60 * 60 * 1000 - 1000)

      // Loan with multiple overdue schedules: oldest is 50 days ago
      mockPrisma.loan.findMany.mockResolvedValueOnce([
        {
          id: "loan-multi",
          outstanding: new Prisma.Decimal(2500),
          repaymentSchedule: [
            { scheduledDate: daysAgo(50) }, // oldest
            { scheduledDate: daysAgo(10) },
          ],
        },
      ])

      const result = await getPortfolioAtRisk()

      // Oldest is 50 DPD, so loan qualifies for PAR 1, 7, 30, but not 90
      expect(result.par1).toBe(2500)
      expect(result.par7).toBe(2500)
      expect(result.par30).toBe(2500)
      expect(result.par90).toBe(0)
      expect(result.parTotal).toBe(2500)
      expect(result.totalOutstanding).toBe(2500)
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // getCollectionEfficiency()
  // ════════════════════════════════════════════════════════════════════════════

  describe("getCollectionEfficiency()", () => {
    const centreA = {
      id: "centre-1",
      name: "North Centre",
      branchId: "branch-1",
      branch: { id: "branch-1", name: "Main Branch" },
    }

    const centreB = {
      id: "centre-2",
      name: "South Centre",
      branchId: "branch-2",
      branch: { id: "branch-2", name: "West Branch" },
    }

    it("should correctly compute cash-received efficiency and cohort efficiency", async () => {
      // Schedules due in reporting period
      mockPrisma.repaymentSchedule.findMany.mockResolvedValueOnce([
        {
          scheduledAmount: new Prisma.Decimal(1000),
          paidAmount: new Prisma.Decimal(1000),
          loan: { member: { centre: centreA } },
        },
        {
          scheduledAmount: new Prisma.Decimal(1000),
          paidAmount: new Prisma.Decimal(500),
          loan: { member: { centre: centreA } },
        },
      ])

      // Actual cash payments received in period
      mockPrisma.loanRepayment.findMany.mockResolvedValueOnce([
        {
          amount: new Prisma.Decimal(1000),
          paymentReversal: null,
          loan: { member: { centre: centreA } },
        },
        {
          amount: new Prisma.Decimal(800),
          paymentReversal: null,
          loan: { member: { centre: centreA } },
        },
      ])

      const result = await getCollectionEfficiency("2026-04-01", "2026-04-30")

      expect(result).toHaveLength(1)
      const row = result[0]
      expect(row.branchName).toBe("Main Branch")
      expect(row.centreName).toBe("North Centre")
      expect(row.scheduled).toBe(2000)
      expect(row.collected).toBe(1800)          // Cash received: 1000 + 800
      expect(row.cohortCollected).toBe(1500)    // Cumulative cohort paid: 1000 + 500
      expect(row.efficiency).toBe(90)           // (1800 / 2000) * 100
      expect(row.cohortEfficiency).toBe(75)     // (1500 / 2000) * 100
    })

    it("should exclude approved payment reversals from cash collected", async () => {
      mockPrisma.repaymentSchedule.findMany.mockResolvedValueOnce([
        {
          scheduledAmount: new Prisma.Decimal(1000),
          paidAmount: new Prisma.Decimal(1000),
          loan: { member: { centre: centreA } },
        },
      ])

      mockPrisma.loanRepayment.findMany.mockResolvedValueOnce([
        {
          amount: new Prisma.Decimal(500),
          paymentReversal: null,
          loan: { member: { centre: centreA } },
        },
        // APPROVED reversal: must be skipped entirely
        {
          amount: new Prisma.Decimal(400),
          paymentReversal: { status: "APPROVED" },
          loan: { member: { centre: centreA } },
        },
        // PENDING reversal: not yet approved, so still counted as collected
        {
          amount: new Prisma.Decimal(200),
          paymentReversal: { status: "PENDING" },
          loan: { member: { centre: centreA } },
        },
      ])

      const result = await getCollectionEfficiency("2026-04-01", "2026-04-30")

      expect(result).toHaveLength(1)
      // 500 + 200 = 700 (400 is excluded)
      expect(result[0].collected).toBe(700)
      expect(result[0].efficiency).toBe(70)
    })

    it("should aggregate by centre and sort descending by efficiency", async () => {
      mockPrisma.repaymentSchedule.findMany.mockResolvedValueOnce([
        {
          scheduledAmount: new Prisma.Decimal(1000),
          paidAmount: new Prisma.Decimal(500),
          loan: { member: { centre: centreA } },
        },
        {
          scheduledAmount: new Prisma.Decimal(1000),
          paidAmount: new Prisma.Decimal(1000),
          loan: { member: { centre: centreB } },
        },
      ])

      mockPrisma.loanRepayment.findMany.mockResolvedValueOnce([
        {
          amount: new Prisma.Decimal(500),
          paymentReversal: null,
          loan: { member: { centre: centreA } },
        },
        {
          amount: new Prisma.Decimal(1000),
          paymentReversal: null,
          loan: { member: { centre: centreB } },
        },
      ])

      const result = await getCollectionEfficiency("2026-04-01", "2026-04-30")

      expect(result).toHaveLength(2)
      // centreB has 100% efficiency, centreA has 50%
      expect(result[0].centreName).toBe("South Centre")
      expect(result[0].efficiency).toBe(100)
      expect(result[1].centreName).toBe("North Centre")
      expect(result[1].efficiency).toBe(50)
    })

    it("should handle zero scheduled amounts safely without division by zero", async () => {
      mockPrisma.repaymentSchedule.findMany.mockResolvedValueOnce([])

      mockPrisma.loanRepayment.findMany.mockResolvedValueOnce([
        {
          amount: new Prisma.Decimal(200),
          paymentReversal: null,
          loan: { member: { centre: centreA } },
        },
      ])

      const result = await getCollectionEfficiency("2026-04-01", "2026-04-30")

      expect(result).toHaveLength(1)
      expect(result[0].scheduled).toBe(0)
      expect(result[0].collected).toBe(200)
      expect(result[0].efficiency).toBe(0)
      expect(result[0].cohortEfficiency).toBe(0)
    })
  })
})
