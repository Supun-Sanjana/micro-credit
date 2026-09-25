const fs = require('fs')

function fixLoans() {
  const file = 'app/api/loans/[id]/route.ts';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/\/\/ Generate exactly N rows, 7 days apart[\s\S]*?isPaid:\s*false\s*\}\)\s*\}/, `const frequency = loan.loanProduct.repaymentFrequency || 'WEEKLY'
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
        }`);
  fs.writeFileSync(file, c);
}

function fixMigrations() {
  const file = 'app/actions/migrations.ts';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/\/\/ Generate remaining schedule rows[\s\S]*?isPaid:\s*false\s*\}\)\s*\}/, `// Generate remaining schedule rows
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
        }`);
  fs.writeFileSync(file, c);
}

fixLoans();
fixMigrations();
console.log('done regex');
