import { Prisma, PaymentAllocationComponent } from "@prisma/client"

export type Allocation = { component: PaymentAllocationComponent; amount: Prisma.Decimal }

/**
 * Allocates a new payment using the organization default: penalties, fees,
 * interest, then principal. Historical repayments are deliberately not inferred.
 */
export function allocatePayment(amount: Prisma.Decimal, balances: Record<PaymentAllocationComponent, Prisma.Decimal>): Allocation[] {
  let remaining = amount
  const allocations: Allocation[] = []
  for (const component of ["PENALTY", "FEE", "INTEREST", "PRINCIPAL"] as PaymentAllocationComponent[]) {
    const allocated = Prisma.Decimal.min(remaining, Prisma.Decimal.max(balances[component], 0))
    if (allocated.gt(0)) allocations.push({ component, amount: allocated })
    remaining = remaining.minus(allocated)
  }
  if (remaining.gt(0)) throw new Error("Payment exceeds the outstanding balance")
  return allocations
}

export function balancesFromLoan(loan: { loanAmount: Prisma.Decimal; totalReceivable: Prisma.Decimal; totalPaid: Prisma.Decimal }) {
  // The legacy multiplier represents principal plus flat interest. Applying the
  // documented waterfall to cumulative paid amount keeps new allocations stable.
  const interest = Prisma.Decimal.max(loan.totalReceivable.minus(loan.loanAmount), 0)
  const paidInterest = Prisma.Decimal.min(loan.totalPaid, interest)
  const paidPrincipal = Prisma.Decimal.max(loan.totalPaid.minus(interest), 0)
  return {
    PENALTY: new Prisma.Decimal(0),
    FEE: new Prisma.Decimal(0),
    INTEREST: interest.minus(paidInterest),
    PRINCIPAL: Prisma.Decimal.max(loan.loanAmount.minus(paidPrincipal), 0),
  } satisfies Record<PaymentAllocationComponent, Prisma.Decimal>
}

export type SchedulePortion = {
  scheduleId: string | null
  amount: Prisma.Decimal
}

export type ScheduleAllocation = {
  component: PaymentAllocationComponent
  amount: Prisma.Decimal
  scheduleId: string | null
}

/**
 * Distributes component allocations (interest, principal, fee, penalty) across
 * the affected schedules. Preserves total component allocations and per-schedule
 * totals while ensuring all allocated amounts are non-negative.
 */
export function distributeAllocationsToSchedules(
  allocations: Allocation[],
  schedulePortions: SchedulePortion[]
): ScheduleAllocation[] {
  if (schedulePortions.length === 0) {
    return allocations.map((a) => ({
      component: a.component,
      amount: a.amount,
      scheduleId: null,
    }))
  }

  const remainingComponents = allocations.map((a) => ({
    component: a.component,
    remaining: new Prisma.Decimal(a.amount),
  }))

  const result: ScheduleAllocation[] = []

  for (const portion of schedulePortions) {
    let portionRemaining = new Prisma.Decimal(portion.amount)

    for (const comp of remainingComponents) {
      if (portionRemaining.lte(0)) break
      if (comp.remaining.lte(0)) continue

      const allocAmount = Prisma.Decimal.min(portionRemaining, comp.remaining)
      if (allocAmount.gt(0)) {
        result.push({
          component: comp.component,
          amount: allocAmount,
          scheduleId: portion.scheduleId,
        })
        portionRemaining = portionRemaining.minus(allocAmount)
        comp.remaining = comp.remaining.minus(allocAmount)
      }
    }
  }

  for (const comp of remainingComponents) {
    if (comp.remaining.gt(0)) {
      result.push({
        component: comp.component,
        amount: comp.remaining,
        scheduleId: null,
      })
    }
  }

  return result
}

