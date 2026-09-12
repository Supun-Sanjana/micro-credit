import { PrismaClient, LoanProduct } from '@prisma/client'
import { calculateLoanTerms } from './lib/calc-engine'
import { Prisma } from '@prisma/client'

async function runTests() {
  console.log('--- Testing Loan Calc Engine against SGP Spreadsheet ---')

  const tests = [
    {
      name: 'Quick 13W (50k)',
      product: { multiplier: 1.17, numberOfWeeks: 13 } as unknown as LoanProduct,
      loanAmount: 50000,
      expectedTotal: '58500.00',
      expectedWeekly: '4500.00'
    },
    {
      name: 'Business 18W (100k)',
      product: { multiplier: 1.17, numberOfWeeks: 18 } as unknown as LoanProduct,
      loanAmount: 100000,
      expectedTotal: '117000.00',
      expectedWeekly: '6500.00'
    },
    {
      name: 'Quick 13W (30k)',
      product: { multiplier: 1.17, numberOfWeeks: 13 } as unknown as LoanProduct,
      loanAmount: 30000,
      expectedTotal: '35100.00',
      expectedWeekly: '2700.00',
      expectedFinal: '2700.00'
    },
    {
      name: 'Edge Case (10k over 3W)',
      product: { multiplier: 1.0, numberOfWeeks: 3 } as unknown as LoanProduct,
      loanAmount: 10000,
      expectedTotal: '10000.00',
      expectedWeekly: '3333.33', // 10000 / 3
      expectedFinal: '3333.34'   // 10000 - (3333.33 * 2) = 3333.34
    }
  ]

  let failed = false

  for (const t of tests) {
    const result = calculateLoanTerms(t.loanAmount, t.product)
    
    const totalOk = result.totalReceivable.toFixed(2) === t.expectedTotal
    const weeklyOk = result.weeklyRental.toFixed(2) === t.expectedWeekly
    const finalOk = t.expectedFinal ? result.finalPayment.toFixed(2) === t.expectedFinal : true
    
    if (totalOk && weeklyOk && finalOk) {
      console.log(`✅ [${t.name}] PASSED`)
    } else {
      console.log(`❌ [${t.name}] FAILED`)
      console.log(`   Expected: Total=${t.expectedTotal}, Weekly=${t.expectedWeekly}, Final=${t.expectedFinal}`)
      console.log(`   Got:      Total=${result.totalReceivable.toFixed(2)}, Weekly=${result.weeklyRental.toFixed(2)}, Final=${result.finalPayment.toFixed(2)}`)
      failed = true
    }
  }

  if (failed) {
    process.exit(1)
  }
}

runTests()
