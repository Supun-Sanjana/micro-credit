import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"

export async function GET(request: Request) {
  try {
    const dal = await getScopedDal()
    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get("startDate")
    const endDateStr = searchParams.get("endDate")
    
    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ error: "Missing startDate or endDate" }, { status: 400 })
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    // Get all schedules due in this period
    const schedules = await dal.prisma.repaymentSchedule.findMany({
      where: {
        scheduledDate: { gte: startDate, lte: endDate },
        loan: { member: { organizationId: dal.organizationId } }
      },
      include: {
        loan: {
          include: {
            member: {
              include: { centre: { include: { branch: true } } }
            }
          }
        }
      }
    })

    // Get all repayments in this period (paidDate instead of scheduledDate, or matched by schedule? Actually the requirement says "sum(actually collected) / sum(due) in a date range")
    const repayments = await dal.prisma.loanRepayment.findMany({
      where: {
        paidDate: { gte: startDate, lte: endDate },
        loan: { member: { organizationId: dal.organizationId } }
      },
      include: {
        loan: {
          include: {
            member: {
              include: { centre: { include: { branch: true } } }
            }
          }
        }
      }
    })

    // Group by branch and centre
    const data: Record<string, { branchName: string, centreName: string, scheduled: number, collected: number }> = {}

    for (const s of schedules) {
      const c = s.loan.member.centre
      const key = `${c.branchId}-${c.id}`
      if (!data[key]) {
        data[key] = { branchName: c.branch.name, centreName: c.name, scheduled: 0, collected: 0 }
      }
      data[key].scheduled += s.scheduledAmount.toNumber()
    }

    for (const r of repayments) {
      const c = r.loan.member.centre
      const key = `${c.branchId}-${c.id}`
      if (!data[key]) {
        data[key] = { branchName: c.branch.name, centreName: c.name, scheduled: 0, collected: 0 }
      }
      data[key].collected += r.amount.toNumber()
    }

    const result = Object.values(data).map(d => ({
      branchName: d.branchName,
      centreName: d.centreName,
      scheduled: d.scheduled,
      collected: d.collected,
      efficiency: d.scheduled > 0 ? (d.collected / d.scheduled) * 100 : 0
    }))

    // sort by branchName then centreName
    result.sort((a, b) => a.branchName.localeCompare(b.branchName) || a.centreName.localeCompare(b.centreName))

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
