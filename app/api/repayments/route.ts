import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { Prisma } from "@prisma/client"
import { logAudit } from "@/lib/audit"
import { allocatePayment, balancesFromLoan } from "@/lib/payment-allocation"
import { postJournalEntry, getAccountByCode } from "@/lib/accounting"

export async function GET(request: Request) {
  try {
    const dal = await getScopedDal()
    const { searchParams } = new URL(request.url)
    const centreId = searchParams.get("centreId")
    const dateStr = searchParams.get("date") // expected format YYYY-MM-DD

    if (!centreId || !dateStr) {
      return NextResponse.json({ error: "Missing centreId or date" }, { status: 400 })
    }

    const date = new Date(dateStr)

    // Find all active loans for members in this centre
    const schedules = await dal.prisma.repaymentSchedule.findMany({
      where: {
        scheduledDate: date,
        isPaid: false,
        loan: {
          member: {
            centreId: centreId,
            centre: { branch: { organizationId: dal.organizationId } }
          },
          status: 'ACTIVE'
        }
      },
      include: {
        loan: {
          include: { member: true }
        }
      },
      orderBy: { loan: { member: { memberNumber: 'asc' } } }
    })

    return NextResponse.json(schedules)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal()
    const json = await request.json()
    // payload: { payments: Array<{ scheduleId?: string, loanId?: string, amount: number, note?: string }>, date: string }
    const payments = json.payments || []
    const paidDate = new Date(json.date || new Date())

    const results = await dal.prisma.$transaction(async (tx) => {
      const processed = []

      for (const p of payments) {
        let loanId = p.loanId
        let schedule = null

        if (p.scheduleId) {
          schedule = await tx.repaymentSchedule.findUnique({ where: { id: p.scheduleId } })
          if (schedule) loanId = schedule.loanId
        }

        if (!loanId) continue

        // Acquire row-level lock to prevent lost updates in concurrent scenarios
        await tx.$executeRaw`SELECT id FROM "Loan" WHERE id = ${loanId} FOR UPDATE`

        const loan = await tx.loan.findUnique({
          where: { id: loanId },
          include: {
            member: { include: { centre: { include: { branch: true } } } },
            repaymentSchedule: {
              where: { isPaid: false },
              orderBy: { instalmentNumber: 'asc' }
            }
          }
        })

        if (!loan || loan.member.centre.branch.organizationId !== dal.organizationId) {
          throw new Error(`Unauthorized or missing loan ${loanId}`)
        }

        // Idempotency: if specific schedule is targeted, ensure we haven't already paid it
        if (schedule && schedule.isPaid) {
          continue // Duplicate retry, silently skip
        }

        const amount = new Prisma.Decimal(p.amount)
        if (amount.lte(0)) continue // Ignore zero payments
        if (amount.gt(loan.outstanding)) throw new Error("Payment exceeds the outstanding balance")
        const allocations = allocatePayment(amount, balancesFromLoan(loan))

        // Create Repayment record
        const repayment = await tx.loanRepayment.create({
          data: {
            loanId: loan.id,
            instalmentNumber: schedule?.instalmentNumber || null,
            scheduledDate: schedule?.scheduledDate || null,
            paidDate,
            amount: amount,
            note: p.note,
            allocationMethod: "DEFAULT_WATERFALL",
            allocations: { create: allocations }
          }
        })

        // Update Loan Totals
        const newTotalPaid = loan.totalPaid.add(amount)
        const newOutstanding = loan.totalReceivable.minus(newTotalPaid)
        
        let newStatus = loan.status
        if (newOutstanding.lte(0)) {
          newStatus = 'SETTLED'
        }

        await tx.loan.update({
          where: { id: loan.id },
          data: {
            totalPaid: newTotalPaid,
            outstanding: newOutstanding,
            status: newStatus
          }
        })

        // Waterfall allocation to schedules
        let remainingToAllocate = amount
        for (const s of loan.repaymentSchedule) {
          if (remainingToAllocate.lte(0)) break

          // Assuming we simply mark as paid if the total allocation covers it
          // Wait, if it's a partial payment, it doesn't get marked as paid?
          // The simple Microfinance rule is: if outstanding <= sum of remaining unpaid schedules after this one
          // Let's just mark it as paid if remainingToAllocate >= s.scheduledAmount
          if (remainingToAllocate.gte(s.scheduledAmount)) {
            await tx.repaymentSchedule.update({
              where: { id: s.id },
              data: { isPaid: true }
            })
            remainingToAllocate = remainingToAllocate.minus(s.scheduledAmount)
          } else {
            // Partial payment for this schedule. In some systems, it remains false until fully paid.
            break
          }
        }

        processed.push({
          repayment,
          memberId: loan.memberId,
          amount: amount.toString(),
          paidDate: paidDate.toISOString(),
          loanNumber: loan.loanNumber,
          isSettled: newStatus === 'SETTLED'
        })
        
        // --- ACCOUNTING ---
        try {
          const cashAcc = await getAccountByCode(dal.organizationId, '1000')
          const principalAcc = await getAccountByCode(dal.organizationId, '1100')
          const interestAcc = await getAccountByCode(dal.organizationId, '4000')
          const feeAcc = await getAccountByCode(dal.organizationId, '4010')
          const penaltyAcc = await getAccountByCode(dal.organizationId, '4020')

          const jLines: { accountId: string; debit: Prisma.Decimal; credit: Prisma.Decimal }[] = []
          
          // Debit Cash for the total amount
          jLines.push({ accountId: cashAcc.id, debit: amount, credit: new Prisma.Decimal(0) })

          // Credit the respective income/receivable accounts based on allocation
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
            organizationId: dal.organizationId,
            branchId: loan.member.centre.branch.id,
            entryDate: paidDate,
            reference: `REP-${repayment.id.slice(-6)}`,
            description: `Repayment from Member ${loan.member.name}`,
            sourceType: 'REPAYMENT',
            sourceId: repayment.id,
            tx,
            lines: jLines
          })
        } catch (e: any) {
          console.error("Accounting error:", e)
          throw new Error("Failed to post accounting journal: " + e.message)
        }
        // ------------------
        
        await logAudit({
          dal,
          action: "CREATE",
          entityType: "LoanRepayment",
          entityId: repayment.id,
          after: repayment
        })
      }

      return processed
    })

    // Dispatch notifications after successful transaction
    const { dispatchNotification } = await import('@/lib/services/notification-service')
    for (const item of results) {
      void dispatchNotification({
        type: 'PAYMENT_RECEIVED',
        payload: {
          loanId: item.repayment.loanId,
          memberId: item.memberId,
          organizationId: dal.organizationId,
          amount: item.amount,
          paidDate: item.paidDate
        }
      })
      if (item.isSettled) {
        void dispatchNotification({
          type: 'LOAN_SETTLED',
          payload: {
            loanId: item.repayment.loanId,
            memberId: item.memberId,
            organizationId: dal.organizationId,
            loanNumber: item.loanNumber
          }
        })
      }
    }

    return NextResponse.json({ success: true, count: results.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
