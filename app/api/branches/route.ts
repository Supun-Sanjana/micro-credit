import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"

export async function GET() {
  try {
    const dal = await getScopedDal()
    const branches = await dal.branches.findMany({
      orderBy: { code: 'asc' }
    })
    return NextResponse.json(branches)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal()
    const json = await request.json()
    
    const branch = await dal.prisma.branch.create({
      data: {
        code: json.code,
        name: json.name,
        address: json.address,
        organizationId: dal.organizationId
      }
    })
    
    return NextResponse.json(branch, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
