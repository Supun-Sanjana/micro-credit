import { Prisma, RepaymentMethod } from "@prisma/client"

export type PaymentIdempotencyPayload = {
  loanId: string
  scheduleId: string | null
  amount: string
  method: RepaymentMethod
}

export class PaymentIdempotencyConflictError extends Error {
  constructor() {
    super("This idempotency key has already been used with a different payment")
    this.name = "PaymentIdempotencyConflictError"
  }
}

/**
 * The fingerprint covers every field that changes the financial effect of a
 * scheduled payment. Notes and collection timestamps are deliberately absent:
 * they do not change the booked payment, and the field API supplies its date.
 */
export function normalizePaymentIdempotencyPayload(input: {
  loanId: string
  scheduleId?: string | null
  amount: Prisma.Decimal | number | string
  method?: RepaymentMethod | string | null
}): PaymentIdempotencyPayload {
  const amount = new Prisma.Decimal(input.amount)
  if (!amount.isFinite() || amount.lte(0) || amount.decimalPlaces() > 2) {
    throw new Error("Payment amount must be a positive amount with no more than two decimal places")
  }

  const method = input.method ?? RepaymentMethod.CASH
  if (!Object.values(RepaymentMethod).includes(method as RepaymentMethod)) {
    throw new Error("Unsupported payment method")
  }

  return {
    loanId: input.loanId.trim(),
    scheduleId: input.scheduleId?.trim() || null,
    amount: amount.toFixed(2),
    method: method as RepaymentMethod,
  }
}

export function paymentIdempotencyFingerprint(payload: PaymentIdempotencyPayload): string {
  // Property order is fixed by normalizePaymentIdempotencyPayload.
  return JSON.stringify(payload)
}

export function assertMatchingPaymentFingerprint(
  existing: { idempotencyFingerprint: string | null },
  fingerprint: string
): void {
  // Legacy payments predate the stored fingerprint. They cannot be safely
  // compared to a retry, so do not treat their key as an idempotent success.
  if (!existing.idempotencyFingerprint || existing.idempotencyFingerprint !== fingerprint) {
    throw new PaymentIdempotencyConflictError()
  }
}
