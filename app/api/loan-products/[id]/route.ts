import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { logAudit } from "@/lib/audit"

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
    
    const existingProduct = await dal.prisma.loanProduct.findUnique({ where: { id } })
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
    
    await logAudit({
      dal,
      action: "UPDATE",
      entityType: "LoanProduct",
      entityId: id,
      before: existingProduct,
      after: product
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
    
    const product = await dal.prisma.loanProduct.findUnique({ where: { id } })
    await dal.prisma.loanProduct.delete({
      where: { id }
    })
    
    if (product) {
      await logAudit({
        dal,
        action: "DELETE",
        entityType: "LoanProduct",
        entityId: id,
        before: product
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
