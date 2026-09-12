import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dal = await getScopedDal()
    const { id } = await params
    
    const branch = await dal.prisma.branch.findUnique({
      where: { id }
    })
    
    if (!branch) return NextResponse.json({ error: "Not found" }, { status: 404 })
      
    return NextResponse.json(branch)
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
    
    const branch = await dal.prisma.branch.update({
      where: { id },
      data: {
        name: json.name,
        code: json.code,
        address: json.address,
      }
    })
    
    return NextResponse.json(branch)
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
    
    await dal.prisma.branch.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
