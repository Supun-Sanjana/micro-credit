import {
  calculateLoanTerms,
  generateAmortizationSchedule,
  periodsPerYear,
} from '../calc-engine'
import { Prisma } from '@prisma/client'

function makeProduct(overrides: {
  numberOfWeeks?: number
  multiplier?: number
  interestMethod?: 'FLAT' | 'DECLINING_BALANCE' | 'NONE'
  repaymentFrequency?: 'WEEKLY' | 'MONTHLY' | 'BIWEEKLY' | 'DAILY'
  calculationMethod?: 'FLAT' | 'DECLINING_BALANCE' | 'FIXED_INSTALLMENT'
}): any {
  return {
    id: 'test-product',
    name: 'Test Product',
    loanType: 'MICRO',
    numberOfWeeks: overrides.numberOfWeeks ?? 24,
    multiplier: overrides.multiplier ?? 1.17,
    interestMethod: overrides.interestMethod ?? 'FLAT',
    repaymentFrequency: overrides.repaymentFrequency ?? 'WEEKLY',
    calculationMethod: overrides.calculationMethod ?? 'FLAT',
    organizationId: 'org-1',
    gracePeriod: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    term: null,
    minimumAmount: null,
    maximumAmount: null,
    minimumTerm: null,
    maximumTerm: null,
  }
}

describe('calculateLoanTerms — Input Validations', () => {
  const validProduct = makeProduct({ numberOfWeeks: 24, multiplier: 1.17 })

  it('rejects zero loan amount', () => {
    expect(() => calculateLoanTerms(0, validProduct)).toThrow('Loan amount must be greater than zero')
  })

  it('rejects negative loan amount', () => {
    expect(() => calculateLoanTerms(-500, validProduct)).toThrow('Loan amount must be greater than zero')
  })

  it('rejects zero or negative installment counts', () => {
    expect(() => calculateLoanTerms(1000, makeProduct({ numberOfWeeks: 0 }))).toThrow(
      'Number of installments must be a positive integer'
    )
    expect(() => calculateLoanTerms(1000, makeProduct({ numberOfWeeks: -5 }))).toThrow(
      'Number of installments must be a positive integer'
    )
  })

  it('rejects non-integer installment counts', () => {
    expect(() => calculateLoanTerms(1000, makeProduct({ numberOfWeeks: 12.5 }))).toThrow(
      'Number of installments must be a positive integer'
    )
  })

  it('rejects negative interest multiplier', () => {
    expect(() => calculateLoanTerms(1000, makeProduct({ multiplier: -1.5 }))).toThrow(
      'Interest rate multiplier cannot be negative'
    )
  })
})

describe('calculateLoanTerms — FLAT (multiplier) path', () => {
  it('computes correct totals for a 24-week 1.17x product', () => {
    const product = makeProduct({ numberOfWeeks: 24, multiplier: 1.17 })
    const result = calculateLoanTerms(1000, product)

    expect(result.loanAmount.toNumber()).toBe(1000)
    expect(result.totalReceivable.toNumber()).toBe(1170)
    expect(result.installmentAmount.toNumber()).toBe(48.75)
    expect(result.weeklyRental.toNumber()).toBe(48.75)
    expect(result.finalPayment.toNumber()).toBe(48.75)
    expect(result.numberOfInstallments).toBe(24)
    expect(result.numberOfWeeks).toBe(24)
  })

  it('handles rounding in FLAT path: final payment absorbs rounding delta', () => {
    // 1000 * 1.17 = 1170 / 7 = 167.142857... → regular installment rounds to 167.14
    // 167.14 * 6 = 1002.84
    // Final payment = 1170 - 1002.84 = 167.16
    const product = makeProduct({ numberOfWeeks: 7, multiplier: 1.17 })
    const result = calculateLoanTerms(1000, product)

    expect(result.totalReceivable.toNumber()).toBe(1170)
    expect(result.installmentAmount.toNumber()).toBe(167.14)
    expect(result.finalPayment.toNumber()).toBe(167.16)

    // Sum of all payments equals totalReceivable exactly
    const sumAllPayments = result.installmentAmount.mul(6).plus(result.finalPayment)
    expect(sumAllPayments.toNumber()).toBe(result.totalReceivable.toNumber())
  })

  it('NONE interestMethod falls through to the FLAT path and uses multiplier', () => {
    const product = makeProduct({
      numberOfWeeks: 24,
      multiplier: 1.0,
      interestMethod: 'NONE',
    })
    const result = calculateLoanTerms(1000, product)
    expect(result.totalReceivable.toNumber()).toBe(1000)
    expect(result.installmentAmount.toNumber()).toBe(41.67)
    // 41.67 * 23 = 958.41; Final = 1000 - 958.41 = 41.59
    expect(result.finalPayment.toNumber()).toBe(41.59)
    expect(result.installmentAmount.mul(23).plus(result.finalPayment).toNumber()).toBe(1000)
  })
})

