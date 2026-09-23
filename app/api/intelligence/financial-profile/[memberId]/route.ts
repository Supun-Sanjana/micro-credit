import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const dal = await getScopedDal()
    const { memberId } = await params

    const profile = await dal.prisma.financialProfile.findFirst({
      where: { memberId, organizationId: dal.organizationId },
      orderBy: { createdAt: 'desc' }
    })

    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json(profile)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
