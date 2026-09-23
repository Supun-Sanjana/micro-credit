import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { Prisma } from "@prisma/client"
import { logAudit } from "@/lib/audit"
import { recordPayment } from "@/lib/services/payment-service"
import { postJournalEntry, getAccountByCode } from "@/lib/accounting"
import { checkDuplicatePayment } from "@/lib/intelligence/anomaly-detector"

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

        if (schedule && schedule.isPaid) continue // Idempotency

        const amount = new Prisma.Decimal(p.amount)
        if (amount.lte(0)) continue // Ignore zero payments
        
        const repayment = await recordPayment(tx as any, {
          organizationId: dal.organizationId,
          loanId,
          amount,
          paidDate,
          method: 'CASH',
          scheduleId: p.scheduleId,
          note: p.note,
          collectedBy: dal.userId,
          source: 'OFFICE'
        })

        const updatedLoan = await tx.loan.findUnique({ where: { id: loanId } })

        processed.push({
          repayment,
          memberId: updatedLoan?.memberId,
          amount: amount.toString(),
          paidDate: paidDate.toISOString(),
          loanNumber: updatedLoan?.loanNumber,
          isSettled: updatedLoan?.status === 'SETTLED'
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
      
      // Risk anomaly detection
      void checkDuplicatePayment(
        item.repayment.loanId,
        parseFloat(item.amount),
        new Date(item.paidDate),
        dal.organizationId
      )
    }

    return NextResponse.json({ success: true, count: results.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
