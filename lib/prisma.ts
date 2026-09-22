import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({} as any)

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma

/**
 * Returns a Prisma client extension that automatically scopes queries to the given organization
 * and optionally to a specific branch for Field Officers.
 * Usage: prisma.$extends(withOrgScope(orgId, branchId))
 */
export const withOrgScope = (organizationId: string, branchId?: string | null) => {
  return {
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          const ops = ['findUnique', 'findFirst', 'findMany', 'count', 'update', 'delete', 'updateMany', 'deleteMany']
          if (!ops.includes(operation)) return query(args)

          args.where = args.where || {}

          if (['Branch', 'User', 'LoanProduct', 'Member', 'Group', 'PaymentReversal', 'ChartOfAccount', 'AccountingPeriod', 'JournalEntry', 'SavingsProduct', 'SavingsAccount', 'SavingsTransaction'].includes(model)) {
            args.where = { ...args.where, organizationId }
            if (branchId && model === 'Member') {
              args.where = { ...args.where, centre: { ...args.where.centre, branchId } }
            }
          }
          else if (['Centre', 'CashFlow'].includes(model)) {
            args.where = { ...args.where, branch: { ...args.where.branch, organizationId } }
            if (branchId) {
              args.where.branchId = branchId
            }
          }
          else if (['Loan'].includes(model)) {
            args.where = { ...args.where, member: { ...args.where.member, organizationId } }
            if (branchId) {
              args.where.member = { ...args.where.member, centre: { ...args.where.member?.centre, branchId } }
            }
          }
          else if (['LoanRepayment', 'RepaymentSchedule', 'Guarantor', 'PaymentAllocation'].includes(model)) {
            args.where = { ...args.where, loan: { ...args.where.loan, member: { ...args.where.loan?.member, organizationId } } }
            if (branchId) {
              args.where.loan = { ...args.where.loan, member: { ...args.where.loan?.member, centre: { ...args.where.loan?.member?.centre, branchId } } }
            }
          }
          else if (['JournalLine'].includes(model)) {
            args.where = { ...args.where, journalEntry: { ...args.where.journalEntry, organizationId } }
          }

          return query(args)
        }
      }
    }
  }
}
