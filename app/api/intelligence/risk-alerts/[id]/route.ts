import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { RiskAlertStatus } from "@prisma/client"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dal = await getScopedDal()
    const { id } = await params
    const json = await request.json()
    const { status, resolutionNote } = json

    if (!status || !Object.values(RiskAlertStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const alert = await dal.prisma.riskAlert.findUnique({
      where: { id, organizationId: dal.organizationId }
    })

    if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updatedAlert = await dal.prisma.riskAlert.update({
      where: { id },
      data: {
        status,
        resolutionNote: resolutionNote || alert.resolutionNote,
        resolvedById: status === 'RESOLVED' ? (dal.userId || 'system') : alert.resolvedById,
        resolvedAt: status === 'RESOLVED' ? new Date() : alert.resolvedAt
      }
    })

    return NextResponse.json(updatedAlert)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
