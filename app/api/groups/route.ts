import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { logAudit } from "@/lib/audit"

export async function GET(request: Request) {
  try {
    const dal = await getScopedDal()
    const centreId = new URL(request.url).searchParams.get("centreId")
    return NextResponse.json(await dal.prisma.group.findMany({
      where: centreId ? { centreId } : {},
      include: { centre: true, memberships: { where: { status: "ACTIVE" }, include: { member: true } } },
      orderBy: [{ centreId: "asc" }, { groupNumber: "asc" }],
    }))
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 401 }) }
}

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal(); const body = await request.json()
    const centre = await dal.prisma.centre.findUnique({ where: { id: body.centreId }, include: { branch: true } })
    if (!centre || centre.branch.organizationId !== dal.organizationId) return NextResponse.json({ error: "Invalid centre" }, { status: 400 })
    const group = await dal.prisma.group.create({ data: { organizationId: dal.organizationId, branchId: centre.branchId, centreId: centre.id, groupNumber: Number(body.groupNumber), name: body.name, meetingDay: body.meetingDay || null, meetingTime: body.meetingTime || null, formationDate: body.formationDate ? new Date(body.formationDate) : null } })
    await logAudit({ dal, action: "CREATE", entityType: "Group", entityId: group.id, after: group })
    return NextResponse.json(group, { status: 201 })
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}
