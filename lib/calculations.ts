/**
 * Calculates a flat-rate loan schedule.
 * 
 * @param loanAmount The principal amount disbursed
 * @param weeklyRental The fixed weekly instalment to pay
 * @param numberOfWeeks The duration of the loan in weeks
 * @returns Object containing the calculated total receivable and flat interest
 */
export function calculateFlatRateLoan(
  loanAmount: number,
  weeklyRental: number,
  numberOfWeeks: number
) {
  const totalReceivable = weeklyRental * numberOfWeeks
  const flatInterest = totalReceivable - loanAmount

  return {
    totalReceivable,
    flatInterest,
  }
}

/**
 * Generates an expected repayment schedule (dates and amounts)
 * 
 * @param grantedDate Date the loan was disbursed
 * @param weeklyRental The weekly instalment amount
 * @param numberOfWeeks The term of the loan
 * @returns Array of scheduled instalments
 */
export function generateRepaymentSchedule(
  grantedDate: Date,
  weeklyRental: number,
  numberOfWeeks: number
) {
  const schedule = []
  
  // Assuming payments start 1 week after granted date
  for (let i = 1; i <= numberOfWeeks; i++) {
    const scheduledDate = new Date(grantedDate)
    scheduledDate.setDate(scheduledDate.getDate() + (i * 7))
    
    schedule.push({
      instalmentNumber: i,
      scheduledDate,
      amount: weeklyRental
    })
  }
  
  return schedule
}
