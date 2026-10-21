import { POST } from "@/app/api/field/collect/route"
import { getScopedDal } from "@/lib/dal"
import { assertScheduleOwnership } from "@/lib/field-collection"
import { recordPayment } from "@/lib/services/payment-service"
import { normalizePaymentIdempotencyPayload, paymentIdempotencyFingerprint } from "@/lib/payment-idempotency"

jest.mock("@/lib/dal", () => ({
  getScopedDal: jest.fn(),
}))

jest.mock("@/lib/services/payment-service", () => ({
  recordPayment: jest.fn(),
}))

const scopedDal = getScopedDal as jest.Mock
const record = recordPayment as jest.Mock

function collect(body: unknown) {
  return POST(new Request("http://localhost/api/field/collect", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  }))
}

describe("assertScheduleOwnership", () => {
  const schedule = {
    loanId: "loan-1",
    loan: { member: { organizationId: "org-1" } },
  }

  it("accepts a schedule on the requested loan and organization", () => {
    expect(() => assertScheduleOwnership(schedule, "loan-1", "org-1")).not.toThrow()
  })

  it("rejects a schedule from another loan", () => {
    expect(() => assertScheduleOwnership(schedule, "loan-2", "org-1")).toThrow(/does not belong/)
  })

  it("rejects a schedule from another organization", () => {
    expect(() => assertScheduleOwnership(schedule, "loan-1", "org-2")).toThrow(/Schedule not found/)
  })
})

