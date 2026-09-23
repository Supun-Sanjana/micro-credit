"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { SavingsType, SavingsTransactionType } from "@prisma/client"
import { postJournalEntry } from "@/lib/accounting"

async function getSession() {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error("Unauthorized")
  return session
}

export async function getSavingsProducts() {
  const session = await getSession()
  const orgId = session.user.organizationId!
  return prisma.savingsProduct.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  })
}

export async function createSavingsProduct(data: {
  name: string
  code: string
  type: SavingsType
  interestRate: number
  minimumBalance: number
}) {
  const session = await getSession()
  const role = session.user.role as string
  if (role !== "SYSTEM_ADMIN" && role !== "HEAD_OFFICE") throw new Error("Forbidden: requires admin or head office")
  // @ts-ignore
  return _createSavingsProduct(data)
}
async function _createSavingsProduct(data: {
  name: string
  code: string
  type: SavingsType
  interestRate: number
  minimumBalance: number
}) {
  const session = await getSession()
  const orgId = session.user.organizationId!

  const existing = await prisma.savingsProduct.findFirst({
    where: { organizationId: orgId, code: data.code },
  })
  if (existing) return { error: `Savings product with code ${data.code} already exists` }

  const product = await prisma.savingsProduct.create({
    data: {
      organizationId: orgId,
      name: data.name,
      code: data.code,
      type: data.type,
      interestRate: data.interestRate,
      minimumBalance: data.minimumBalance,
    },
  })

  await prisma.auditLog.create({
    data: { organizationId: orgId, userId: session.user.id, action: "CREATE", entityType: "SavingsProduct", entityId: product.id, after: JSON.stringify(product) },
  })

  revalidatePath("/app/savings-products")
  return { success: true, product }
}

export async function getMemberSavingsAccounts(memberId: string) {
  const session = await getSession()
  const orgId = session.user.organizationId!

  return prisma.savingsAccount.findMany({
    where: { memberId, organizationId: orgId },
    include: {
      product: true,
      transactions: {
        orderBy: { date: "desc" },
        take: 10,
      }
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function openSavingsAccount(data: {
  memberId: string
  savingsProductId: string
  accountNumber: string
}) {
  const session = await getSession()
  const role = session.user.role as string
  if (role !== "SYSTEM_ADMIN" && role !== "HEAD_OFFICE" && role !== "BRANCH_MANAGER") throw new Error("Forbidden: requires branch manager or higher")
  // @ts-ignore
  return _openSavingsAccount(data)
}
async function _openSavingsAccount(data: {
  memberId: string
  savingsProductId: string
  accountNumber: string
}) {
  const session = await getSession()
  const orgId = session.user.organizationId!

  const existing = await prisma.savingsAccount.findFirst({
    where: { organizationId: orgId, accountNumber: data.accountNumber },
  })
  if (existing) return { error: `Account number ${data.accountNumber} already exists` }

  const account = await prisma.savingsAccount.create({
    data: {
      organizationId: orgId,
      memberId: data.memberId,
      savingsProductId: data.savingsProductId,
      accountNumber: data.accountNumber,
    },
  })

  await prisma.auditLog.create({
    data: { organizationId: orgId, userId: session.user.id, action: "CREATE", entityType: "SavingsAccount", entityId: account.id, after: JSON.stringify(account) },
  })

  revalidatePath(`/app/members/${data.memberId}`)
  return { success: true, account }
}

export async function postSavingsTransaction(data: {
  accountId: string
  type: SavingsTransactionType
  amount: number
  notes?: string
}) {
  const session = await getSession()
  const role = session.user.role as string
  if (role !== "SYSTEM_ADMIN" && role !== "HEAD_OFFICE" && role !== "BRANCH_MANAGER") throw new Error("Forbidden: requires branch manager or higher")
  // @ts-ignore
  return _postSavingsTransaction(data)
}
async function _postSavingsTransaction(data: {
  accountId: string
  type: SavingsTransactionType
  amount: number
  notes?: string
}) {
  const session = await getSession()
  const orgId = session.user.organizationId!

  if (data.amount <= 0) {
    return { error: "Amount must be positive" }
  }

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Lock the account
      await tx.$executeRaw`SELECT id FROM "SavingsAccount" WHERE id = ${data.accountId} FOR UPDATE`
      
      const account = await tx.savingsAccount.findFirst({
        where: { id: data.accountId, organizationId: orgId },
        include: { 
          member: { include: { centre: true } },
          product: true
        },
      })
      
      if (!account) throw new Error("Account not found")

      // 2. Do the math
      const currentBalance = Number(account.balance)
      const newBalance = data.type === "DEPOSIT" || data.type === "INTEREST_POSTING"
        ? currentBalance + data.amount
        : currentBalance - data.amount

      if (data.type === "WITHDRAWAL" && newBalance < 0) {
        throw new Error("Insufficient funds")
      }

      // 3. Get accounting codes
      const cashAccount = await tx.chartOfAccount.findUnique({
        where: { organizationId_code: { organizationId: orgId, code: "1000" } }
      })
      const savingsCode = account.product.type === "COMPULSORY" ? "2000" : "2010"
      const savingsAccount = await tx.chartOfAccount.findUnique({
        where: { organizationId_code: { organizationId: orgId, code: savingsCode } }
      })

      if (!cashAccount || !savingsAccount) {
        throw new Error(`Missing accounting codes (1000 or ${savingsCode})`)
      }

      // 4. Update the account
      await tx.savingsAccount.update({
        where: { id: data.accountId },
        data: { balance: newBalance },
      })

      // 5. Create transaction record
      const trx = await tx.savingsTransaction.create({
        data: {
          organizationId: orgId,
          savingsAccountId: data.accountId,
          type: data.type,
          amount: data.amount,
          date: new Date(),
          notes: data.notes,
        },
      })

      // 6. Post Journal
      const isDeposit = data.type === "DEPOSIT" || data.type === "INTEREST_POSTING"
      const debitAccount = isDeposit ? cashAccount.id : savingsAccount.id
      const creditAccount = isDeposit ? savingsAccount.id : cashAccount.id
      
      await postJournalEntry({
        organizationId: orgId,
        branchId: account.member.centre.branchId,
        entryDate: new Date(),
        reference: `SAVINGS-${trx.id.substring(0, 8)}`,
        description: `Savings ${data.type} - Account ${account.accountNumber}`,
        sourceType: 'SavingsTransaction',
        sourceId: trx.id,
        tx,
        lines: [
          { accountId: debitAccount, debit: data.amount, credit: 0 },
          { accountId: creditAccount, debit: 0, credit: data.amount }
        ]
      })
      
      return { trx, memberId: account.memberId }
    })

    revalidatePath(`/app/members/${transaction.memberId}`)
    return { success: true, transaction: transaction.trx }
  } catch (error: any) {
    return { error: error.message || "Transaction failed" }
  }
}