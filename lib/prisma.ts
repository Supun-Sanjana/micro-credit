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
 * Returns a Prisma client extension that automatically scopes queries to the given organization.
 * Usage: prisma.$extends(withOrgScope(orgId))
 */
export const withOrgScope = (organizationId: string) => {
  return {
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          const ops = ['findUnique', 'findFirst', 'findMany', 'count', 'update', 'delete', 'updateMany', 'deleteMany']
          if (!ops.includes(operation)) return query(args)

          args.where = args.where || {}

          if (['Branch', 'User', 'LoanProduct', 'Member'].includes(model)) {
            args.where = { ...args.where, organizationId }
          }
          else if (['Centre', 'CashFlow'].includes(model)) {
            args.where = { ...args.where, branch: { ...args.where.branch, organizationId } }
          }
          else if (['Loan'].includes(model)) {
            args.where = { ...args.where, member: { ...args.where.member, organizationId } }
          }
          else if (['LoanRepayment', 'RepaymentSchedule', 'Guarantor'].includes(model)) {
            args.where = { ...args.where, loan: { ...args.where.loan, member: { ...args.where.loan?.member, organizationId } } }
          }

          return query(args)
        }
      }
    }
  }
}
