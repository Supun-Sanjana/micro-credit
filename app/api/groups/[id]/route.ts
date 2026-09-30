import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { logAudit } from "@/lib/audit"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const dal = await getScopedDal()
    const { id } = await params
    const body = await request.json()
    
    const existing = await dal.prisma.group.findUnique({
      where: { id }
    })
    
    if (!existing || existing.organizationId !== dal.organizationId) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }
    
    const updated = await dal.prisma.group.update({
      where: { id },
      data: {
        centreId: body.centreId,
        groupNumber: Number(body.groupNumber),
        name: body.name,
        meetingDay: body.meetingDay || null,
        meetingTime: body.meetingTime || null,
      }
    })
    
    await logAudit({ dal, action: "UPDATE", entityType: "Group", entityId: updated.id, before: existing, after: updated })
    return NextResponse.json(updated)
  } catch (error: any) { 
    return NextResponse.json({ error: error.message }, { status: 400 }) 
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const dal = await getScopedDal()
    const { id } = await params
    
    const existing = await dal.prisma.group.findUnique({
      where: { id }
    })
    
    if (!existing || existing.organizationId !== dal.organizationId) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }
    
    await dal.prisma.group.delete({
      where: { id }
    })
    
    await logAudit({ dal, action: "DELETE", entityType: "Group", entityId: id, before: existing })
    return NextResponse.json({ success: true })
  } catch (error: any) { 
    return NextResponse.json({ error: error.message }, { status: 400 }) 
  }
}
