import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { checkDuplicateNIC, checkDuplicatePhone } from "@/lib/intelligence/anomaly-detector"

export async function GET(request: Request) {
  try {
    const dal = await getScopedDal()
    const { searchParams } = new URL(request.url)
    const centreId = searchParams.get("centreId")
    
    const where: any = {
      centre: { branch: { organizationId: dal.organizationId } }
    }
    if (centreId) where.centreId = centreId

    const members = await dal.prisma.member.findMany({
      where,
      include: { centre: { include: { branch: true } } },
      orderBy: { memberNumber: 'asc' }
    })
    
    return NextResponse.json(members)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal()
    const json = await request.json()
    
    // Verify centre belongs to org
    const centre = await dal.prisma.centre.findUnique({
      where: { id: json.centreId },
      include: { branch: true }
    })
    
    if (!centre || centre.branch.organizationId !== dal.organizationId) {
      return NextResponse.json({ error: "Invalid centre" }, { status: 400 })
    }

    // NIC duplicate check (optional field but must be unique if provided)
    if (json.nic) {
      const existing = await dal.prisma.member.findFirst({
        where: { nic: json.nic }
      })
      if (existing) {
        return NextResponse.json({ error: "NIC already exists" }, { status: 400 })
      }
    }

    // memberNumber generator logic: centreCode + "/001"
    const countInCentre = await dal.prisma.member.count({
      where: { centreId: json.centreId }
    })
    const seq = String(countInCentre + 1).padStart(3, '0')
    const memberNumber = `${centre.centreCode}/${seq}`

    const member = await dal.prisma.member.create({
      data: {
        memberNumber,
        name: json.name,
        nic: json.nic,
        address: json.address,
        contact1: json.contact1,
        contact2: json.contact2,
        groupNumber: json.groupNumber,
        centreId: json.centreId,
        organizationId: dal.organizationId
      }
    })
    
    // Risk anomaly detection
    checkDuplicateNIC(member.nic, dal.organizationId, member.id)
    checkDuplicatePhone(member.contact1, dal.organizationId, member.id)
    if (member.contact2) {
      checkDuplicatePhone(member.contact2, dal.organizationId, member.id)
    }
    
    return NextResponse.json(member, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
