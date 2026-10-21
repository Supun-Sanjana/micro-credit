import { InterestMethod, LoanCalculationMethod, LoanProduct, Prisma, RepaymentFrequency } from "@prisma/client"
import { buildAmortizationSchedule, calculateLoanTerms, decliningPeriodicRate } from "../calc-engine"

function product(overrides: Partial<LoanProduct> = {}): LoanProduct {
  return {
    id: "prod-1",
    name: "Test",
    loanType: "QUICK",
    numberOfWeeks: 13,
    organizationId: "org-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    multiplier: new Prisma.Decimal("1.17"),
    calculationMethod: LoanCalculationMethod.FLAT,
    interestMethod: InterestMethod.FLAT,
    repaymentFrequency: "WEEKLY",
    term: null,
    gracePeriod: 0,
    minimumAmount: null,
    maximumAmount: null,
    minimumTerm: null,
    maximumTerm: null,
    ...overrides,
  } as LoanProduct
}

describe("calc-engine", () => {
  describe("FLAT", () => {
    it("keeps the multiplier total and lets the final instalment absorb rounding", () => {
      const terms = calculateLoanTerms(1000, product({ numberOfWeeks: 3, multiplier: new Prisma.Decimal("1.10") }))

      expect(terms.totalReceivable.toFixed(2)).toBe("1100.00")
      expect(terms.installmentAmount.toFixed(2)).toBe("366.67")
      expect(terms.finalPayment.toFixed(2)).toBe("366.66")
      expect(terms.weeklyRental.toFixed(2)).toBe("366.67")
      expect(terms.numberOfInstallments).toBe(3)

      const paid = terms.installmentAmount.mul(2).plus(terms.finalPayment)
      expect(paid.toFixed(2)).toBe(terms.totalReceivable.toFixed(2))
    })

    it("does not change an evenly divisible flat loan", () => {
      const terms = calculateLoanTerms(10000, product({ numberOfWeeks: 13, multiplier: new Prisma.Decimal("1.17") }))
      expect(terms.totalReceivable.toFixed(2)).toBe("11700.00")
      expect(terms.installmentAmount.toFixed(2)).toBe("900.00")
      expect(terms.finalPayment.toFixed(2)).toBe("900.00")
    })
  })

  describe("DECLINING_BALANCE", () => {
    const declining = product({
      numberOfWeeks: 3,
      multiplier: new Prisma.Decimal("1.30"),
      calculationMethod: LoanCalculationMethod.DECLINING_BALANCE,
      interestMethod: InterestMethod.DECLINING_BALANCE,
    })

    it("walks the balance to zero and sets the final payment from remaining principal plus interest", () => {
      const schedule = buildAmortizationSchedule(1000, declining)
      const terms = calculateLoanTerms(1000, declining)

      expect(schedule.lines.map((line) => line.payment.toFixed(2))).toEqual(["402.11", "402.11", "402.13"])
      expect(schedule.lines.map((line) => line.interest.toFixed(2))).toEqual(["100.00", "69.79", "36.56"])
      expect(schedule.lines.map((line) => line.principal.toFixed(2))).toEqual(["302.11", "332.32", "365.57"])
      expect(schedule.lines[2].closingBalance.toFixed(2)).toBe("0.00")

      const last = schedule.lines[2]
      const opening = new Prisma.Decimal("365.57")
      expect(last.payment.toFixed(2)).toBe(opening.plus(last.interest).toFixed(2))
      expect(last.payment.toFixed(2)).not.toBe(terms.installmentAmount.toFixed(2))

      const principalRepaid = schedule.lines.reduce((sum, line) => sum.plus(line.principal), new Prisma.Decimal(0))
      expect(principalRepaid.toFixed(2)).toBe("1000.00")

      const summed = schedule.lines.reduce((sum, line) => sum.plus(line.payment), new Prisma.Decimal(0))
      expect(terms.totalReceivable.toFixed(2)).toBe(summed.toFixed(2))
      expect(terms.totalReceivable.toFixed(2)).toBe("1206.35")
      expect(terms.finalPayment.toFixed(2)).toBe("402.13")
      expect(terms.totalReceivable.eq(new Prisma.Decimal(1000).mul("1.30"))).toBe(false)
    })

    it("absorbs a zero-interest rounding difference in the final payment", () => {
      const interestFree = product({
        numberOfWeeks: 3,
        multiplier: new Prisma.Decimal(1),
        calculationMethod: LoanCalculationMethod.DECLINING_BALANCE,
        interestMethod: InterestMethod.NONE,
      })
      const schedule = buildAmortizationSchedule(100, interestFree)

      expect(schedule.lines.map((line) => line.payment.toFixed(2))).toEqual(["33.33", "33.33", "33.34"])
      expect(schedule.lines[2].closingBalance.toFixed(2)).toBe("0.00")
      expect(schedule.totalReceivable.toFixed(2)).toBe("100.00")
    })

    it("treats interestMethod DECLINING_BALANCE as reducing balance even when the calculation method is flat", () => {
      const terms = calculateLoanTerms(
        1000,
        product({
          numberOfWeeks: 3,
          multiplier: new Prisma.Decimal("1.30"),
          calculationMethod: LoanCalculationMethod.FLAT,
          interestMethod: InterestMethod.DECLINING_BALANCE,
        })
      )
      expect(terms.finalPayment.toFixed(2)).toBe("402.13")
      expect(terms.totalReceivable.toFixed(2)).toBe("1206.35")
    })

    it("uses the legacy whole-term multiplier as a nominal weekly term rate", () => {
      const weekly = product({
        numberOfWeeks: 13,
        multiplier: new Prisma.Decimal("1.17"),
        calculationMethod: LoanCalculationMethod.DECLINING_BALANCE,
        interestMethod: InterestMethod.DECLINING_BALANCE,
        repaymentFrequency: RepaymentFrequency.WEEKLY,
      })

      const schedule = buildAmortizationSchedule(1000, weekly)

      expect(decliningPeriodicRate(weekly).toFixed(12)).toBe("0.013076923077")
      expect(schedule.lines[0].payment.toFixed(2)).toBe("84.15")
      expect(schedule.lines[0].interest.toFixed(2)).toBe("13.08")
      expect(schedule.lines.at(-1)?.closingBalance.toFixed(2)).toBe("0.00")
    })

    it("uses the same term-rate convention for monthly schedules and reconciles rounding in the final instalment", () => {
      const monthly = product({
        numberOfWeeks: 12,
        multiplier: new Prisma.Decimal("1.12"),
        calculationMethod: LoanCalculationMethod.DECLINING_BALANCE,
        interestMethod: InterestMethod.DECLINING_BALANCE,
        repaymentFrequency: RepaymentFrequency.MONTHLY,
      })

      const schedule = buildAmortizationSchedule(1200, monthly)

      expect(decliningPeriodicRate(monthly).toFixed(4)).toBe("0.0100")
      expect(schedule.lines[0]).toMatchObject({
        payment: new Prisma.Decimal("106.62"),
        interest: new Prisma.Decimal("12.00"),
        principal: new Prisma.Decimal("94.62"),
      })
      expect(schedule.lines.at(-1)?.payment.toFixed(2)).toBe("106.60")
      expect(schedule.totalReceivable.toFixed(2)).toBe("1279.42")
      expect(schedule.lines.reduce((sum, line) => sum.plus(line.principal), new Prisma.Decimal(0)).toFixed(2)).toBe("1200.00")
    })
  })

  describe("invalid inputs", () => {
    it.each([0, -1, 1.5])("rejects instalment count %s", (numberOfWeeks) => {
      expect(() => calculateLoanTerms(1000, product({ numberOfWeeks }))).toThrow(/positive integer/)
      expect(() =>
        calculateLoanTerms(
          1000,
          product({ numberOfWeeks, calculationMethod: LoanCalculationMethod.DECLINING_BALANCE })
        )
      ).toThrow(/positive integer/)
    })

    it("rejects a non-positive declining-balance principal", () => {
      expect(() =>
        buildAmortizationSchedule(0, product({ calculationMethod: LoanCalculationMethod.DECLINING_BALANCE }))
      ).toThrow(/greater than zero/)
    })

    it("rejects a declining-balance multiplier below one and an unsupported custom cadence", () => {
      expect(() =>
        buildAmortizationSchedule(1000, product({
          multiplier: new Prisma.Decimal("0.99"),
          calculationMethod: LoanCalculationMethod.DECLINING_BALANCE,
          interestMethod: InterestMethod.DECLINING_BALANCE,
        }))
      ).toThrow(/at least 1/)
      expect(() =>
        buildAmortizationSchedule(1000, product({
          calculationMethod: LoanCalculationMethod.DECLINING_BALANCE,
          interestMethod: InterestMethod.DECLINING_BALANCE,
          repaymentFrequency: RepaymentFrequency.CUSTOM,
        }))
      ).toThrow(/CUSTOM repayment frequency/)
    })
  })
})
