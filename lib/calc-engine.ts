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

export function calculateLoanTerms(loanAmount: number | Prisma.Decimal, product: LoanProduct): LoanCalculation {
  const amount = new Prisma.Decimal(loanAmount)
  const multiplier = new Prisma.Decimal(product.multiplier)
  const installments = new Prisma.Decimal(product.numberOfWeeks)

  const totalReceivable = amount.mul(multiplier)
  const installmentAmount = totalReceivable.dividedBy(installments)

  const roundedReceivable = totalReceivable.toDecimalPlaces(2)
  const roundedInstallment = installmentAmount.toDecimalPlaces(2)

  const totalPaidBeforeLast = roundedInstallment.mul(installments.minus(1))
  const finalPayment = roundedReceivable.minus(totalPaidBeforeLast)

  return {
    loanAmount: amount.toDecimalPlaces(2),
    totalReceivable: roundedReceivable,
    installmentAmount: roundedInstallment,
    weeklyRental: roundedInstallment, // alias for backward compatibility
    finalPayment: finalPayment,
    numberOfInstallments: product.numberOfWeeks,
    numberOfWeeks: product.numberOfWeeks // alias
  }
}
