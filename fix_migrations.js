const fs = require('fs')
const file = 'app/actions/migrations.ts'
let content = fs.readFileSync(file, 'utf8')

if (!content.includes('import { addDays, addMonths } from "date-fns"')) {
    content = 'import { addDays, addMonths } from "date-fns"\n' + content;
}

const oldStr = `        // Generate remaining schedule rows
        const schedules = []
        let currentDate = new Date()
        for (let i = 1; i <= weeksRemaining; i++) {
          currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          schedules.push({
            loanId: loan.id,
            instalmentNumber: product.numberOfWeeks - weeksRemaining + i,
            scheduledDate: currentDate,
            scheduledAmount: loan.weeklyRental,
            isPaid: false
          })
        }`

const newStr = `        // Generate remaining schedule rows
        const schedules = []
        let currentDate = new Date()
        const frequency = product.repaymentFrequency || 'WEEKLY'
        for (let i = 1; i <= weeksRemaining; i++) {
          if (frequency === 'DAILY') {
            currentDate = addDays(currentDate, 1)
          } else if (frequency === 'WEEKLY') {
            currentDate = addDays(currentDate, 7)
          } else if (frequency === 'BIWEEKLY') {
            currentDate = addDays(currentDate, 14)
          } else if (frequency === 'MONTHLY') {
            currentDate = addMonths(currentDate, 1)
          }
          
          schedules.push({
            loanId: loan.id,
            instalmentNumber: product.numberOfWeeks - weeksRemaining + i,
            scheduledDate: currentDate,
            scheduledAmount: loan.weeklyRental,
            isPaid: false
          })
        }`

content = content.replace(oldStr, newStr)
fs.writeFileSync(file, content)
console.log('Done')
