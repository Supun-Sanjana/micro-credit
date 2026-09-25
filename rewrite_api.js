const fs = require('fs');

const file = 'app/api/members/route.ts';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  /const members = await dal\.prisma\.member\.findMany\(\{[\s\S]*?\}\)/,
  `const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const [members, total] = await Promise.all([
      dal.prisma.member.findMany({
        where,
        include: { centre: { include: { branch: true } } },
        orderBy: { memberNumber: 'asc' },
        skip,
        take: limit
      }),
      dal.prisma.member.count({ where })
    ])
    
    return NextResponse.json({
      data: members,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    })`
);

c = c.replace(/return NextResponse\.json\(members\)/, '');

fs.writeFileSync(file, c);
console.log('done');
