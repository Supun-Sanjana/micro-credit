const fs = require('fs');
const file = 'app/api/loans/route.ts';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  /const loans = await dal\.prisma\.loan\.findMany\(\{[\s\S]*?\}\)/,
  `const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const [loans, total] = await Promise.all([
      dal.prisma.loan.findMany({
        where,
        include: { member: true, loanProduct: true, guarantors: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      dal.prisma.loan.count({ where })
    ])
    
    return NextResponse.json({
      data: loans,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    })`
);

c = c.replace(/return NextResponse\.json\(loans\)/, '');

fs.writeFileSync(file, c);
console.log('done');
