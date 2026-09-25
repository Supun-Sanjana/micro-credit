const fs = require('fs')
const file = 'app/api/loans/[id]/route.ts'
let content = fs.readFileSync(file, 'utf8')

// Add imports
if (!content.includes('import { addDays, addMonths } from "date-fns"')) {
    content = 'import { addDays, addMonths } from "date-fns"\n' + content;
}

const oldStr = `        // Generate exactly N rows, 7 days apart
        let currentDate = new Date(grantedDate)
        for (let i = 1; i <= terms.numberOfWeeks; i++) {
          currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          
          let amount = terms.weeklyRental
          if (i === terms.numberOfWeeks) {
            amount = terms.finalPayment // Use the exact final payment to absorb pennies
          }
  
          schedules.push({
            instalmentNumber: i,
            scheduledDate: currentDate,
            scheduledAmount: amount,
            isPaid: false
          })
        }`

const newStr = `        const frequency = loan.loanProduct.repaymentFrequency || 'WEEKLY'
        if (frequency === 'CUSTOM') {
          throw new Error("CUSTOM repayment frequency is not yet supported")
        }

        let currentDate = new Date(grantedDate)
        for (let i = 1; i <= terms.numberOfInstallments; i++) {
          if (frequency === 'DAILY') {
            currentDate = addDays(currentDate, 1)
          } else if (frequency === 'WEEKLY') {
            currentDate = addDays(currentDate, 7)
          } else if (frequency === 'BIWEEKLY') {
            currentDate = addDays(currentDate, 14)
          } else if (frequency === 'MONTHLY') {
            currentDate = addMonths(currentDate, 1)
          }
          
          let amount = terms.installmentAmount
          if (i === terms.numberOfInstallments) {
            amount = terms.finalPayment // Use the exact final payment to absorb pennies
          }
  
          schedules.push({
            instalmentNumber: i,
            scheduledDate: currentDate,
            scheduledAmount: amount,
            isPaid: false
          })
        }`

content = content.replace(oldStr, newStr)
fs.writeFileSync(file, content)
console.log('Done')
