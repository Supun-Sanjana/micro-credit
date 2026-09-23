import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"

export async function GET(request: Request) {
  try {
    const dal = await getScopedDal()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const severity = searchParams.get("severity")

    const where: any = { organizationId: dal.organizationId }
    if (status) where.status = status
    if (type) where.type = type
    if (severity) where.severity = severity

    const alerts = await dal.prisma.riskAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(alerts)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