describe("POST /api/field/collect", () => {
  const tx = {
    loan: { findFirst: jest.fn() },
    fieldOfficerAssignment: { findFirst: jest.fn() },
    repaymentSchedule: { findFirst: jest.fn() },
    collectionAttempt: { create: jest.fn() },
  }
  const loanRepayment = { findUnique: jest.fn() }
  let transaction: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    transaction = jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx))
    scopedDal.mockResolvedValue({
      organizationId: "org-1",
      userId: "officer-1",
      prisma: { loanRepayment, $transaction: transaction },
    })
    tx.loan.findFirst.mockResolvedValue({
      id: "loan-1",
      member: { centreId: "centre-1", organizationId: "org-1" },
    })
    tx.fieldOfficerAssignment.findFirst.mockResolvedValue({ id: "assign-1" })
    tx.repaymentSchedule.findFirst.mockResolvedValue({
      id: "sched-1",
      loanId: "loan-1",
      loan: { member: { organizationId: "org-1" } },
    })
    tx.collectionAttempt.create.mockResolvedValue({ id: "attempt-1" })
    loanRepayment.findUnique.mockResolvedValue(null)
    record.mockResolvedValue({ id: "repay-1", clientTransactionId: "tx-1" })
  })

  const valid = {
    loanId: "loan-1",
    scheduleId: "sched-1",
    amount: 100,
    method: "CASH",
    clientTransactionId: "tx-1",
  }
  const validFingerprint = paymentIdempotencyFingerprint(normalizePaymentIdempotencyPayload(valid))

  it("accepts a schedule that belongs to the loan", async () => {
    const response = await collect(valid)
    expect(response.status).toBe(201)
    expect(record).toHaveBeenCalledWith(tx, expect.objectContaining({
      loanId: "loan-1",
      scheduleId: "sched-1",
      clientTransactionId: "tx-1",
    }))
    expect(tx.collectionAttempt.create).toHaveBeenCalledTimes(1)
  })

  it("rejects a schedule from another loan before recording a payment", async () => {
    tx.repaymentSchedule.findFirst.mockResolvedValue({
      id: "sched-2",
      loanId: "loan-9",
      loan: { member: { organizationId: "org-1" } },
    })
    const response = await collect({ ...valid, scheduleId: "sched-2" })
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Schedule does not belong to this loan" })
    expect(record).not.toHaveBeenCalled()
    expect(tx.collectionAttempt.create).not.toHaveBeenCalled()
  })

  it("rejects a schedule from another organization", async () => {
    tx.repaymentSchedule.findFirst.mockResolvedValue({
      id: "sched-x",
      loanId: "loan-1",
      loan: { member: { organizationId: "org-2" } },
    })
    const response = await collect({ ...valid, scheduleId: "sched-x" })
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Schedule not found" })
    expect(record).not.toHaveBeenCalled()
  })

  it.each([
    [{ scheduleId: "sched-1", amount: 10, clientTransactionId: "tx-1" }, "loanId is required"],
    [{ loanId: "", scheduleId: "sched-1", clientTransactionId: "tx-1" }, "loanId is required"],
    [{ loanId: "   ", clientTransactionId: "tx-1" }, "loanId is required"],
    [{ loanId: 12, clientTransactionId: "tx-1" }, "loanId must be a string"],
    [{ loanId: "loan-1", scheduleId: 9, clientTransactionId: "tx-1" }, "scheduleId must be a string"],
    [{ loanId: "loan-1", scheduleId: "sched-1" }, "clientTransactionId is required"],
    [{ loanId: "loan-1", clientTransactionId: "  " }, "clientTransactionId is required"],
  ])("rejects malformed input %#", async (body, error) => {
    const response = await collect(body)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error })
    expect(transaction).not.toHaveBeenCalled()
  })

  it("normalizes an empty scheduleId to no schedule and does not write an attempt", async () => {
    const response = await collect({ ...valid, scheduleId: "   " })
    expect(response.status).toBe(201)
    expect(tx.repaymentSchedule.findFirst).not.toHaveBeenCalled()
    expect(record).toHaveBeenCalledWith(tx, expect.objectContaining({ scheduleId: undefined }))
    expect(tx.collectionAttempt.create).not.toHaveBeenCalled()
  })

  it("returns the original collection on a retry with the same clientTransactionId", async () => {
    loanRepayment.findUnique.mockResolvedValue({ id: "repay-1", clientTransactionId: "tx-1", idempotencyFingerprint: validFingerprint })
    const response = await collect(valid)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(expect.objectContaining({ id: "repay-1", clientTransactionId: "tx-1" }))
    expect(transaction).not.toHaveBeenCalled()
    expect(tx.collectionAttempt.create).not.toHaveBeenCalled()
  })

  it.each([
    [{ amount: "101.00" }, "different amount"],
    [{ loanId: "loan-2" }, "different loan"],
    [{ method: "BANK_TRANSFER" }, "different method"],
  ])("rejects idempotency-key reuse with a %s", async (change, _description) => {
    loanRepayment.findUnique.mockResolvedValue({ id: "repay-1", clientTransactionId: "tx-1", idempotencyFingerprint: validFingerprint })

    const response = await collect({ ...valid, ...change })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: "This idempotency key has already been used with a different payment" })
    expect(transaction).not.toHaveBeenCalled()
  })

  it("normalizes equivalent currency representations before comparing a retry", async () => {
    loanRepayment.findUnique.mockResolvedValue({ id: "repay-1", clientTransactionId: "tx-1", idempotencyFingerprint: validFingerprint })

    const response = await collect({ ...valid, amount: "100.00" })

    expect(response.status).toBe(200)
    expect(transaction).not.toHaveBeenCalled()
  })

  it("returns the committed collection when a concurrent retry hits the unique constraint", async () => {
    record.mockRejectedValue(Object.assign(new Error("Unique constraint"), { code: "P2002" }))
    loanRepayment.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "repay-winner", clientTransactionId: "tx-1", idempotencyFingerprint: validFingerprint })

    const response = await collect(valid)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(expect.objectContaining({ id: "repay-winner", clientTransactionId: "tx-1" }))
    expect(tx.collectionAttempt.create).not.toHaveBeenCalled()
  })

  it("does not insert a second attempt when the attempt unique constraint loses the race", async () => {
    tx.collectionAttempt.create.mockRejectedValue(Object.assign(new Error("Unique constraint"), { code: "P2002" }))
    loanRepayment.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "repay-winner", clientTransactionId: "tx-1", idempotencyFingerprint: validFingerprint })

    const response = await collect(valid)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(expect.objectContaining({ id: "repay-winner" }))
    expect(tx.collectionAttempt.create).toHaveBeenCalledTimes(1)
  })

  it("permits two distinct partial payments against the same loan/schedule with distinct keys", async () => {
    record
      .mockResolvedValueOnce({ id: "repay-p1", clientTransactionId: "tx-part-1" })
      .mockResolvedValueOnce({ id: "repay-p2", clientTransactionId: "tx-part-2" })

    const first = await collect({ ...valid, amount: 40, clientTransactionId: "tx-part-1" })
    const second = await collect({ ...valid, amount: 60, clientTransactionId: "tx-part-2" })

    expect(first.status).toBe(201)
    expect(second.status).toBe(201)
    expect(record).toHaveBeenCalledTimes(2)
    expect(tx.collectionAttempt.create).toHaveBeenCalledTimes(2)
  })

  it("enforces tenant isolation on idempotency key lookups", async () => {
    await collect(valid)
    expect(loanRepayment.findUnique).toHaveBeenCalledWith({
      where: {
        organizationId_clientTransactionId: {
          organizationId: "org-1",
          clientTransactionId: "tx-1",
        },
      },
    })
  })
})
