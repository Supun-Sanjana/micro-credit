const fs = require('fs');
const file = 'app/app/(dashboard)/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "prisma.loan.findMany({ where: { organizationId: orgId, status: 'ACTIVE' }, select: { outstanding: true } })",
  "prisma.loan.findMany({ where: { member: { organizationId: orgId }, status: 'ACTIVE' }, select: { outstanding: true } })"
);

content = content.replace(
  "repaymentDate: { gte: today }",
  "paidDate: { gte: today }"
);

content = content.replace(
  "{log.user.name || log.user.email}",
  "{log.user?.name || log.user?.email || 'System'}"
);

fs.writeFileSync(file, content);
console.log('done');
