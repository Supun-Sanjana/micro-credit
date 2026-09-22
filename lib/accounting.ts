import prisma from './prisma'
import { AccountType, JournalEntry, JournalLine } from '@prisma/client'
import { Prisma } from '@prisma/client'

export interface PostJournalParams {
  organizationId: string
  branchId?: string
  periodId?: string
  entryDate: Date
  reference: string
  description: string
  sourceType: string
  sourceId: string
  tx?: any // Optional Prisma transaction client
  lines: {
    accountId: string
    debit: Prisma.Decimal | number | string
    credit: Prisma.Decimal | number | string
  }[]
}

export async function postJournalEntry(params: PostJournalParams): Promise<JournalEntry & { lines: JournalLine[] }> {
  const db = params.tx || prisma

  // 1. Validate lines balance
  let totalDebit = new Prisma.Decimal(0)
  let totalCredit = new Prisma.Decimal(0)

  for (const line of params.lines) {
    totalDebit = totalDebit.plus(line.debit)
    totalCredit = totalCredit.plus(line.credit)
  }

  if (!totalDebit.equals(totalCredit)) {
    throw new Error(`Journal entry does not balance. Debits: ${totalDebit.toString()}, Credits: ${totalCredit.toString()}`)
  }

  // 2. Validate all accounts belong to organization
  const accountIds = params.lines.map(l => l.accountId)
  const accounts = await db.chartOfAccount.findMany({
    where: {
      id: { in: accountIds },
      organizationId: params.organizationId
    }
  })

  if (accounts.length !== accountIds.length) {
    throw new Error('One or more accounts do not exist or belong to a different organization')
  }

  // 3. Create entry
  const entry = await db.journalEntry.create({
    data: {
      organizationId: params.organizationId,
      branchId: params.branchId,
      periodId: params.periodId,
      entryDate: params.entryDate,
      reference: params.reference,
      description: params.description,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      lines: {
        create: params.lines.map(line => ({
          accountId: line.accountId,
          debit: line.debit,
          credit: line.credit
        }))
      }
    },
    include: {
      lines: true
    }
  })

  return entry
}

/**
 * Helper to fetch a standard account by code. Useful for generic posting templates.
 */
export async function getAccountByCode(organizationId: string, code: string) {
  const account = await prisma.chartOfAccount.findUnique({
    where: {
      organizationId_code: {
        organizationId,
        code
      }
    }
  })
  if (!account) throw new Error(`Standard account ${code} not found for organization ${organizationId}`)
  return account
}
