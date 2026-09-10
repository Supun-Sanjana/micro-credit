import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"

export async function GET() {
  try {
    const dal = await getScopedDal()
    
    const products = await dal.prisma.loanProduct.findMany({
      where: { organizationId: dal.organizationId },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(products)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal()
    const json = await request.json()
    
    const product = await dal.prisma.loanProduct.create({
      data: {
        name: json.name,
        loanType: json.loanType,
        numberOfWeeks: json.numberOfWeeks,
        multiplier: json.multiplier,
        isActive: json.isActive ?? true,
        organizationId: dal.organizationId
      }
    })
    
    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
