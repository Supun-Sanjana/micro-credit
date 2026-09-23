import { Prisma } from '@prisma/client'
import { RiskGrade } from '@prisma/client'

export interface CreditEngineInput {
  totalLoans: number
  activeLoans: number
  settledLoans: number
  defaultedLoans: number
  settledPaid: number
  settledReceivable: number
  hasOverdueLoan30Days: boolean
  monthlyIncome: number
  householdIncome: number
  existingObligations: number
  currentOutstanding: number
  weeklyRentalOutstanding: number
  onTimeStreak: number
}

export interface CreditEngineOutput {
  score: number
  grade: RiskGrade
  factors: string[]
  inputs: Record<string, any>
  computed: {
    totalLoans: number
    activeLoans: number
    settledLoans: number
    defaultedLoans: number
    repaymentRate: number
    averageDaysLate: number | null
    currentOutstanding: number
    debtToIncomeRatio: number
  }
}

export function calculateCreditScore(input: CreditEngineInput): CreditEngineOutput {
  let score = 0
  const factors: string[] = []

  // Repayment rate (Max 35)
  let repaymentRate = 0
  if (input.settledReceivable > 0) {
    repaymentRate = Math.min(1, input.settledPaid / input.settledReceivable)
    const repaymentPoints = Math.round(repaymentRate * 35)
    score += repaymentPoints
    factors.push(`${repaymentPoints >= 30 ? '+' : '-'} Repayment rate is ${Math.round(repaymentRate * 100)}%`)
  } else if (input.totalLoans > 0) {
    factors.push('- No settled loans yet')
  }

  // PAR status (Max 25)
  if (input.hasOverdueLoan30Days) {
    factors.push('- Current loan is overdue >30 days (-25 pts)')
  } else {
    score += 25
    factors.push('+ No active loans overdue >30 days')
  }

  // Loan history (Max 15)
  const historyPoints = Math.min(15, input.settledLoans * 5)
  score += historyPoints
  if (input.settledLoans > 0) {
    factors.push(`+ ${input.settledLoans} successfully settled loans`)
  }

  // Default penalty
  const defaultPenalty = input.defaultedLoans * 10
  score -= defaultPenalty
  if (input.defaultedLoans > 0) {
    factors.push(`- ${input.defaultedLoans} defaulted/written-off loans (-${defaultPenalty} pts)`)
  }

  // Debt-to-income (Max 15)
  const totalIncome = input.monthlyIncome + (input.householdIncome || 0)
  // Approximate monthly payment for DTI: (weekly rental * 4.33) + existing obligations
  const monthlyLoanPayment = input.weeklyRentalOutstanding * 4.33
  const totalObligations = input.existingObligations + monthlyLoanPayment
  let debtToIncomeRatio = 0
  
  if (totalIncome > 0) {
    debtToIncomeRatio = totalObligations / totalIncome
  } else if (totalObligations > 0) {
    debtToIncomeRatio = 1
  }

  // Score DTI: 15 points at 0%, 0 points at >= 80%
  let dtiPoints = 0
  if (debtToIncomeRatio < 0.8) {
    dtiPoints = Math.round((1 - (debtToIncomeRatio / 0.8)) * 15)
    score += dtiPoints
    factors.push(`+ DTI is ${Math.round(debtToIncomeRatio * 100)}%`)
  } else {
    factors.push(`- High Debt-to-Income ratio (${Math.round(debtToIncomeRatio * 100)}%)`)
  }

  // On-time streak (Max 10)
  const streakPoints = Math.min(10, input.onTimeStreak * 2)
  score += streakPoints
  if (input.onTimeStreak > 0) {
    factors.push(`+ ${input.onTimeStreak} recent on-time payments`)
  }

  // Ensure score is within 0-100
  score = Math.max(0, Math.min(100, score))

  let grade: RiskGrade = RiskGrade.D
  if (score >= 75) grade = RiskGrade.A
  else if (score >= 50) grade = RiskGrade.B
  else if (score >= 25) grade = RiskGrade.C

  return {
    score,
    grade,
    factors,
    inputs: input,
    computed: {
      totalLoans: input.totalLoans,
      activeLoans: input.activeLoans,
      settledLoans: input.settledLoans,
      defaultedLoans: input.defaultedLoans,
      repaymentRate,
      averageDaysLate: null,
      currentOutstanding: input.currentOutstanding,
      debtToIncomeRatio
    }
  }
}
