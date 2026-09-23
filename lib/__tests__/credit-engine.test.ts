import { calculateCreditScore } from '../intelligence/credit-engine'
import { RiskGrade } from '@prisma/client'

describe('Credit Engine', () => {
  it('Perfect member gets grade A', () => {
    const result = calculateCreditScore({
      totalLoans: 3,
      activeLoans: 0,
      settledLoans: 3,
      defaultedLoans: 0,
      settledPaid: 3000,
      settledReceivable: 3000,
      hasOverdueLoan30Days: false,
      monthlyIncome: 10000,
      householdIncome: 2000,
      existingObligations: 1000,
      currentOutstanding: 0,
      weeklyRentalOutstanding: 0,
      onTimeStreak: 10
    })

    expect(result.grade).toBe(RiskGrade.A)
    expect(result.score).toBeGreaterThanOrEqual(75)
    expect(result.factors.some(f => f.includes('Repayment rate is 100%'))).toBe(true)
  })

  it('Member with 2 defaults gets grade D', () => {
    const result = calculateCreditScore({
      totalLoans: 5,
      activeLoans: 1,
      settledLoans: 2,
      defaultedLoans: 2,
      settledPaid: 2000,
      settledReceivable: 4000, // Poor repayment rate
      hasOverdueLoan30Days: true,
      monthlyIncome: 5000,
      householdIncome: 0,
      existingObligations: 1000,
      currentOutstanding: 1000,
      weeklyRentalOutstanding: 100,
      onTimeStreak: 0
    })

    expect(result.grade).toBe(RiskGrade.D)
    expect(result.score).toBeLessThan(50) // Definitely D
    expect(result.factors.some(f => f.includes('2 defaulted/written-off loans'))).toBe(true)
    expect(result.factors.some(f => f.includes('overdue >30 days'))).toBe(true)
  })

  it('Member with high DTI factors include DTI warning', () => {
    const result = calculateCreditScore({
      totalLoans: 1,
      activeLoans: 1,
      settledLoans: 0,
      defaultedLoans: 0,
      settledPaid: 0,
      settledReceivable: 0,
      hasOverdueLoan30Days: false,
      monthlyIncome: 1000,
      householdIncome: 0,
      existingObligations: 800,
      currentOutstanding: 1000,
      weeklyRentalOutstanding: 100, // Monthly payment approx 433
      onTimeStreak: 2
    })
    
    // Obligations: 800 + 433 = 1233. Income: 1000. DTI > 100%
    expect(result.factors.some(f => f.includes('High Debt-to-Income ratio'))).toBe(true)
  })

  it('Zero-history member gets grade C (neutral)', () => {
    const result = calculateCreditScore({
      totalLoans: 0,
      activeLoans: 0,
      settledLoans: 0,
      defaultedLoans: 0,
      settledPaid: 0,
      settledReceivable: 0,
      hasOverdueLoan30Days: false,
      monthlyIncome: 5000,
      householdIncome: 0,
      existingObligations: 0,
      currentOutstanding: 0,
      weeklyRentalOutstanding: 0,
      onTimeStreak: 0
    })

    // Repayment: 0 pts, PAR: 25 pts, History: 0, Default: 0, DTI: 15 pts, Streak: 0 -> total 40 pts
    expect(result.grade).toBe(RiskGrade.C)
    expect(result.score).toBe(40)
  })
})
