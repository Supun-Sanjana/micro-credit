import { Prisma, RepaymentMethod } from "@prisma/client"
import { allocatePayment, balancesFromLoan } from "@/lib/payment-allocation"
import { postJournalEntry, getAccountByCode } from "@/lib/accounting"

export interface PaymentParams {
  organizationId: string
  loanId: string
  amount: Prisma.Decimal
  paidDate: Date
  method: RepaymentMethod
  scheduleId?: string
  note?: string
  collectedBy?: string
  clientTransactionId?: string
  source: "OFFICE" | "COLLECTION_SHEET" | "FIELD_MOBILE"
}

export async function recordPayment(tx: Prisma.TransactionClient, params: PaymentParams) {
  // 1. Acquire row lock on Loan
  await tx.$executeRaw`SELECT id FROM "Loan" WHERE id = ${params.loanId} FOR UPDATE`

  // 2. Idempotency check
  if (params.clientTransactionId) {
    const existing = await tx.loanRepayment.findUnique({
      where: {
        organizationId_clientTransactionId: {
          organizationId: params.organizationId,
          clientTransactionId: params.clientTransactionId
        }
      }
    })
    if (existing) return existing
  }

  // Fetch full loan details after lock
  const loan = await tx.loan.findUnique({
    where: { id: params.loanId },
    include: {
      member: { include: { centre: true } }
    }
  })

  if (!loan || loan.member.organizationId !== params.organizationId) {
    throw new Error("Unauthorized or missing loan")
  }

  // 3. Validate amount
  if (params.amount.lte(0)) throw new Error("Payment amount must be greater than zero")
  if (params.amount.gt(loan.outstanding)) {
    throw new Error("Payment exceeds the outstanding balance")
  }

  // 4. Allocate payment
  const allocations = allocatePayment(params.amount, balancesFromLoan(loan))

  // 5. Create Repayment & Allocations
  let instalmentNumber: number | null = null
  let scheduledDate: Date | null = null

  if (params.scheduleId) {
    const schedule = await tx.repaymentSchedule.findUnique({
      where: { id: params.scheduleId }
    })
    if (schedule) {
      instalmentNumber = schedule.instalmentNumber
      scheduledDate = schedule.scheduledDate
    }
  }

  const repayment = await tx.loanRepayment.create({
    data: {
      organizationId: params.organizationId,
      loanId: params.loanId,
      instalmentNumber,
      scheduledDate,
      paidDate: params.paidDate,
      amount: params.amount,
      method: params.method,
      note: params.note,
      collectedBy: params.collectedBy,
      clientTransactionId: params.clientTransactionId,
      allocationMethod: "DEFAULT_WATERFALL",
      allocations: { create: allocations }
    }
  })

  // 6. Update loan balances
  const newTotalPaid = loan.totalPaid.add(params.amount)
  const newOutstanding = loan.totalReceivable.minus(newTotalPaid)
  let newStatus = loan.status
  if (newOutstanding.lte(0)) newStatus = "SETTLED"

  await tx.loan.update({
    where: { id: loan.id },
    data: {
      totalPaid: newTotalPaid,
      outstanding: newOutstanding,
      status: newStatus
    }
  })

  // 7. Update RepaymentSchedule
  if (params.scheduleId) {
    const schedule = await tx.repaymentSchedule.findUnique({
      where: { id: params.scheduleId }
    })
    if (schedule) {
      const newPaidAmount = schedule.paidAmount.add(params.amount)
      let status = schedule.status
      let isPaid = schedule.isPaid

      if (newPaidAmount.gte(schedule.scheduledAmount)) {
        status = "PAID"
        isPaid = true
      } else if (newPaidAmount.gt(0)) {
        status = "PARTIALLY_PAID"
      }

      await tx.repaymentSchedule.update({
        where: { id: params.scheduleId },
        data: {
          paidAmount: newPaidAmount,
          status,
          isPaid
        }
      })
    }
  }

  // 8. Post Accounting Journal
  const cashAccountCode = params.method === "BANK_TRANSFER" ? "1001" : "1000"
  const cashAccount = await getAccountByCode(params.organizationId, cashAccountCode)
  const principalAcc = await getAccountByCode(params.organizationId, "1100")
  const interestAcc = await getAccountByCode(params.organizationId, "4000")
  const feeAcc = await getAccountByCode(params.organizationId, "4010")
  const penaltyAcc = await getAccountByCode(params.organizationId, "4020")

  if (!cashAccount || !principalAcc || !interestAcc || !feeAcc || !penaltyAcc) {
    throw new Error("Required accounting codes not found for repayment posting")
  }

  const jLines: { accountId: string; debit: Prisma.Decimal; credit: Prisma.Decimal }[] = []
  
  // Debit Cash
  jLines.push({ accountId: cashAccount.id, debit: params.amount, credit: new Prisma.Decimal(0) })

  // Credit income/receivable accounts based on allocation
  for (const alloc of allocations) {
    let accId = ''
    if (alloc.component === 'PRINCIPAL') accId = principalAcc.id
    if (alloc.component === 'INTEREST') accId = interestAcc.id
    if (alloc.component === 'FEE') accId = feeAcc.id
    if (alloc.component === 'PENALTY') accId = penaltyAcc.id
    
    if (accId) {
      jLines.push({ accountId: accId, debit: new Prisma.Decimal(0), credit: alloc.amount })
    }
  }

  await postJournalEntry({
    organizationId: params.organizationId,
    branchId: loan.member.centre.branchId,
    entryDate: params.paidDate,
    reference: `REP-${repayment.id.slice(-6)}`,
    description: `Repayment from Member ${loan.member.name}`,
    sourceType: "REPAYMENT",
    sourceId: repayment.id,
    tx,
    lines: jLines
  })

  // 9. Log Audit
  await tx.auditLog.create({
    data: {
      organizationId: params.organizationId,
      userId: params.collectedBy || "SYSTEM",
      action: "CREATE",
      entityType: "LoanRepayment",
      entityId: repayment.id,
      after: JSON.stringify({ ...repayment, source: params.source, note: "Payment recorded via consolidated payment-service" })
    }
  })

  return repayment
}
