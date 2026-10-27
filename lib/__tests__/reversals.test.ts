import { approveReversal, rejectReversal } from "@/app/actions/reversals"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}))

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))

jest.mock("@/lib/subscription", () => ({
  ensureActiveSubscription: jest.fn().mockResolvedValue(true),
}))

jest.mock("@/lib/audit", () => ({
  logAudit: jest.fn().mockResolvedValue({ id: "audit-1" }),
}))

jest.mock("@/lib/intelligence/anomaly-detector", () => ({
  checkSuspiciousActivity: jest.fn(),
}))

jest.mock("@/lib/prisma", () => {
  const txMock: any = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    paymentReversal: { findUnique: jest.fn(), update: jest.fn() },
    loanRepayment: { findUnique: jest.fn(), create: jest.fn() },
    loan: { findUnique: jest.fn(), update: jest.fn() },
    repaymentSchedule: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    journalEntry: { findFirst: jest.fn(), create: jest.fn() },
  }

  const prismaMock: any = {
    $transaction: jest.fn(async (callback: (tx: any) => Promise<any>) => callback(txMock)),
    paymentReversal: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  }

  return {
    __esModule: true,
    default: prismaMock,
    txMock,
  }
})

const { txMock } = jest.requireMock("@/lib/prisma") as { txMock: any }

