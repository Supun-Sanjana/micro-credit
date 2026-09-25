const fs = require('fs')

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8')
    let startStr = '        // Generate exactly N rows, 7 days apart'
    if (!content.includes(startStr)) {
        startStr = '        // Generate remaining schedule rows'
    }
    
    let endStr = '          })'
    let idx1 = content.indexOf(startStr)
    let idx2 = content.indexOf('        }', idx1)
    
    if (idx1 !== -1 && idx2 !== -1) {
      const isMigrations = file.includes('migrations');
      
      const replacement = isMigrations 
        ? `        // Generate remaining schedule rows
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
          })`
        : `        const frequency = loan.loanProduct.repaymentFrequency || 'WEEKLY'
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
          })`
      
      content = content.substring(0, idx1) + replacement + content.substring(idx2)
      fs.writeFileSync(file, content)
      console.log('Fixed:', file)
    } else {
      console.log('Not found in:', file)
    }
}

fixFile('app/api/loans/[id]/route.ts')
fixFile('app/actions/migrations.ts')
