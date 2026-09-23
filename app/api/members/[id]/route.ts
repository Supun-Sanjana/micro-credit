import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { logAudit } from "@/lib/audit"
import { checkDuplicateNIC, checkDuplicatePhone } from "@/lib/intelligence/anomaly-detector"
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dal = await getScopedDal()
    const { id } = await params
    
    const member = await dal.prisma.member.findUnique({
      where: { id },
      include: { centre: { include: { branch: true } }, loans: true }
    })
    
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })
      
    return NextResponse.json(member)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dal = await getScopedDal()
    const { id } = await params
    const json = await request.json()
    
    if (json.centreId) {
      const centre = await dal.prisma.centre.findUnique({ where: { id: json.centreId }, include: { branch: true } })
      if (!centre || centre.branch.organizationId !== dal.organizationId) {
        return NextResponse.json({ error: "Invalid centre" }, { status: 400 })
      }
    }

    if (json.nic) {
      const existing = await dal.prisma.member.findFirst({
        where: { nic: json.nic, id: { not: id } }
      })
      if (existing) {
        return NextResponse.json({ error: "NIC already exists" }, { status: 400 })
      }
    }
    
    const existingMember = await dal.prisma.member.findUnique({ where: { id } })
    const member = await dal.prisma.member.update({
      where: { id },
      data: {
        name: json.name,
        nic: json.nic,
        address: json.address,
        contact1: json.contact1,
        contact2: json.contact2,
        groupNumber: json.groupNumber,
        centreId: json.centreId,
      }
    })
    
    await logAudit({
      dal,
      action: "UPDATE",
      entityType: "Member",
      entityId: id,
      before: existingMember,
      after: member
    })

    // Risk anomaly detection
    checkDuplicateNIC(member.nic, dal.organizationId, member.id)
    checkDuplicatePhone(member.contact1, dal.organizationId, member.id)
    if (member.contact2) {
      checkDuplicatePhone(member.contact2, dal.organizationId, member.id)
    }

    return NextResponse.json(member)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dal = await getScopedDal()
    const { id } = await params
    
    const member = await dal.prisma.member.findUnique({ where: { id } })
    await dal.prisma.member.delete({
      where: { id }
    })
    
    if (member) {
      await logAudit({
        dal,
        action: "DELETE",
        entityType: "Member",
        entityId: id,
        before: member
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