describe("Reversal Workflow and Financial Integrity", () => {
  const orgId = "org-1"
  const adminId = "admin-1"

  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue({
      user: {
        id: adminId,
        role: "BRANCH_MANAGER",
        organizationId: orgId,
      },
    })
  })

  it("reverses a single-schedule repayment, restoring schedule and loan balances", async () => {
    const reversalRecord = {
      id: "rev-req-1",
      organizationId: orgId,
      repaymentId: "repay-1",
      status: "REQUESTED",
      reason: "Member entered incorrect amount",
    }
    const originalRepayment = {
      id: "repay-1",
      organizationId: orgId,
      loanId: "loan-1",
      instalmentNumber: 1,
      scheduledDate: new Date("2026-10-01"),
      amount: new Prisma.Decimal("100.00"),
      method: "CASH",
      transactionType: "PAYMENT",
      allocations: [
        { id: "alloc-1", scheduleId: "sched-1", component: "INTEREST", amount: new Prisma.Decimal("20.00") },
        { id: "alloc-2", scheduleId: "sched-1", component: "PRINCIPAL", amount: new Prisma.Decimal("80.00") },
      ],
    }
    const loanRecord = {
      id: "loan-1",
      totalReceivable: new Prisma.Decimal("1000.00"),
      totalPaid: new Prisma.Decimal("1000.00"),
      outstanding: new Prisma.Decimal("0.00"),
      status: "SETTLED",
    }
    const scheduleRecord = {
      id: "sched-1",
      loanId: "loan-1",
      instalmentNumber: 1,
      scheduledAmount: new Prisma.Decimal("100.00"),
      paidAmount: new Prisma.Decimal("100.00"),
      status: "PAID",
      isPaid: true,
      supersededAt: null,
    }

    txMock.paymentReversal.findUnique.mockResolvedValue(reversalRecord)
    txMock.loanRepayment.findUnique
      .mockResolvedValueOnce(originalRepayment) // when fetching original
      .mockResolvedValueOnce(null)             // when checking existing reversalOfId
    txMock.loan.findUnique.mockResolvedValue(loanRecord)
    txMock.repaymentSchedule.findUnique.mockResolvedValue(scheduleRecord)
    txMock.journalEntry.findFirst.mockResolvedValue(null)
    txMock.loanRepayment.create.mockResolvedValue({ id: "rev-pay-1" })

    const result = await approveReversal("rev-req-1")
    expect(result).toEqual({ success: true })

    // 1. Counter LoanRepayment created with negative amount and exact schedule allocations
    expect(txMock.loanRepayment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: orgId,
        loanId: "loan-1",
        amount: new Prisma.Decimal("-100.00"),
        transactionType: "REVERSAL",
        reversalOfId: "repay-1",
        allocations: {
          create: [
            { scheduleId: "sched-1", component: "INTEREST", amount: new Prisma.Decimal("-20.00") },
            { scheduleId: "sched-1", component: "PRINCIPAL", amount: new Prisma.Decimal("-80.00") },
          ],
        },
      }),
    })

    // 2. Loan balances restored: totalPaid decreases to 900, outstanding increases to 100, SETTLED flips to ACTIVE
    expect(txMock.loan.update).toHaveBeenCalledWith({
      where: { id: "loan-1" },
      data: {
        outstanding: new Prisma.Decimal("100.00"),
        totalPaid: new Prisma.Decimal("900.00"),
        status: "ACTIVE",
      },
    })

    // 3. Schedule paidAmount decremented by exact allocated amount (100) -> becomes 0, status PENDING
    expect(txMock.repaymentSchedule.update).toHaveBeenCalledWith({
      where: { id: "sched-1" },
      data: {
        paidAmount: new Prisma.Decimal("0.00"),
        status: "PENDING",
        isPaid: false,
      },
    })

    // 4. PaymentReversal status updated to APPROVED with approvedById
    expect(txMock.paymentReversal.update).toHaveBeenCalledWith({
      where: { id: "rev-req-1" },
      data: expect.objectContaining({
        status: "APPROVED",
        approvedById: adminId,
        reversalPaymentId: "rev-pay-1",
      }),
    })
  })

  it("reverses a multi-schedule repayment deducting each schedule's exact allocated portion", async () => {
    // Payment of 150 covered Schedule 1 (60) and Schedule 2 (90)
    const originalRepayment = {
      id: "repay-multi",
      organizationId: orgId,
      loanId: "loan-1",
      instalmentNumber: 1,
      scheduledDate: new Date("2026-10-01"),
      amount: new Prisma.Decimal("150.00"),
      method: "CASH",
      transactionType: "PAYMENT",
      allocations: [
        { id: "a-1", scheduleId: "sched-1", component: "INTEREST", amount: new Prisma.Decimal("40.00") },
        { id: "a-2", scheduleId: "sched-1", component: "PRINCIPAL", amount: new Prisma.Decimal("20.00") },
        { id: "a-3", scheduleId: "sched-2", component: "PRINCIPAL", amount: new Prisma.Decimal("90.00") },
      ],
    }
    const sched1 = {
      id: "sched-1",
      loanId: "loan-1",
      scheduledAmount: new Prisma.Decimal("100.00"),
      paidAmount: new Prisma.Decimal("100.00"),
      status: "PAID",
      isPaid: true,
    }
    const sched2 = {
      id: "sched-2",
      loanId: "loan-1",
      scheduledAmount: new Prisma.Decimal("100.00"),
      paidAmount: new Prisma.Decimal("90.00"),
      status: "PARTIALLY_PAID",
      isPaid: false,
    }

    txMock.paymentReversal.findUnique.mockResolvedValue({
      id: "rev-multi",
      organizationId: orgId,
      repaymentId: "repay-multi",
      status: "REQUESTED",
    })
    txMock.loanRepayment.findUnique
      .mockResolvedValueOnce(originalRepayment)
      .mockResolvedValueOnce(null)
    txMock.loan.findUnique.mockResolvedValue({
      id: "loan-1",
      totalReceivable: new Prisma.Decimal("1000.00"),
      totalPaid: new Prisma.Decimal("500.00"),
      outstanding: new Prisma.Decimal("500.00"),
      status: "ACTIVE",
    })
    txMock.repaymentSchedule.findUnique.mockImplementation(({ where }: any) => {
      if (where.id === "sched-1") return Promise.resolve(sched1)
      if (where.id === "sched-2") return Promise.resolve(sched2)
      return Promise.resolve(null)
    })
    txMock.journalEntry.findFirst.mockResolvedValue(null)
    txMock.loanRepayment.create.mockResolvedValue({ id: "rev-pay-multi" })

    const result = await approveReversal("rev-multi")
    expect(result).toEqual({ success: true })

    // Sched 1 allocated was 40 + 20 = 60. paidAmount was 100 -> new paidAmount = 40 (PARTIALLY_PAID)
    expect(txMock.repaymentSchedule.update).toHaveBeenCalledWith({
      where: { id: "sched-1" },
      data: {
        paidAmount: new Prisma.Decimal("40.00"),
        status: "PARTIALLY_PAID",
        isPaid: false,
      },
    })

    // Sched 2 allocated was 90. paidAmount was 90 -> new paidAmount = 0 (PENDING)
    expect(txMock.repaymentSchedule.update).toHaveBeenCalledWith({
      where: { id: "sched-2" },
      data: {
        paidAmount: new Prisma.Decimal("0.00"),
        status: "PENDING",
        isPaid: false,
      },
    })
  })

  it("prevents duplicate reversals when already approved or counter-repayment exists", async () => {
    txMock.paymentReversal.findUnique.mockResolvedValue({
      id: "rev-approved",
      organizationId: orgId,
      status: "APPROVED", // Already approved
    })

    const result = await approveReversal("rev-approved")
    expect(result).toEqual({ error: "Reversal request is not in REQUESTED status" })
    expect(txMock.loanRepayment.create).not.toHaveBeenCalled()
  })

  it("rejects reversal when original repayment was already reversed", async () => {
    txMock.paymentReversal.findUnique.mockResolvedValue({
      id: "rev-req-2",
      organizationId: orgId,
      repaymentId: "repay-2",
      status: "REQUESTED",
    })
    txMock.loanRepayment.findUnique
      .mockResolvedValueOnce({
        id: "repay-2",
        organizationId: orgId,
        transactionType: "PAYMENT",
        amount: new Prisma.Decimal("50.00"),
        allocations: [],
      })
      .mockResolvedValueOnce({
        id: "repay-rev-exist", // Counter-repayment already exists
        reversalOfId: "repay-2",
      })

    const result = await approveReversal("rev-req-2")
    expect(result).toEqual({ error: "Repayment has already been reversed" })
    expect(txMock.loan.update).not.toHaveBeenCalled()
  })

  it("rejects reversal of a transaction that is itself a REVERSAL", async () => {
    txMock.paymentReversal.findUnique.mockResolvedValue({
      id: "rev-req-3",
      organizationId: orgId,
      repaymentId: "repay-reversal",
      status: "REQUESTED",
    })
    txMock.loanRepayment.findUnique.mockResolvedValueOnce({
      id: "repay-reversal",
      organizationId: orgId,
      transactionType: "REVERSAL",
      amount: new Prisma.Decimal("-50.00"),
      allocations: [],
    })

    const result = await approveReversal("rev-req-3")
    expect(result).toEqual({ error: "Cannot reverse a reversal transaction" })
    expect(txMock.loan.update).not.toHaveBeenCalled()
  })

  it("rejects reversal when repayment belongs to a different organization", async () => {
    txMock.paymentReversal.findUnique.mockResolvedValue({
      id: "rev-req-4",
      organizationId: orgId,
      repaymentId: "repay-diff-org",
      status: "REQUESTED",
    })
    txMock.loanRepayment.findUnique.mockResolvedValueOnce({
      id: "repay-diff-org",
      organizationId: "other-org", // Different organization!
      transactionType: "PAYMENT",
      allocations: [],
    })

    const result = await approveReversal("rev-req-4")
    expect(result).toEqual({ error: "Original repayment not found" })
    expect(txMock.loan.update).not.toHaveBeenCalled()
  })

  it("rejects unauthorized users without appropriate role", async () => {
    ;(auth as jest.Mock).mockResolvedValueOnce({
      user: {
        id: "officer-1",
        role: "FIELD_OFFICER", // Field officers cannot approve reversals
        organizationId: orgId,
      },
    })

    const result = await approveReversal("rev-1")
    expect(result).toEqual({ error: "Unauthorized" })
    expect(txMock.paymentReversal.findUnique).not.toHaveBeenCalled()
  })

  it("handles rejectReversal by setting status to REJECTED without financial changes", async () => {
    const defaultPrisma = (await import("@/lib/prisma")).default
    ;(defaultPrisma.paymentReversal.findUnique as jest.Mock).mockResolvedValue({
      id: "rev-to-reject",
      organizationId: orgId,
      status: "REQUESTED",
      reason: "Mistake by officer",
      repaymentId: "rep-1",
    })

    const result = await rejectReversal("rev-to-reject", "Not approved by credit committee")
    expect(result).toEqual({ success: true })
    expect(txMock.paymentReversal.update).toHaveBeenCalledWith({
      where: { id: "rev-to-reject" },
      data: expect.objectContaining({
        status: "REJECTED",
        approvedById: adminId,
        reason: "Mistake by officer | Rejected Note: Not approved by credit committee",
      }),
    })
    // No counter-payment created
    expect(txMock.loanRepayment.create).not.toHaveBeenCalled()
  })
})
