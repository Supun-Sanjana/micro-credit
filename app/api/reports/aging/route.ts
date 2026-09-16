import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"

export async function GET(request: Request) {
  try {
    const dal = await getScopedDal()
    const now = new Date()

    // Find all active loans with unpaid schedules in the past
    const loans = await dal.prisma.loan.findMany({
      where: {
        status: 'ACTIVE',
        member: {
          organizationId: dal.organizationId
        },
        repaymentSchedule: {
          some: {
            isPaid: false,
            scheduledDate: { lt: now }
          }
        }
      },
      include: {
        member: { include: { centre: { include: { branch: true } } } },
        repaymentSchedule: {
          where: {
            isPaid: false,
            scheduledDate: { lt: now }
          },
          orderBy: { scheduledDate: 'asc' }
        }
      }
    })

    const report = loans.map(loan => {
      let overdueAmount = 0
      for (const s of loan.repaymentSchedule) {
        overdueAmount += s.scheduledAmount.toNumber()
      }

      const oldestDue = loan.repaymentSchedule[0].scheduledDate
      const daysPastDue = Math.floor((now.getTime() - oldestDue.getTime()) / (1000 * 60 * 60 * 24))

      return {
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        memberName: loan.member.name,
        memberNumber: loan.member.memberNumber,
        branchName: loan.member.centre.branch.name,
        centreName: loan.member.centre.name,
        outstanding: loan.outstanding.toNumber(),
        overdueAmount,
        daysPastDue,
        oldestDueDate: oldestDue
      }
    })

    // sort by daysPastDue desc
    report.sort((a, b) => b.daysPastDue - a.daysPastDue)

    return NextResponse.json(report)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
