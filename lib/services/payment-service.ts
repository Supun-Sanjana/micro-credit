import { Prisma, RepaymentMethod, ScheduleStatus } from "@prisma/client"
import { allocatePayment, balancesFromLoan, distributeAllocationsToSchedules, SchedulePortion } from "@/lib/payment-allocation"
import { assertScheduleOwnership } from "@/lib/field-collection"
import { postJournalEntry, getAccountByCode } from "@/lib/accounting"
import { assertMatchingPaymentFingerprint } from "@/lib/payment-idempotency"

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
  idempotencyFingerprint?: string
  source: "OFFICE" | "COLLECTION_SHEET" | "FIELD_MOBILE"
}

export async function recordPayment(tx: Prisma.TransactionClient, params: PaymentParams) {
  // 1. Acquire row lock on Loan
  await tx.$executeRaw`SELECT id FROM "Loan" WHERE id = ${params.loanId} FOR UPDATE`

  // 2. Idempotency check
  if (params.clientTransactionId) {
    if (!params.idempotencyFingerprint) {
      throw new Error("An idempotency fingerprint is required with a client transaction ID")
    }
    const existing = await tx.loanRepayment.findUnique({
      where: {
        organizationId_clientTransactionId: {
          organizationId: params.organizationId,
          clientTransactionId: params.clientTransactionId
        }
      }
    })
    if (existing) {
      assertMatchingPaymentFingerprint(existing, params.idempotencyFingerprint)
      return existing
    }
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

  // 5. Fetch schedules and calculate schedule portions
  const activeSchedules = await tx.repaymentSchedule.findMany({
    where: {
      loanId: params.loanId,
      supersededAt: null,
    },
    orderBy: [
      { scheduledDate: "asc" },
      { instalmentNumber: "asc" },
    ],
  })

  let instalmentNumber: number | null = null
  let scheduledDate: Date | null = null
  const schedulePortions: SchedulePortion[] = []
  let remainingPayment = new Prisma.Decimal(params.amount)

  if (params.scheduleId) {
    const matchedSchedule = activeSchedules.find((s: any) => s.id === params.scheduleId)
    if (!matchedSchedule) {
      const scheduleCheck = await tx.repaymentSchedule.findUnique({
        where: { id: params.scheduleId },
        include: { loan: { include: { member: true } } },
      })
      assertScheduleOwnership(scheduleCheck, params.loanId, params.organizationId)
      if (scheduleCheck.supersededAt !== null) {
        throw new Error("Cannot allocate payment to a superseded schedule")
      }
    } else {
      instalmentNumber = matchedSchedule.instalmentNumber
      scheduledDate = matchedSchedule.scheduledDate

      const schedRemaining = Prisma.Decimal.max(
        0,
        matchedSchedule.scheduledAmount.minus(matchedSchedule.paidAmount)
      )

      const allocToMatched = Prisma.Decimal.min(remainingPayment, schedRemaining)
      if (allocToMatched.gt(0)) {
        schedulePortions.push({
          scheduleId: matchedSchedule.id,
          amount: allocToMatched,
        })
        remainingPayment = remainingPayment.minus(allocToMatched)
      }
    }
  }

  // Cascade any remaining payment to unpaid active schedules
  if (remainingPayment.gt(0)) {
    for (const schedule of activeSchedules) {
      if (remainingPayment.lte(0)) break
      if (params.scheduleId && schedule.id === params.scheduleId) continue

      const schedRemaining = Prisma.Decimal.max(
        0,
        schedule.scheduledAmount.minus(schedule.paidAmount)
      )
      if (schedRemaining.gt(0)) {
        const allocAmount = Prisma.Decimal.min(remainingPayment, schedRemaining)
        schedulePortions.push({
          scheduleId: schedule.id,
          amount: allocAmount,
        })
        remainingPayment = remainingPayment.minus(allocAmount)

        if (instalmentNumber === null) {
          instalmentNumber = schedule.instalmentNumber
          scheduledDate = schedule.scheduledDate
        }
      }
    }
  }

  // Handle remaining payment if schedules are already satisfied or none exist
  if (remainingPayment.gt(0)) {
    if (params.scheduleId) {
      const existing = schedulePortions.find((p) => p.scheduleId === params.scheduleId)
      if (existing) {
        existing.amount = existing.amount.add(remainingPayment)
      } else {
        schedulePortions.push({ scheduleId: params.scheduleId, amount: remainingPayment })
      }
    } else if (schedulePortions.length > 0) {
      schedulePortions[schedulePortions.length - 1].amount = schedulePortions[schedulePortions.length - 1].amount.add(remainingPayment)
    } else {
      schedulePortions.push({ scheduleId: null, amount: remainingPayment })
    }
  }

  const scheduleAllocations = distributeAllocationsToSchedules(allocations, schedulePortions)

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
      idempotencyFingerprint: params.idempotencyFingerprint,
      allocationMethod: "DEFAULT_WATERFALL",
      allocations: {
        create: scheduleAllocations.map((a) => ({
          component: a.component,
          amount: a.amount,
          scheduleId: a.scheduleId,
        })),
      },
    },
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
      status: newStatus,
    },
  })

  // 7. Update affected RepaymentSchedules
  for (const portion of schedulePortions) {
    if (!portion.scheduleId) continue
    const targetSchedule = activeSchedules.find((s: any) => s.id === portion.scheduleId) ??
      (await tx.repaymentSchedule.findUnique({ where: { id: portion.scheduleId } }))

    if (!targetSchedule) continue

    const newPaidAmount = targetSchedule.paidAmount.add(portion.amount)
    let status: ScheduleStatus = "PENDING"
    let isPaid = false

    if (newPaidAmount.gte(targetSchedule.scheduledAmount)) {
      status = "PAID"
      isPaid = true
    } else if (newPaidAmount.gt(0)) {
      status = "PARTIALLY_PAID"
      isPaid = false
    }

    await tx.repaymentSchedule.update({
      where: { id: portion.scheduleId },
      data: {
        paidAmount: newPaidAmount,
        status,
        isPaid,
      },
    })
  }

  // 8. Post Accounting Journal
  const cashAccountCode = params.method === "BANK_TRANSFER" ? "1001" : "1000"
  const cashAccount = await getAccountByCode(params.organizationId, cashAccountCode, tx)
  const principalAcc = await getAccountByCode(params.organizationId, "1100", tx)
  const interestAcc = await getAccountByCode(params.organizationId, "4000", tx)
  const feeAcc = await getAccountByCode(params.organizationId, "4010", tx)
  const penaltyAcc = await getAccountByCode(params.organizationId, "4020", tx)

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
