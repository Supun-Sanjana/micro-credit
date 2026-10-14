import { POST } from "@/app/api/field/collect/route"
import { getScopedDal } from "@/lib/dal"
import { recordPayment } from "@/lib/services/payment-service"
import { Prisma } from "@prisma/client"

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock("@/lib/dal", () => ({
  getScopedDal: jest.fn(),
}))

jest.mock("@/lib/services/payment-service", () => ({
  recordPayment: jest.fn(),
}))

describe("Field Collection API (POST /api/field/collect)", () => {
  let mockPrisma: any
  let mockTx: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockTx = {
      loan: {
        findFirst: jest.fn(),
      },
      fieldOfficerAssignment: {
        findFirst: jest.fn(),
      },
      repaymentSchedule: {
        findFirst: jest.fn(),
      },
      collectionAttempt: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    }

    mockPrisma = {
      loanRepayment: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn(async (callback: (tx: any) => Promise<any>) => {
        return callback(mockTx)
      }),
    }

    ;(getScopedDal as jest.Mock).mockResolvedValue({
      organizationId: "org-field-1",
      userId: "officer-100",
      role: "FIELD_OFFICER",
      prisma: mockPrisma,
    })
  })

  function makeRequest(body: any) {
    return new Request("http://localhost/api/field/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 1. Input Validation
  // ════════════════════════════════════════════════════════════════════════════

  describe("Input validation", () => {
    it("should return 400 if clientTransactionId is missing or empty string", async () => {
      const res1 = await POST(makeRequest({ loanId: "loan-1", amount: 100 }))
      expect(res1.status).toBe(400)
      const data1 = await res1.json()
      expect(data1.error).toBe("clientTransactionId required")

      const res2 = await POST(makeRequest({ clientTransactionId: "   ", loanId: "loan-1", amount: 100 }))
      expect(res2.status).toBe(400)
      const data2 = await res2.json()
      expect(data2.error).toBe("clientTransactionId required")
    })

    it("should return 400 if loanId is missing or empty string", async () => {
      const res1 = await POST(makeRequest({ clientTransactionId: "tx-1", amount: 100 }))
      expect(res1.status).toBe(400)
      const data1 = await res1.json()
      expect(data1.error).toBe("loanId required")

      const res2 = await POST(makeRequest({ clientTransactionId: "tx-1", loanId: "  ", amount: 100 }))
      expect(res2.status).toBe(400)
      const data2 = await res2.json()
      expect(data2.error).toBe("loanId required")
    })

    it("should return 400 if amount is missing, non-positive, or NaN", async () => {
      const invalidAmounts = [0, -50, null, undefined, "abc"]

      for (const amount of invalidAmounts) {
        const res = await POST(makeRequest({ clientTransactionId: "tx-1", loanId: "loan-1", amount }))
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toBe("Valid positive amount required")
      }
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 2. Idempotency & Duplicate Guards
  // ════════════════════════════════════════════════════════════════════════════

  describe("Idempotency checks", () => {
    it("should return existing repayment with 200 without executing transaction if already saved", async () => {
      const existingRepayment = {
        id: "rep-existing-1",
        amount: new Prisma.Decimal(250),
        clientTransactionId: "tx-existing-100",
      }
      mockPrisma.loanRepayment.findUnique.mockResolvedValueOnce(existingRepayment)

      const res = await POST(makeRequest({
        clientTransactionId: "tx-existing-100",
        loanId: "loan-1",
        amount: 250,
      }))

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe("rep-existing-1")
      // Crucial: no transaction executed
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it("should recover gracefully from P2002 race condition and return existing repayment with 200", async () => {
      const existingFromRace = {
        id: "rep-race-1",
        clientTransactionId: "tx-race-1",
      }

      // Simulate concurrent transaction conflict throwing P2002
      mockPrisma.$transaction.mockRejectedValueOnce({ code: "P2002" })
      mockPrisma.loanRepayment.findUnique.mockResolvedValueOnce(existingFromRace)

      const res = await POST(makeRequest({
        clientTransactionId: "tx-race-1",
        loanId: "loan-1",
        amount: 300,
      }))

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe("rep-race-1")
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 3. Security, Scoping & Authorization
  // ════════════════════════════════════════════════════════════════════════════

  describe("Security and authorization validations", () => {
    it("should reject loan not belonging to organization with 400", async () => {
      mockTx.loan.findFirst.mockResolvedValueOnce(null)

      const res = await POST(makeRequest({
        clientTransactionId: "tx-cross-org",
        loanId: "loan-other-org",
        amount: 500,
      }))

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe("Loan not found")

      // Verify the query was scoped to dal.organizationId
      expect(mockTx.loan.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          id: "loan-other-org",
          member: { organizationId: "org-field-1" },
        },
      }))
    })

    it("should return 403 when field officer is not assigned to the centre", async () => {
      mockTx.loan.findFirst.mockResolvedValueOnce({
        id: "loan-1",
        member: { centreId: "centre-99" },
      })
      mockTx.fieldOfficerAssignment.findFirst.mockResolvedValueOnce(null)

      const res = await POST(makeRequest({
        clientTransactionId: "tx-unassigned",
        loanId: "loan-1",
        amount: 500,
      }))

      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.error).toBe("Not assigned to this centre")
    })

    it("should reject cross-loan schedule injection with 400", async () => {
      mockTx.loan.findFirst.mockResolvedValueOnce({
        id: "loan-1",
        member: { centreId: "centre-1" },
      })
      mockTx.fieldOfficerAssignment.findFirst.mockResolvedValueOnce({
        id: "assign-1",
      })
      // Schedule belongs to loan-2, so loan-1 lookup returns null
      mockTx.repaymentSchedule.findFirst.mockResolvedValueOnce(null)

      const res = await POST(makeRequest({
        clientTransactionId: "tx-injected-sched",
        loanId: "loan-1",
        scheduleId: "sched-of-loan-2",
        amount: 400,
      }))

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe("Schedule does not belong to this loan")

      expect(mockTx.repaymentSchedule.findFirst).toHaveBeenCalledWith({
        where: {
          id: "sched-of-loan-2",
          loanId: "loan-1",
        },
      })
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 4. Successful Collection & Schedule Normalization
  // ════════════════════════════════════════════════════════════════════════════

  describe("Successful collection execution", () => {
    it("should normalize empty string scheduleId to null and record payment successfully", async () => {
      mockTx.loan.findFirst.mockResolvedValueOnce({
        id: "loan-1",
        member: { centreId: "centre-1" },
      })
      mockTx.fieldOfficerAssignment.findFirst.mockResolvedValueOnce({
        id: "assign-1",
      })
      ;(recordPayment as jest.Mock).mockResolvedValueOnce({
        id: "rep-created-1",
        amount: new Prisma.Decimal(500),
      })

      const res = await POST(makeRequest({
        clientTransactionId: "tx-norm-sched",
        loanId: "loan-1",
        scheduleId: "   ", // whitespace only
        amount: 500,
      }))

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.id).toBe("rep-created-1")

      // Repayment schedule findFirst should not have been called
      expect(mockTx.repaymentSchedule.findFirst).not.toHaveBeenCalled()

      // recordPayment called with scheduleId: undefined
      expect(recordPayment).toHaveBeenCalledWith(
        mockTx,
        expect.objectContaining({
          scheduleId: undefined,
          loanId: "loan-1",
          clientTransactionId: "tx-norm-sched",
        })
      )

      // Collection attempt should not be created when scheduleId is null
      expect(mockTx.collectionAttempt.create).not.toHaveBeenCalled()
    })

    it("should record payment and create collection attempt idempotently when scheduleId is valid", async () => {
      mockTx.loan.findFirst.mockResolvedValueOnce({
        id: "loan-1",
        member: { centreId: "centre-1" },
      })
      mockTx.fieldOfficerAssignment.findFirst.mockResolvedValueOnce({
        id: "assign-1",
      })
      mockTx.repaymentSchedule.findFirst.mockResolvedValueOnce({
        id: "sched-1",
        loanId: "loan-1",
      })
      mockTx.collectionAttempt.findFirst.mockResolvedValueOnce(null) // No existing attempt

      ;(recordPayment as jest.Mock).mockResolvedValueOnce({
        id: "rep-created-2",
        amount: new Prisma.Decimal(750),
      })

      const res = await POST(makeRequest({
        clientTransactionId: "tx-valid-attempt",
        loanId: "loan-1",
        scheduleId: "sched-1",
        amount: 750,
        notes: "Paid in cash",
      }))

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.id).toBe("rep-created-2")

      // Attempt was created with clientTxId
      expect(mockTx.collectionAttempt.create).toHaveBeenCalledWith({
        data: {
          organizationId: "org-field-1",
          scheduleId: "sched-1",
          officerId: "officer-100",
          outcome: "PAID",
          amountCollected: 750,
          notes: "Paid in cash",
          clientTxId: "tx-valid-attempt",
        },
      })
    })

    it("should not create duplicate collection attempt if an attempt already exists with clientTxId", async () => {
      mockTx.loan.findFirst.mockResolvedValueOnce({
        id: "loan-1",
        member: { centreId: "centre-1" },
      })
      mockTx.fieldOfficerAssignment.findFirst.mockResolvedValueOnce({
        id: "assign-1",
      })
      mockTx.repaymentSchedule.findFirst.mockResolvedValueOnce({
        id: "sched-1",
        loanId: "loan-1",
      })
      // Existing attempt found
      mockTx.collectionAttempt.findFirst.mockResolvedValueOnce({
        id: "attempt-existing-1",
      })

      ;(recordPayment as jest.Mock).mockResolvedValueOnce({
        id: "rep-created-3",
        amount: new Prisma.Decimal(600),
      })

      const res = await POST(makeRequest({
        clientTransactionId: "tx-attempt-dup-check",
        loanId: "loan-1",
        scheduleId: "sched-1",
        amount: 600,
      }))

      expect(res.status).toBe(201)
      expect(mockTx.collectionAttempt.create).not.toHaveBeenCalled()
    })
  })
})
