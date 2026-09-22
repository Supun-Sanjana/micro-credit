import { PrismaClient, AccountType } from '@prisma/client'

const prisma = new PrismaClient()

// Standard Chart of Accounts for Microfinance (CGAP inspired)
const defaultChart = [
  // ASSETS
  { code: '1000', name: 'Cash on Hand', type: AccountType.ASSET },
  { code: '1010', name: 'Bank Accounts', type: AccountType.ASSET },
  { code: '1100', name: 'Loan Receivable - Principal', type: AccountType.ASSET },
  { code: '1110', name: 'Interest Receivable', type: AccountType.ASSET },
  { code: '1120', name: 'Penalty Receivable', type: AccountType.ASSET },
  { code: '1130', name: 'Fee Receivable', type: AccountType.ASSET },
  { code: '1200', name: 'Allowance for Loan Losses', type: AccountType.ASSET }, // Contra-asset usually, but mapped as Asset
  { code: '1500', name: 'Fixed Assets', type: AccountType.ASSET },

  // LIABILITIES
  { code: '2000', name: 'Compulsory Member Savings', type: AccountType.LIABILITY },
  { code: '2010', name: 'Voluntary Member Savings', type: AccountType.LIABILITY },
  { code: '2100', name: 'Accounts Payable', type: AccountType.LIABILITY },
  { code: '2200', name: 'Short-term Borrowings', type: AccountType.LIABILITY },
  { code: '2300', name: 'Long-term Debt', type: AccountType.LIABILITY },

  // EQUITY
  { code: '3000', name: 'Paid-in Capital', type: AccountType.EQUITY },
  { code: '3100', name: 'Retained Earnings', type: AccountType.EQUITY },
  { code: '3200', name: 'Current Year Profit', type: AccountType.EQUITY },

  // INCOME
  { code: '4000', name: 'Interest Income from Loans', type: AccountType.INCOME },
  { code: '4010', name: 'Fee Income from Loans', type: AccountType.INCOME },
  { code: '4020', name: 'Penalty Income from Loans', type: AccountType.INCOME },
  { code: '4100', name: 'Investment Income', type: AccountType.INCOME },
  { code: '4200', name: 'Other Income', type: AccountType.INCOME },

  // EXPENSES
  { code: '5000', name: 'Write-Off Expense', type: AccountType.EXPENSE },
  { code: '5100', name: 'Interest Expense on Borrowings', type: AccountType.EXPENSE },
  { code: '5200', name: 'Interest Expense on Savings', type: AccountType.EXPENSE },
  { code: '6000', name: 'Salaries and Benefits', type: AccountType.EXPENSE },
  { code: '6100', name: 'Rent Expense', type: AccountType.EXPENSE },
  { code: '6200', name: 'Utilities Expense', type: AccountType.EXPENSE },
  { code: '6300', name: 'Other Administrative Expenses', type: AccountType.EXPENSE },
]

async function seedChartOfAccounts(organizationId: string) {
  console.log(`Seeding Chart of Accounts for organization: ${organizationId}`)
  let createdCount = 0

  for (const account of defaultChart) {
    const existing = await prisma.chartOfAccount.findUnique({
      where: {
        organizationId_code: {
          organizationId,
          code: account.code,
        },
      },
    })

    if (!existing) {
      await prisma.chartOfAccount.create({
        data: {
          organizationId,
          code: account.code,
          name: account.name,
          type: account.type,
          isActive: true,
        },
      })
      createdCount++
    }
  }

  console.log(`Created ${createdCount} new accounts out of ${defaultChart.length} templates.`)
}

async function main() {
  const orgs = await prisma.organization.findMany()
  if (orgs.length === 0) {
    console.log("No organizations found. Run main seed script first.")
    return
  }

  for (const org of orgs) {
    await seedChartOfAccounts(org.id)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
