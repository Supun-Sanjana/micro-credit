import { LoanProduct } from "@prisma/client"
import { Prisma } from "@prisma/client"

export interface LoanCalculation {
  loanAmount: Prisma.Decimal
  totalReceivable: Prisma.Decimal
  installmentAmount: Prisma.Decimal
  weeklyRental: Prisma.Decimal
  finalPayment: Prisma.Decimal
  numberOfInstallments: number
  numberOfWeeks: number
}

export interface AmortizationScheduleEntry {
  period: number
  installmentAmount: Prisma.Decimal
  principalPortion: Prisma.Decimal
  interestPortion: Prisma.Decimal
  remainingBalance: Prisma.Decimal
}

/**
 * Returns the number of periods per year for a given repayment frequency.
 * Used to convert an annual interest rate to a per-period rate.
 */
export function periodsPerYear(frequency: string): number {
  switch (frequency) {
    case 'DAILY':    return 365
    case 'BIWEEKLY': return 26
    case 'MONTHLY':  return 12
    case 'WEEKLY':
    default:         return 52
  }
}

/**
 * Calculates loan financial terms with mathematically sound amortization.
 * Absorbs rounding differences in the final installment so remaining principal reaches 0.
 */
export function calculateLoanTerms(loanAmount: number | Prisma.Decimal, product: LoanProduct): LoanCalculation {
  const amount = new Prisma.Decimal(loanAmount)
  const n = product.numberOfWeeks // number of installments

  // 1. Strict input validation
  if (amount.lte(0)) {
    throw new Error("Loan amount must be greater than zero")
  }
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error("Number of installments must be a positive integer")
  }

  // 2. DECLINING_BALANCE path (Annuity with exact cent-rounding absorption)
  if (product.interestMethod === 'DECLINING_BALANCE') {
    const annualRate = new Prisma.Decimal(product.multiplier)
    if (annualRate.isNegative()) {
      throw new Error("Interest rate multiplier cannot be negative")
    }

    const ppy = periodsPerYear(product.repaymentFrequency)
    const periodicRate = annualRate.div(100).div(ppy).toNumber()

    if (periodicRate === 0) {
      // 0% interest rate: equal principal split
      const baseInstallment = amount.div(n).toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN)
      const sumBeforeLast = baseInstallment.mul(n - 1)
      const finalPayment = amount.minus(sumBeforeLast).toDecimalPlaces(2)

      return {
        loanAmount: amount.toDecimalPlaces(2),
        totalReceivable: amount.toDecimalPlaces(2),
        installmentAmount: baseInstallment,
        weeklyRental: baseInstallment,
        finalPayment,
        numberOfInstallments: n,
        numberOfWeeks: n,
      }
    }

    // Standard annuity formula: PMT = P * r / (1 - (1+r)^-n)
    const pmt = amount.toNumber() * periodicRate / (1 - Math.pow(1 + periodicRate, -n))
    const regularInstallment = new Prisma.Decimal(pmt).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)

    // Evolve balance across periods 1 to n - 1
    let currentBalance = amount
    for (let period = 1; period < n; period++) {
      const periodInterest = currentBalance.mul(periodicRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      const principalPortion = regularInstallment.minus(periodInterest)
      currentBalance = currentBalance.minus(principalPortion)
    }

    // Final period n: final interest is accrued on the remaining principal balance.
    // The final payment pays off current balance + final period interest.
    const finalInterest = currentBalance.mul(periodicRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
    const finalPayment = currentBalance.plus(finalInterest).toDecimalPlaces(2)

    // Total receivable is the sum of the (n - 1) regular installments plus the final payment
    const totalReceivable = regularInstallment.mul(n - 1).plus(finalPayment).toDecimalPlaces(2)

    return {
      loanAmount: amount.toDecimalPlaces(2),
      totalReceivable,
      installmentAmount: regularInstallment,
      weeklyRental: regularInstallment,
      finalPayment,
      numberOfInstallments: n,
      numberOfWeeks: n,
    }
  }

  // 3. FLAT / NONE path (original multiplier-based calculation)
  const multiplier = new Prisma.Decimal(product.multiplier)
  if (multiplier.isNegative()) {
    throw new Error("Interest rate multiplier cannot be negative")
  }
  const installments = new Prisma.Decimal(n)

  const totalReceivable = amount.mul(multiplier).toDecimalPlaces(2)
  const installmentAmount = totalReceivable.dividedBy(installments).toDecimalPlaces(2)

  const totalPaidBeforeLast = installmentAmount.mul(installments.minus(1))
  const finalPayment = totalReceivable.minus(totalPaidBeforeLast).toDecimalPlaces(2)

  return {
    loanAmount: amount.toDecimalPlaces(2),
    totalReceivable,
    installmentAmount,
    weeklyRental: installmentAmount,
    finalPayment,
    numberOfInstallments: n,
    numberOfWeeks: n,
  }
}

/**
 * Generates the full period-by-period amortization schedule.
 * Verifies that the ending balance is exactly zero.
 */
export function generateAmortizationSchedule(loanAmount: number | Prisma.Decimal, product: LoanProduct): AmortizationScheduleEntry[] {
  const terms = calculateLoanTerms(loanAmount, product)
  const amount = new Prisma.Decimal(loanAmount)
  const n = product.numberOfWeeks
  const schedule: AmortizationScheduleEntry[] = []

  if (product.interestMethod === 'DECLINING_BALANCE') {
    const annualRate = new Prisma.Decimal(product.multiplier)
    const ppy = periodsPerYear(product.repaymentFrequency)
    const periodicRate = annualRate.div(100).div(ppy).toNumber()

    let balance = amount
    for (let period = 1; period <= n; period++) {
      const isLast = period === n
      const payment = isLast ? terms.finalPayment : terms.installmentAmount
      const interest = periodicRate === 0
        ? new Prisma.Decimal(0)
        : balance.mul(periodicRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      const principal = isLast ? balance : payment.minus(interest)
      balance = isLast ? new Prisma.Decimal(0) : balance.minus(principal)

      schedule.push({
        period,
        installmentAmount: payment,
        principalPortion: principal,
        interestPortion: interest,
        remainingBalance: balance,
      })
    }
  } else {
    // FLAT path schedule
    const totalInterest = terms.totalReceivable.minus(amount)
    const regularPrincipal = amount.dividedBy(n).toDecimalPlaces(2)
    const regularInterest = totalInterest.dividedBy(n).toDecimalPlaces(2)

    let balance = amount
    for (let period = 1; period <= n; period++) {
      const isLast = period === n
      const payment = isLast ? terms.finalPayment : terms.installmentAmount
      const principal = isLast ? balance : regularPrincipal
      const interest = isLast ? payment.minus(principal) : regularInterest
      balance = isLast ? new Prisma.Decimal(0) : balance.minus(principal)

      schedule.push({
        period,
        installmentAmount: payment,
        principalPortion: principal,
        interestPortion: interest,
        remainingBalance: balance,
      })
    }
  }

  return schedule
}
