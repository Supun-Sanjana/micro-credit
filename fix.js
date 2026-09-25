const fs = require('fs');
let c = fs.readFileSync('app/api/centres/route.ts', 'utf8');
const i = c.indexOf('export async function POST');
if (i !== -1) {
  const newGet = `export async function GET(request: Request) {
  try {
    const dal = await getScopedDal()
    const { searchParams } = new URL(request.url)
    const where: any = { branch: { organizationId: dal.organizationId } }
    
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

`;
  c = c.substring(0, c.indexOf('export async function GET')) + newGet + c.substring(i);
  fs.writeFileSync('app/api/centres/route.ts', c);
}
