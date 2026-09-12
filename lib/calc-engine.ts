import { LoanProduct } from "@prisma/client"
import { Prisma } from "@prisma/client"

export interface LoanCalculation {
  loanAmount: Prisma.Decimal
  totalReceivable: Prisma.Decimal
  weeklyRental: Prisma.Decimal
  finalPayment: Prisma.Decimal
  numberOfWeeks: number
}

/**
 * Calculates the loan repayment terms based on a flat-rate multiplier.
 * totalReceivable = loanAmount * multiplier
 * weeklyRental = totalReceivable / numberOfWeeks
 * 
 * In real microfinance, weeklyRental is usually rounded to the nearest integer
 * to avoid fractional currency (cents), but based on SGP data (4500, 6500, 2700),
 * it perfectly divides. If it doesn't, we round to 2 decimal places and
 * adjust the final payment.
 */
export function calculateLoanTerms(loanAmount: number | Prisma.Decimal, product: LoanProduct) {
  const amount = new Prisma.Decimal(loanAmount)
  const multiplier = new Prisma.Decimal(product.multiplier)
  const weeks = new Prisma.Decimal(product.numberOfWeeks)

  const totalReceivable = amount.mul(multiplier)
  const weeklyRental = totalReceivable.dividedBy(weeks)

  const roundedReceivable = totalReceivable.toDecimalPlaces(2)
  const roundedWeeklyRental = weeklyRental.toDecimalPlaces(2)

  // Calculate what the final payment should be to cover rounding differences
  const totalPaidBeforeLast = roundedWeeklyRental.mul(weeks.minus(1))
  const finalPayment = roundedReceivable.minus(totalPaidBeforeLast)

  return {
    loanAmount: amount.toDecimalPlaces(2),
    totalReceivable: roundedReceivable,
    weeklyRental: roundedWeeklyRental,
    finalPayment: finalPayment,
    numberOfWeeks: product.numberOfWeeks
  }
}
