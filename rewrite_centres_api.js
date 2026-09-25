const fs = require('fs');
const file = 'app/api/centres/route.ts';
let c = fs.readFileSync(file, 'utf8');

if (!c.includes('const page')) {
  c = c.replace(
    /const centres = await dal\.prisma\.centre\.findMany\(\{[\s\S]*?\}\)/,
    `const page = parseInt(searchParams.get("page") || "1")
      const limit = parseInt(searchParams.get("limit") || "50") // centres are fewer, so default limit 50
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
      })`
  );

  c = c.replace(/return NextResponse\.json\(centres\)/, '');
  fs.writeFileSync(file, c);
}
console.log('done');
