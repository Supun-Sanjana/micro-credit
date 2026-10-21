import {
  assertMatchingPaymentFingerprint,
  normalizePaymentIdempotencyPayload,
  paymentIdempotencyFingerprint,
  PaymentIdempotencyConflictError,
} from "../payment-idempotency"

describe("payment idempotency payload", () => {
  const fingerprint = paymentIdempotencyFingerprint(normalizePaymentIdempotencyPayload({
    loanId: "loan-1",
    scheduleId: "schedule-1",
    amount: 100,
    method: "CASH",
  }))

  it("uses one canonical fingerprint for equivalent money representations", () => {
    expect(paymentIdempotencyFingerprint(normalizePaymentIdempotencyPayload({
      loanId: "loan-1",
      scheduleId: "schedule-1",
      amount: "100.00",
      method: "CASH",
    }))).toBe(fingerprint)
  })

  it.each([
    { loanId: "loan-2", scheduleId: "schedule-1", amount: 100, method: "CASH" },
    { loanId: "loan-1", scheduleId: "schedule-1", amount: 101, method: "CASH" },
    { loanId: "loan-1", scheduleId: "schedule-1", amount: 100, method: "BANK_TRANSFER" },
    { loanId: "loan-1", scheduleId: "schedule-2", amount: 100, method: "CASH" },
  ])("treats materially different payloads as conflicts", (payload) => {
    const changed = paymentIdempotencyFingerprint(normalizePaymentIdempotencyPayload(payload))
    expect(() => assertMatchingPaymentFingerprint({ idempotencyFingerprint: fingerprint }, changed)).toThrow(PaymentIdempotencyConflictError)
  })

  it("rejects legacy keys without a comparable fingerprint", () => {
    expect(() => assertMatchingPaymentFingerprint({ idempotencyFingerprint: null }, fingerprint)).toThrow(PaymentIdempotencyConflictError)
  })

  it.each(["0", "-1", "1.001"])('rejects unsupported amount %s', (amount) => {
    expect(() => normalizePaymentIdempotencyPayload({ loanId: "loan-1", amount, method: "CASH" })).toThrow()
  })
})
