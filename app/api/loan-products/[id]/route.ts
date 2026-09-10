import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dal = await getScopedDal()
    const { id } = await params
    
    const product = await dal.prisma.loanProduct.findUnique({
      where: { id }
    })
    
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
      
    return NextResponse.json(product)
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
    
    const product = await dal.prisma.loanProduct.update({
      where: { id },
      data: {
        name: json.name,
        loanType: json.loanType,
        numberOfWeeks: json.numberOfWeeks,
        multiplier: json.multiplier,
        isActive: json.isActive,
      }
    })
    
    return NextResponse.json(product)
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
    
    await dal.prisma.loanProduct.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
