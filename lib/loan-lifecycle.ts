import { LoanStatus } from "@prisma/client"

const transitions: Partial<Record<LoanStatus, LoanStatus[]>> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["VERIFIED", "CANCELLED"],
  VERIFIED: ["APPROVED", "CANCELLED"],
  APPROVED: ["DISBURSED", "CANCELLED"],
  DISBURSED: ["ACTIVE"],
  ACTIVE: ["OVERDUE", "SETTLED", "DEFAULTED"],
  OVERDUE: ["ACTIVE", "SETTLED", "DEFAULTED"],
  // Compatibility path for records created before the lifecycle model.
  PENDING: ["VERIFIED", "APPROVED", "ACTIVE", "CANCELLED"],
}

export function assertLoanTransition(from: LoanStatus, to: LoanStatus) {
  if (!transitions[from]?.includes(to)) throw new Error(`Invalid loan status transition: ${from} → ${to}`)
}
