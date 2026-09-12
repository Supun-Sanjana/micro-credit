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

    const result = await dal.prisma.$transaction(async (tx) => {
      let savedCount = 0
      let totalCollected = 0

      for (const entry of entries) {
        const { loanId, scheduleId, instalmentNumber, amount, status, note } = entry
        
        const decimalAmount = new Prisma.Decimal(amount || 0)

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

          const loan = await tx.loan.findUnique({ where: { id: loanId } })
          if (loan) {
            const newPaid = loan.totalPaid.add(decimalAmount)
            const newOutstanding = loan.outstanding.minus(decimalAmount)
            const newStatus = newOutstanding.lte(0) ? 'SETTLED' : loan.status

            await tx.loan.update({
              where: { id: loanId },
              data: {
                totalPaid: newPaid,
                outstanding: newOutstanding,
                status: newStatus
              }
            })
          }

          if (scheduleId) {
            const schedule = await tx.repaymentSchedule.findUnique({ where: { id: scheduleId } })
            if (schedule) {
              const newPaidAmount = schedule.paidAmount.add(decimalAmount)
              const newScheduleStatus = newPaidAmount.gte(schedule.scheduledAmount) ? 'PAID' : 'PARTIALLY_PAID'

              await tx.repaymentSchedule.update({
                where: { id: scheduleId },
                data: {
                  paidAmount: newPaidAmount,
                  status: newScheduleStatus
                }
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
