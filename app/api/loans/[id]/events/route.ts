import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { getScopedDal } from "@/lib/dal"
import { calculateLoanTerms } from "@/lib/calc-engine"
import { logAudit } from "@/lib/audit"

const adminOnly = (role: string) => { if (role !== "SYSTEM_ADMIN" && role !== "HEAD_OFFICE" && role !== "BRANCH_MANAGER") throw new Error("Manager approval is required") }

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const dal = await getScopedDal(); const { id } = await params; const body = await request.json()
    const result = await dal.prisma.$transaction(async (tx: any) => {
      await tx.$executeRaw`SELECT id FROM "Loan" WHERE id = ${id} FOR UPDATE`
      const loan = await tx.loan.findFirst({ where: { id }, include: { member: true, loanProduct: true, repaymentSchedule: { where: { supersededAt: null }, orderBy: { instalmentNumber: "asc" } } } })
      if (!loan) throw new Error("Loan not found")
      if (body.action === "TOP_UP") {
        adminOnly(dal.role); const amount = new Prisma.Decimal(body.newLoanAmount)
        if (!loan.loanProduct || amount.lte(loan.outstanding)) throw new Error("New loan amount must exceed the outstanding balance")
        const terms = calculateLoanTerms(amount, loan.loanProduct)
        const newLoan = await tx.loan.create({ data: { memberId: loan.memberId, loanProductId: loan.loanProductId, loanType: loan.loanType, loanNumber: `TOPUP-${Date.now()}`, loanAmount: terms.loanAmount, weeklyRental: terms.weeklyRental, numberOfWeeks: terms.numberOfWeeks, totalReceivable: terms.totalReceivable, outstanding: terms.totalReceivable, status: "PENDING", verificationStatus: "PENDING" } })
        await tx.loanRepayment.create({ data: { organizationId: dal.organizationId, loanId: loan.id, paidDate: new Date(), amount: loan.outstanding, method: "ACCOUNT_TRANSFER", note: `Settled by top-up ${newLoan.id}`, transactionType: "PAYMENT", allocationMethod: "TOP_UP_SETTLEMENT" } })
        await tx.loan.update({ where: { id }, data: { totalPaid: loan.totalPaid.add(loan.outstanding), outstanding: 0, status: "SETTLED" } })
        
        // --- NOTIFICATION ---
        const { dispatchNotification } = await import("@/lib/services/notification-service")
        void dispatchNotification({
          type: 'LOAN_SETTLED',
          payload: { loanId: id, memberId: loan.memberId, organizationId: dal.organizationId, loanNumber: loan.loanNumber }
        })

        return await tx.loanRefinance.create({ data: { organizationId: dal.organizationId, sourceLoanId: id, newLoanId: newLoan.id, settlementAmount: loan.outstanding, additionalDisbursement: amount.minus(loan.outstanding), createdById: dal.userId! } })
      }
      if (body.action === "RESTRUCTURE") {
        adminOnly(dal.role); if (!body.reason?.trim() || !Array.isArray(body.schedule) || body.schedule.length === 0) throw new Error("Reason and replacement schedule are required")
        const version = await tx.loanScheduleVersion.count({ where: { loanId: id } }) + 1; const effectiveDate = new Date(body.effectiveDate)
        const scheduleVersion = await tx.loanScheduleVersion.create({ data: { loanId: id, version, reason: body.reason.trim(), effectiveDate, schedule: body.schedule, createdById: dal.userId!, approvedById: dal.userId!, approvedAt: new Date() } })
        await tx.repaymentSchedule.updateMany({ where: { loanId: id, supersededAt: null }, data: { supersededAt: new Date() } })
        await tx.repaymentSchedule.createMany({ data: body.schedule.map((s: any, index: number) => ({ loanId: id, scheduleVersionId: scheduleVersion.id, instalmentNumber: index + 1, scheduledDate: new Date(s.scheduledDate), scheduledAmount: new Prisma.Decimal(s.scheduledAmount) })) })
        return await tx.loanRestructure.create({ data: { organizationId: dal.organizationId, loanId: id, scheduleVersionId: scheduleVersion.id, reason: body.reason.trim(), effectiveDate, createdById: dal.userId!, approvedById: dal.userId!, approvedAt: new Date() } })
      }
      if (body.action === "WRITE_OFF") {
        adminOnly(dal.role); if (!body.reason?.trim()) throw new Error("A write-off reason is required")
        const interest = Prisma.Decimal.max(loan.totalReceivable.minus(loan.loanAmount), 0); const paidInterest = Prisma.Decimal.min(loan.totalPaid, interest)
        const writeOff = await tx.loanWriteOff.create({ data: { organizationId: dal.organizationId, loanId: id, writtenOffPrincipal: Prisma.Decimal.max(loan.loanAmount.minus(Prisma.Decimal.max(loan.totalPaid.minus(interest), 0)), 0), writtenOffInterest: interest.minus(paidInterest), reason: body.reason.trim(), approvedById: dal.userId! } })
        await tx.loan.update({ where: { id }, data: { status: "DEFAULTED" } })
        
        // --- ACCOUNTING ---
        const { postJournalEntry, getAccountByCode } = await import("@/lib/accounting")
        const expenseAcc = await getAccountByCode(dal.organizationId, '5000')
        const receivableAcc = await getAccountByCode(dal.organizationId, '1100')
        
        // We need branchId
        const loanMember = await tx.member.findUnique({ where: { id: loan.memberId }, include: { centre: true }})
        const branchId = loanMember?.centre.branchId

        await postJournalEntry({
          organizationId: dal.organizationId,
          branchId,
          entryDate: new Date(),
          reference: `WO-${writeOff.id.slice(-6)}`,
          description: `Loan Write-Off for Member ${loan.member.name}`,
          sourceType: 'WRITE_OFF',
          sourceId: writeOff.id,
          tx,
          lines: [
            { accountId: expenseAcc.id, debit: loan.outstanding, credit: 0 },
            { accountId: receivableAcc.id, debit: 0, credit: loan.outstanding }
          ]
        })
        return writeOff
      }
      if (body.action === "RECOVERY") {
        const writeOff = await tx.loanWriteOff.findFirst({ where: { loanId: id }, orderBy: { approvedAt: "desc" } }); const amount = new Prisma.Decimal(body.amount)
        if (!writeOff || amount.lte(0)) throw new Error("A positive recovery against a write-off is required")
        const recovery = await tx.writeOffRecovery.create({ data: { writeOffId: writeOff.id, amount, recoveredAt: new Date(body.recoveredAt || new Date()), note: body.note || null, collectedById: dal.userId! } })
        
        // --- ACCOUNTING ---
        const { postJournalEntry, getAccountByCode } = await import("@/lib/accounting")
        const cashAcc = await getAccountByCode(dal.organizationId, '1000')
        const expenseAcc = await getAccountByCode(dal.organizationId, '5000')
        
        const loanMember = await tx.member.findUnique({ where: { id: loan.memberId }, include: { centre: true }})
        const branchId = loanMember?.centre.branchId

        await postJournalEntry({
          organizationId: dal.organizationId,
          branchId,
          entryDate: new Date(body.recoveredAt || new Date()),
          reference: `REC-${recovery.id.slice(-6)}`,
          description: `Recovery on written-off loan for Member ${loan.member.name}`,
          sourceType: 'RECOVERY',
          sourceId: recovery.id,
          tx,
          lines: [
            { accountId: cashAcc.id, debit: amount, credit: 0 },
            { accountId: expenseAcc.id, debit: 0, credit: amount }
          ]
        })
        return recovery
      }
      throw new Error("Unsupported loan event")
    })
    await logAudit({ dal, action: "CREATE", entityType: `Loan${body.action}`, entityId: result.id, after: result })
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}
