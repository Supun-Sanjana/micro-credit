import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"

export async function GET(request: Request) {
  try {
    const dal = await getScopedDal()
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get("branchId")

    const where: any = {
      branch: { organizationId: dal.organizationId }
    }
    if (branchId) where.branchId = branchId

    const centres = await dal.prisma.centre.findMany({
      where,
      include: {
        members: {
          include: {
            loans: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      }
    })

    const report = centres.map(c => {
      let activeLoansCount = 0
      let totalOutstanding = 0

      for (const m of c.members) {
        for (const l of m.loans) {
          activeLoansCount++
          totalOutstanding += l.outstanding.toNumber()
        }
      }

      return {
        centreId: c.id,
        centreCode: c.centreCode,
        centreName: c.name,
        activeMembers: c.members.filter(m => m.loans.length > 0).length,
        activeLoansCount,
        totalOutstanding
      }
    })

    return NextResponse.json(report)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
