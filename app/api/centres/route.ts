import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"

export async function GET() {
  try {
    const dal = await getScopedDal()
    
    // Fetch centres where branch belongs to user's org
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    const [centres, total] = await Promise.all([
      dal.prisma.centre.findMany({
        where,
        include: { branch: true, officer: true },
        orderBy: [{ branchId: 'asc' }, { centreCode: 'asc' }],
        skip,
        take: limit
      }),
      dal.prisma.centre.count({ where })
    ])
    
    return NextResponse.json({
      data: centres,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    })
    
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal()
    const json = await request.json()
    
    // Verify the branch belongs to the org
    const branch = await dal.branches.findUnique({ where: { id: json.branchId } })
    if (!branch) {
      return NextResponse.json({ error: "Invalid branch" }, { status: 400 })
    }

    if (json.officerId) {
       // Verify officer is in same org
       const officer = await dal.prisma.user.findFirst({
         where: { id: json.officerId, organizationId: dal.organizationId }
       })
       if (!officer) return NextResponse.json({ error: "Invalid officer" }, { status: 400 })
    }

    const centre = await dal.prisma.centre.create({
      data: {
        centreNumber: json.centreNumber,
        centreCode: json.centreCode,
        name: json.name,
        isMicro: json.isMicro,
        branchId: json.branchId,
        officerId: json.officerId || null
      }
    })
    
    return NextResponse.json(centre, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
