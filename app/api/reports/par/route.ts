import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"

export async function GET(request: Request) {
  try {
    const dal = await getScopedDal()
    const now = new Date()

    // Find all active loans with their schedules
    const loans = await dal.prisma.loan.findMany({
      where: {
        status: 'ACTIVE',
        member: {
          organizationId: dal.organizationId
        }
      },
      include: {
        repaymentSchedule: {
          where: {
            isPaid: false,
            scheduledDate: { lt: now } // Only care about past due schedules
          },
          orderBy: { scheduledDate: 'asc' }
        }
      }
    })

    let par1 = 0
    let par7 = 0
    let par30 = 0
    let par90 = 0
    let totalOutstanding = 0

    for (const loan of loans) {
      totalOutstanding += loan.outstanding.toNumber()

      if (loan.repaymentSchedule.length > 0) {
        // The oldest unpaid schedule determines the PAR days
        const oldestDue = loan.repaymentSchedule[0].scheduledDate
        const daysPastDue = Math.floor((now.getTime() - oldestDue.getTime()) / (1000 * 60 * 60 * 24))
        
        const outstanding = loan.outstanding.toNumber()
        if (daysPastDue >= 90) {
          par90 += outstanding
        } else if (daysPastDue >= 30) {
          par30 += outstanding
        } else if (daysPastDue >= 7) {
          par7 += outstanding
        } else if (daysPastDue >= 1) {
          par1 += outstanding
        }
      }
    }

    return NextResponse.json({
      totalOutstanding,
      par1,
      par7,
      par30,
      par90,
      parTotal: par1 + par7 + par30 + par90
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