describe('calculateLoanTerms — DECLINING_BALANCE path', () => {
  it('computes correct periodic interest and absorbing final payment', () => {
    const product = makeProduct({
      numberOfWeeks: 24,
      multiplier: 18, // 18% annual rate
      interestMethod: 'DECLINING_BALANCE',
      repaymentFrequency: 'WEEKLY',
    })
    const result = calculateLoanTerms(1000, product)

    expect(result.installmentAmount.toNumber()).toBeGreaterThan(1000 / 24)
    expect(result.totalReceivable.toNumber()).toBeGreaterThan(1000)

    // Total receivable must equal sum of (n - 1) regular installments + finalPayment exactly
    const sumOfInstallments = result.installmentAmount.mul(23).plus(result.finalPayment)
    expect(sumOfInstallments.toNumber()).toBe(result.totalReceivable.toNumber())
  })

  it('final payment differs from regular installment when rounding creates residual balance', () => {
    // 1000 loan at 15% p.a., 13 installments (odd number prone to cent rounding)
    const product = makeProduct({
      numberOfWeeks: 13,
      multiplier: 15,
      interestMethod: 'DECLINING_BALANCE',
      repaymentFrequency: 'WEEKLY',
    })
    const result = calculateLoanTerms(1000, product)
    const schedule = generateAmortizationSchedule(1000, product)

    // Verify amortization ends at exactly zero balance
    expect(schedule[schedule.length - 1].remainingBalance.toNumber()).toBe(0)

    // Sum of all payments equals totalReceivable exactly
    const totalPayments = schedule.reduce((sum, s) => sum.plus(s.installmentAmount), new Prisma.Decimal(0))
    expect(totalPayments.toNumber()).toBe(result.totalReceivable.toNumber())

    // Sum of principal portions equals original principal exactly
    const totalPrincipal = schedule.reduce((sum, s) => sum.plus(s.principalPortion), new Prisma.Decimal(0))
    expect(totalPrincipal.toNumber()).toBe(1000)
  })

  it('generates schedule where remaining balance reaches zero on final installment', () => {
    const product = makeProduct({
      numberOfWeeks: 24,
      multiplier: 24, // 24% annual rate
      interestMethod: 'DECLINING_BALANCE',
      repaymentFrequency: 'WEEKLY',
    })
    const schedule = generateAmortizationSchedule(5000, product)

    expect(schedule.length).toBe(24)

    // Each period's principal + interest equals its installment amount
    for (const entry of schedule) {
      const sum = entry.principalPortion.plus(entry.interestPortion)
      expect(sum.toNumber()).toBe(entry.installmentAmount.toNumber())
    }

    // Balance at final period is 0
    expect(schedule[23].remainingBalance.toNumber()).toBe(0)

    // Total principal repaid is exactly 5000
    const totalPrincipalRepaid = schedule.reduce((sum, e) => sum.plus(e.principalPortion), new Prisma.Decimal(0))
    expect(totalPrincipalRepaid.toNumber()).toBe(5000)
  })

  it('zero-rate declining balance equals simple principal split and zero interest', () => {
    const product = makeProduct({
      numberOfWeeks: 7,
      multiplier: 0,
      interestMethod: 'DECLINING_BALANCE',
      repaymentFrequency: 'WEEKLY',
    })
    const result = calculateLoanTerms(1000, product)
    const schedule = generateAmortizationSchedule(1000, product)

    expect(result.totalReceivable.toNumber()).toBe(1000)
    // 1000 / 7 = 142.85 base installment
    expect(result.installmentAmount.toNumber()).toBe(142.85)
    // 142.85 * 6 = 857.10; final payment = 1000 - 857.10 = 142.90
    expect(result.finalPayment.toNumber()).toBe(142.9)

    expect(schedule[6].remainingBalance.toNumber()).toBe(0)
    const totalInterest = schedule.reduce((sum, s) => sum.plus(s.interestPortion), new Prisma.Decimal(0))
    expect(totalInterest.toNumber()).toBe(0)
  })

  it('higher interest rate produces higher totalReceivable than lower rate', () => {
    const base = { numberOfWeeks: 24, interestMethod: 'DECLINING_BALANCE' as const, repaymentFrequency: 'WEEKLY' as const }
    const low = calculateLoanTerms(1000, makeProduct({ ...base, multiplier: 12 }))
    const high = calculateLoanTerms(1000, makeProduct({ ...base, multiplier: 36 }))

    expect(high.totalReceivable.toNumber()).toBeGreaterThan(low.totalReceivable.toNumber())
  })

  it('monthly repayment frequency applies the correct 12-period divisor', () => {
    const product = makeProduct({
      numberOfWeeks: 12,
      multiplier: 12, // 12% p.a.
      interestMethod: 'DECLINING_BALANCE',
      repaymentFrequency: 'MONTHLY',
    })
    const result = calculateLoanTerms(12000, product)
    const schedule = generateAmortizationSchedule(12000, product)

    expect(result.installmentAmount.toNumber()).toBeGreaterThan(1000)
    expect(schedule[11].remainingBalance.toNumber()).toBe(0)
  })
})

describe('periodsPerYear utility', () => {
  it('maps repayment frequencies accurately', () => {
    expect(periodsPerYear('DAILY')).toBe(365)
    expect(periodsPerYear('BIWEEKLY')).toBe(26)
    expect(periodsPerYear('MONTHLY')).toBe(12)
    expect(periodsPerYear('WEEKLY')).toBe(52)
    expect(periodsPerYear('OTHER')).toBe(52)
  })
})
