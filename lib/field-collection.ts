import { Prisma, RepaymentMethod } from "@prisma/client"

export interface FieldCollectionInput {
  loanId: string
  scheduleId: string | null
  amount: Prisma.Decimal | number | string
  method?: RepaymentMethod | string | null
  clientTransactionId: string
  notes?: string
}

export type ScheduleOwnership = {
  loanId: string
  loan: { member: { organizationId: string } }
}

/**
 * A schedule from another loan or another organization must never be applied
 * to this collection. Cross-tenant ids are reported as not found so the
 * response does not reveal that the row exists.
 */
export function assertScheduleOwnership(
  schedule: ScheduleOwnership | null,
  loanId: string,
  organizationId: string
): asserts schedule is ScheduleOwnership {
  if (!schedule || schedule.loan.member.organizationId !== organizationId) {
    throw new Error("Schedule not found")
  }
  if (schedule.loanId !== loanId) {
    throw new Error("Schedule does not belong to this loan")
  }
}

export function parseFieldCollectionBody(
  body: unknown
): { ok: true; value: FieldCollectionInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid request body" }
  }
  const json = body as Record<string, unknown>

  if (json.loanId == null || (typeof json.loanId === "string" && json.loanId.trim() === "")) {
    return { ok: false, error: "loanId is required" }
  }
  if (typeof json.loanId !== "string") {
    return { ok: false, error: "loanId must be a string" }
  }

  let scheduleId: string | null = null
  if (json.scheduleId != null && json.scheduleId !== "") {
    if (typeof json.scheduleId !== "string") {
      return { ok: false, error: "scheduleId must be a string" }
    }
    const trimmed = json.scheduleId.trim()
    scheduleId = trimmed === "" ? null : trimmed
  }

  if (
    json.clientTransactionId == null ||
    (typeof json.clientTransactionId === "string" && json.clientTransactionId.trim() === "")
  ) {
    return { ok: false, error: "clientTransactionId is required" }
  }
  if (typeof json.clientTransactionId !== "string") {
    return { ok: false, error: "clientTransactionId must be a string" }
  }

  if (
    json.amount == null ||
    (typeof json.amount !== "number" &&
      typeof json.amount !== "string" &&
      !Prisma.Decimal.isDecimal(json.amount))
  ) {
    return { ok: false, error: "amount must be a valid number or decimal string" }
  }

  let method: RepaymentMethod | string | null = null
  if (json.method != null) {
    if (typeof json.method !== "string") {
      return { ok: false, error: "method must be a string" }
    }
    method = json.method
  }

  return {
    ok: true,
    value: {
      loanId: json.loanId.trim(),
      scheduleId,
      amount: json.amount,
      method,
      clientTransactionId: json.clientTransactionId.trim(),
      notes: typeof json.notes === "string" ? json.notes : undefined,
    },
  }
}
