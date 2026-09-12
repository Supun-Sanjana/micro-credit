import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dal = await getScopedDal()
    const { id } = await params
    
    const centre = await dal.prisma.centre.findUnique({
      where: { id },
      include: { branch: true }
    })
    
    if (!centre) return NextResponse.json({ error: "Not found" }, { status: 404 })
      
    return NextResponse.json(centre)
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
    
    // Check if new branch belongs to org (if branchId changed)
    if (json.branchId) {
      const branch = await dal.prisma.branch.findUnique({ where: { id: json.branchId } })
      if (!branch) {
        return NextResponse.json({ error: "Invalid branch" }, { status: 400 })
      }
    }
    
    const centre = await dal.prisma.centre.update({
      where: { id },
      data: {
        centreNumber: json.centreNumber,
        centreCode: json.centreCode,
        name: json.name,
        isMicro: json.isMicro,
        branchId: json.branchId,
      }
    })
    
    return NextResponse.json(centre)
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
    
    await dal.prisma.centre.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
