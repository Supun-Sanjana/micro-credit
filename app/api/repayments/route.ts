import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { Prisma } from "@prisma/client"

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

        // Create Repayment record
        const repayment = await tx.loanRepayment.create({
          data: {
            loanId: loan.id,
            instalmentNumber: schedule?.instalmentNumber || null,
            scheduledDate: schedule?.scheduledDate || null,
            paidDate,
            amount: amount,
            note: p.note
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

        processed.push(repayment)
      }

      return processed
    })

    return NextResponse.json({ success: true, count: results.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
