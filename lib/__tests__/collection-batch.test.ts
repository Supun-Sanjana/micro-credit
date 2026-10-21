import { POST } from "@/app/api/collection/route"
import { getScopedDal } from "@/lib/dal"
import { recordPayment } from "@/lib/services/payment-service"
import { normalizePaymentIdempotencyPayload, paymentIdempotencyFingerprint } from "@/lib/payment-idempotency"
import { Prisma } from "@prisma/client"

jest.mock("@/lib/dal", () => ({
  getScopedDal: jest.fn(),
}))

jest.mock("@/lib/services/payment-service", () => ({
  recordPayment: jest.fn(),
}))

jest.mock("@/lib/accounting", () => ({
  getAccountByCode: jest.fn().mockResolvedValue({ id: "acc-1" }),
  postJournalEntry: jest.fn().mockResolvedValue({ id: "je-1" }),
}))

jest.mock("@/lib/services/notification-service", () => ({
  dispatchNotification: jest.fn(),
}))

const scopedDal = getScopedDal as jest.Mock
const record = recordPayment as jest.Mock

function postBatch(body: unknown) {
  return POST(new Request("http://localhost/api/collection", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  }))
}

describe("POST /api/collection (Batch Idempotency & Ordering)", () => {
  const tx = {
    loanRepayment: { findUnique: jest.fn(), create: jest.fn() },
    savingsTransaction: { create: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn() },
    savingsAccount: { update: jest.fn() },
    loan: { findUniqueOrThrow: jest.fn() },
  }
  let transaction: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    transaction = jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx))
    scopedDal.mockResolvedValue({
      organizationId: "org-1",
      userId: "officer-1",
      role: "ADMIN",
      prisma: {
        loan: { findMany: jest.fn().mockResolvedValue([{ id: "loan-1" }, { id: "loan-2" }]) },
        $transaction: transaction,
      },
    })
    tx.loanRepayment.findUnique.mockResolvedValue(null)
    tx.savingsTransaction.findFirst.mockResolvedValue(null)
    tx.loan.findUniqueOrThrow.mockResolvedValue({ id: "loan-1", memberId: "m-1", status: "ACTIVE" })
    record.mockResolvedValue({ id: "repay-1", clientTransactionId: "tx-1" })
  })

  const validPayload = normalizePaymentIdempotencyPayload({
    loanId: "loan-1",
    amount: 100,
    method: "CASH",
  })
  const validFingerprint = paymentIdempotencyFingerprint(validPayload)

  it("skips duplicate loan repayment and savings deposits on a matching retry", async () => {
    tx.loanRepayment.findUnique.mockResolvedValue({
      id: "repay-1",
      clientTransactionId: "tx-1",
      idempotencyFingerprint: validFingerprint,
    })
    tx.savingsTransaction.findUnique.mockImplementation(({ where }: any) => {
      if (where?.organizationId_reference?.reference === "tx-1:compulsory") {
        return Promise.resolve({
          id: "sav-1",
          savingsAccountId: "sav-1",
          amount: new Prisma.Decimal(50),
        })
      }
      return Promise.resolve(null)
    })

    const response = await postBatch({
      date: "2026-10-20",
      centreId: "centre-1",
      entries: [
        {
          loanId: "loan-1",
          amount: 100,
          clientTransactionId: "tx-1",
          compulsorySavingsId: "sav-1",
          compulsorySavingsDeposit: 50,
        },
      ],
    })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.duplicates).toEqual([{ entryId: "tx-1", repaymentId: "repay-1" }])
    expect(json.savedCount).toBe(0)
    expect(record).not.toHaveBeenCalled()
    expect(tx.savingsTransaction.create).not.toHaveBeenCalled()
    expect(tx.savingsAccount.update).not.toHaveBeenCalled()
  })

  it("rejects an entry reusing an idempotency key with a different loan amount", async () => {
    tx.loanRepayment.findUnique.mockResolvedValue({
      id: "repay-1",
      clientTransactionId: "tx-1",
      idempotencyFingerprint: validFingerprint,
    })

    const response = await postBatch({
      date: "2026-10-20",
      centreId: "centre-1",
      entries: [
        {
          loanId: "loan-1",
          amount: 150, // Different from 100
          clientTransactionId: "tx-1",
          compulsorySavingsId: "sav-1",
          compulsorySavingsDeposit: 50,
        },
      ],
    })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: "This idempotency key has already been used with a different payment",
    })
    expect(record).not.toHaveBeenCalled()
    expect(tx.savingsTransaction.create).not.toHaveBeenCalled()
    expect(tx.savingsAccount.update).not.toHaveBeenCalled()
  })

  it("rejects an entry reusing an idempotency key with changed savings amount", async () => {
    tx.loanRepayment.findUnique.mockResolvedValue({
      id: "repay-1",
      clientTransactionId: "tx-1",
      idempotencyFingerprint: validFingerprint,
    })
    tx.savingsTransaction.findFirst.mockResolvedValue({
      id: "savtx-1",
      amount: new Prisma.Decimal(50),
    })

    const response = await postBatch({
      date: "2026-10-20",
      centreId: "centre-1",
      entries: [
        {
          loanId: "loan-1",
          amount: 100,
          clientTransactionId: "tx-1",
          compulsorySavingsId: "sav-1",
          compulsorySavingsDeposit: 75, // Changed from 50
        },
      ],
    })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: "This idempotency key has already been used with a different payment",
    })
    expect(record).not.toHaveBeenCalled()
    expect(tx.savingsTransaction.create).not.toHaveBeenCalled()
  })

  it("permits two distinct legitimate partial payments with different clientTransactionIds", async () => {
    record
      .mockResolvedValueOnce({ id: "repay-1", clientTransactionId: "tx-1" })
      .mockResolvedValueOnce({ id: "repay-2", clientTransactionId: "tx-2" })

    const response = await postBatch({
      date: "2026-10-20",
      centreId: "centre-1",
      entries: [
        {
          loanId: "loan-1",
          amount: 50,
          clientTransactionId: "tx-1",
        },
        {
          loanId: "loan-1",
          amount: 50,
          clientTransactionId: "tx-2",
        },
      ],
    })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.duplicates).toEqual([])
    expect(json.savedCount).toBe(2)
    expect(json.totalCollected).toBe(100)
    expect(record).toHaveBeenCalledTimes(2)
  })

  it("enforces tenant-scoped lookup for clientTransactionId", async () => {
    await postBatch({
      date: "2026-10-20",
      centreId: "centre-1",
      entries: [
        {
          loanId: "loan-1",
          amount: 100,
          clientTransactionId: "tx-isolated",
        },
      ],
    })

    expect(tx.loanRepayment.findUnique).toHaveBeenCalledWith({
      where: {
        organizationId_clientTransactionId: {
          organizationId: "org-1",
          clientTransactionId: "tx-isolated",
        },
      },
    })
  })

  it("rejects an entry reusing an idempotency key with a different savings account ID", async () => {
    tx.loanRepayment.findUnique.mockResolvedValue({
      id: "repay-1",
      clientTransactionId: "tx-1",
      idempotencyFingerprint: validFingerprint,
    })
    tx.savingsTransaction.findUnique.mockResolvedValue({
      id: "savtx-1",
      savingsAccountId: "sav-original",
      amount: new Prisma.Decimal(50),
    })

    const response = await postBatch({
      date: "2026-10-20",
      centreId: "centre-1",
      entries: [
        {
          loanId: "loan-1",
          amount: 100,
          clientTransactionId: "tx-1",
          compulsorySavingsId: "sav-different",
          compulsorySavingsDeposit: 50,
        },
      ],
    })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: "This idempotency key has already been used with a different payment",
    })
    expect(record).not.toHaveBeenCalled()
  })

  it("rejects a retry that omits savings deposit present in the original attempt", async () => {
    tx.loanRepayment.findUnique.mockResolvedValue({
      id: "repay-1",
      clientTransactionId: "tx-1",
      idempotencyFingerprint: validFingerprint,
    })
    tx.savingsTransaction.findUnique.mockResolvedValue({
      id: "savtx-1",
      savingsAccountId: "sav-1",
      amount: new Prisma.Decimal(50),
    })

    const response = await postBatch({
      date: "2026-10-20",
      centreId: "centre-1",
      entries: [
        {
          loanId: "loan-1",
          amount: 100,
          clientTransactionId: "tx-1",
          // compulsory savings omitted
        },
      ],
    })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: "This idempotency key has already been used with a different payment",
    })
    expect(record).not.toHaveBeenCalled()
  })

  it("recovers from P2002 on concurrent race if committed record matches payload", async () => {
    const p2002Error = Object.assign(new Error("Unique constraint failed"), { code: "P2002" })
    transaction.mockRejectedValue(p2002Error)

    const prismaMock = (await scopedDal()).prisma
    prismaMock.loanRepayment = {
      findUnique: jest.fn().mockResolvedValue({
        id: "repay-winner",
        clientTransactionId: "tx-race",
        idempotencyFingerprint: validFingerprint,
      }),
    }
    prismaMock.savingsTransaction = {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        if (where?.organizationId_reference?.reference === "tx-race:compulsory") {
          return Promise.resolve({
            id: "sav-winner",
            savingsAccountId: "sav-1",
            amount: new Prisma.Decimal(50),
          })
        }
        return Promise.resolve(null)
      }),
    }

    const response = await postBatch({
      date: "2026-10-20",
      centreId: "centre-1",
      entries: [
        {
          loanId: "loan-1",
          amount: 100,
          clientTransactionId: "tx-race",
          compulsorySavingsId: "sav-1",
          compulsorySavingsDeposit: 50,
        },
      ],
    })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.duplicates).toEqual([{ entryId: "tx-race", repaymentId: "repay-winner" }])
    expect(json.savedCount).toBe(0)
  })

  it("does not treat arbitrary P2002 as retry when no committed record matches", async () => {
    const p2002Error = Object.assign(new Error("Unique constraint failed"), { code: "P2002" })
    transaction.mockRejectedValue(p2002Error)

    const prismaMock = (await scopedDal()).prisma
    prismaMock.loanRepayment = {
      findUnique: jest.fn().mockResolvedValue(null),
    }

    const response = await postBatch({
      date: "2026-10-20",
      centreId: "centre-1",
      entries: [
        {
          loanId: "loan-1",
          amount: 100,
          clientTransactionId: "tx-unmatched",
        },
      ],
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Unique constraint failed" })
  })
})
