import { InterestMethod, LoanCalculationMethod, LoanProduct, Prisma } from "@prisma/client"

export interface LoanCalculation {
  loanAmount: Prisma.Decimal
  totalReceivable: Prisma.Decimal
  installmentAmount: Prisma.Decimal
  weeklyRental: Prisma.Decimal
  finalPayment: Prisma.Decimal
  numberOfInstallments: number
  numberOfWeeks: number
}

export interface AmortizationLine {
  instalmentNumber: number
  payment: Prisma.Decimal
  interest: Prisma.Decimal
  principal: Prisma.Decimal
  closingBalance: Prisma.Decimal
}

export interface AmortizationSchedule {
  periodicRate: Prisma.Decimal
  lines: AmortizationLine[]
  loanAmount: Prisma.Decimal
  totalReceivable: Prisma.Decimal
  installmentAmount: Prisma.Decimal
  finalPayment: Prisma.Decimal
}

function instalmentCount(product: Pick<LoanProduct, "numberOfWeeks">): number {
  const n = product.numberOfWeeks
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error("Instalment count must be a positive integer")
  }
  return n
}

function isDecliningBalance(product: Pick<LoanProduct, "calculationMethod" | "interestMethod">): boolean {
  return (
    product.calculationMethod === LoanCalculationMethod.DECLINING_BALANCE ||
    product.calculationMethod === LoanCalculationMethod.FIXED_INSTALLMENT ||
    product.interestMethod === InterestMethod.DECLINING_BALANCE
  )
}

/**
 * Periodic rate for a declining-balance product.
 * `multiplier` is the flat term factor (1.17 = 17% over the full term).
 * The annuity uses that flat factor spread evenly across instalments.
 * `interestMethod NONE` charges no interest.
 */
export function decliningPeriodicRate(
  product: Pick<LoanProduct, "multiplier" | "interestMethod" | "numberOfWeeks">
): Prisma.Decimal {
  const n = instalmentCount(product)
  if (product.interestMethod === InterestMethod.NONE) return new Prisma.Decimal(0)
  const multiplier = new Prisma.Decimal(product.multiplier)
  if (multiplier.lt(1)) throw new Error("Multiplier cannot be less than 1")
  return multiplier.minus(1).dividedBy(n)
}

/**
 * Reducing-balance annuity. Each period's interest is the rounded balance
 * times the periodic rate. Every payment is rounded to two decimal places.
 * The final payment is the remaining principal plus that period's interest,
 * so the balance closes at zero and rounding is not left on the loan.
 */
export function buildAmortizationSchedule(
  loanAmount: number | Prisma.Decimal,
  product: LoanProduct
): AmortizationSchedule {
  const n = instalmentCount(product)
  const principal = new Prisma.Decimal(loanAmount).toDecimalPlaces(2)
  if (principal.lte(0)) throw new Error("Loan amount must be greater than zero")

  const periodicRate = decliningPeriodicRate(product)
  const one = new Prisma.Decimal(1)
  const rawInstallment = periodicRate.eq(0)
    ? principal.dividedBy(n)
    : principal
        .mul(periodicRate)
        .mul(one.plus(periodicRate).pow(n))
        .dividedBy(one.plus(periodicRate).pow(n).minus(1))
  const installment = rawInstallment.toDecimalPlaces(2)

  let balance = principal
  const lines: AmortizationLine[] = []

  for (let i = 1; i <= n; i++) {
    const interest = balance.mul(periodicRate).toDecimalPlaces(2)
    const isLast = i === n
    let payment: Prisma.Decimal
    let principalPortion: Prisma.Decimal

    if (isLast) {
      principalPortion = balance
      payment = balance.plus(interest).toDecimalPlaces(2)
    } else {
      payment = installment
      principalPortion = payment.minus(interest)
      if (principalPortion.gt(balance)) {
        principalPortion = balance
        payment = principalPortion.plus(interest).toDecimalPlaces(2)
      }
    }

    balance = balance.minus(principalPortion).toDecimalPlaces(2)
    if (isLast) balance = new Prisma.Decimal(0)

    lines.push({
      instalmentNumber: i,
      payment,
      interest,
      principal: principalPortion,
      closingBalance: balance,
    })
  }

  const totalReceivable = lines.reduce(
    (sum, line) => sum.plus(line.payment),
    new Prisma.Decimal(0)
  )

  return {
    periodicRate,
    lines,
    loanAmount: principal,
    totalReceivable,
    installmentAmount: installment,
    finalPayment: lines[n - 1].payment,
  }
}

export function calculateLoanTerms(
  loanAmount: number | Prisma.Decimal,
  product: LoanProduct
): LoanCalculation {
  const installments = instalmentCount(product)
  const amount = new Prisma.Decimal(loanAmount)

  if (isDecliningBalance(product)) {
    const schedule = buildAmortizationSchedule(amount, product)
    return {
      loanAmount: schedule.loanAmount,
      totalReceivable: schedule.totalReceivable,
      installmentAmount: schedule.installmentAmount,
      weeklyRental: schedule.installmentAmount,
      finalPayment: schedule.finalPayment,
      numberOfInstallments: installments,
      numberOfWeeks: installments,
    }
  }

  // FLAT: total receivable is principal × multiplier. The final instalment
  // absorbs the rounding difference against that fixed total.
  const multiplier = new Prisma.Decimal(product.multiplier)
  const totalReceivable = amount.mul(multiplier)
  const installmentAmount = totalReceivable.dividedBy(installments)

  const roundedReceivable = totalReceivable.toDecimalPlaces(2)
  const roundedInstallment = installmentAmount.toDecimalPlaces(2)

  const totalPaidBeforeLast = roundedInstallment.mul(installments - 1)
  const finalPayment = roundedReceivable.minus(totalPaidBeforeLast)

  return {
    loanAmount: amount.toDecimalPlaces(2),
    totalReceivable: roundedReceivable,
    installmentAmount: roundedInstallment,
    weeklyRental: roundedInstallment,
    finalPayment,
    numberOfInstallments: installments,
    numberOfWeeks: installments,
  }
}
