import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { Prisma } from "@prisma/client"
import { addDays, subDays } from "date-fns"

export async function GET(request: Request) {
  try {
    const dal = await getScopedDal()
    const { searchParams } = new URL(request.url)
    const centreId = searchParams.get("centreId")
    const dateStr = searchParams.get("date")

    if (!centreId || !dateStr) {
      return NextResponse.json({ error: "Missing centreId or date" }, { status: 400 })
    }

    const date = new Date(dateStr)
    const sevenDaysBefore = subDays(date, 7)
    const sevenDaysAfter = addDays(date, 7)

    const members = await dal.prisma.member.findMany({
      where: {
        centreId: centreId,
        organizationId: dal.organizationId
      },
      include: {
        loans: {
          where: { status: 'ACTIVE' },
          include: {
            repaymentSchedule: true
          }
        }
      },
      orderBy: { memberNumber: 'asc' }
    })

    const results = []

    for (const member of members) {
      const activeLoan = member.loans[0]
      if (!activeLoan) continue

      const sortedSchedules = [...activeLoan.repaymentSchedule].sort(
        (a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()
      )

      const currentSchedule = sortedSchedules.find(s => 
        s.scheduledDate >= sevenDaysBefore && 
        s.scheduledDate <= sevenDaysAfter && 
        s.status !== 'PAID'
      )

      const scheduledAmount = currentSchedule ? Number(currentSchedule.scheduledAmount) : Number(activeLoan.weeklyRental)
      
      const arrearsSchedules = sortedSchedules.filter(s => 
        (s.status === 'PARTIALLY_PAID' || s.status === 'MISSED') && 
        (!currentSchedule || s.id !== currentSchedule.id)
      )

      let arrearsBF = 0
      for (const s of arrearsSchedules) {
        if (s.status === 'PARTIALLY_PAID') {
          arrearsBF += Number(s.scheduledAmount) - Number(s.paidAmount)
        } else if (s.status === 'MISSED') {
          arrearsBF += Number(s.scheduledAmount) - Number(s.paidAmount)
        }
      }

      results.push({
        memberId: member.id,
        memberName: member.name,
        memberNumber: member.memberNumber,
        groupNumber: member.groupNumber,
        loanId: activeLoan.id,
        scheduleId: currentSchedule ? currentSchedule.id : null,
        instalmentNumber: currentSchedule ? currentSchedule.instalmentNumber : null,
        scheduledAmount,
        arrearsBF,
        totalDue: scheduledAmount + arrearsBF,
        weeklyRental: Number(activeLoan.weeklyRental),
        outstanding: Number(activeLoan.outstanding),
        currentStatus: currentSchedule ? currentSchedule.status : 'NONE'
      })
    }
    
    results.sort((a, b) => (a.groupNumber || 0) - (b.groupNumber || 0))

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal()
    const json = await request.json()
    const { date, centreId, entries } = json

    if (!date || !centreId || !entries) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const paidDate = new Date(date)

    // Issue 2: Cross-org bypass fix.
    // Validate all loanIds belong to the caller's organization using the scoped Prisma client.
    const loanIds = entries.map((e: any) => e.loanId)
    const validLoans = await dal.prisma.loan.findMany({
      where: { id: { in: loanIds } },
      select: { id: true }
    })
    const validLoanIds = new Set(validLoans.map((l: any) => l.id))

    for (const entry of entries) {
      if (!validLoanIds.has(entry.loanId)) {
        return NextResponse.json({ error: `Invalid or unauthorized loan ID: ${entry.loanId}` }, { status: 403 })
      }
    }

    const result = await dal.prisma.$transaction(async (tx: any) => {
      let savedCount = 0
      let totalCollected = 0

      for (const entry of entries) {
        const { loanId, scheduleId, instalmentNumber, amount, status, note } = entry
        
        const decimalAmount = new Prisma.Decimal(amount || 0)

        // Issue 3: Idempotency check. Avoid double-billing if the request is retried.
        const existingRepayment = await tx.loanRepayment.findFirst({
          where: {
            loanId,
            instalmentNumber,
            paidDate
          }
        })
        if (existingRepayment) {
          continue // Skip this entry as it was already processed
        }

        if (status !== 'NP' && amount > 0) {
          await tx.loanRepayment.create({
            data: {
              loanId,
              instalmentNumber,
              scheduledDate: paidDate,
              paidDate,
              amount: decimalAmount,
              method: 'CASH',
              note
            }
          })

          // Issue 4: Race condition fix. Use atomic increment/decrement.
          const updatedLoan = await tx.loan.update({
            where: { id: loanId },
            data: {
              totalPaid: { increment: decimalAmount },
              outstanding: { decrement: decimalAmount }
            }
          })

          // Check if loan is now settled
          if (updatedLoan.outstanding.lte(0) && updatedLoan.status !== 'SETTLED') {
            await tx.loan.update({
              where: { id: loanId },
              data: { status: 'SETTLED' }
            })
          }

          if (scheduleId) {
            const updatedSchedule = await tx.repaymentSchedule.update({
              where: { id: scheduleId },
              data: {
                paidAmount: { increment: decimalAmount }
              }
            })
            
            const newScheduleStatus = updatedSchedule.paidAmount.gte(updatedSchedule.scheduledAmount) ? 'PAID' : 'PARTIALLY_PAID'
            if (updatedSchedule.status !== newScheduleStatus) {
              await tx.repaymentSchedule.update({
                where: { id: scheduleId },
                data: { status: newScheduleStatus }
              })
            }
          }
          savedCount++
          totalCollected += amount
        } else if (status === 'NP') {
          if (scheduleId) {
            await tx.repaymentSchedule.update({
              where: { id: scheduleId },
              data: { status: 'MISSED' }
            })
          }
          await tx.loanRepayment.create({
            data: {
              loanId,
              instalmentNumber,
              scheduledDate: paidDate,
              paidDate,
              amount: new Prisma.Decimal(0),
              method: 'CASH',
              note: note || 'NP'
            }
          })
          savedCount++
        }
      }

      return { savedCount, totalCollected }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
