const fs = require('fs');

// Fix api/centres/route.ts
let cApi = fs.readFileSync('app/api/centres/route.ts', 'utf8');
cApi = cApi.replace(
  'export async function GET(request: Request) {\n  try {\n    const dal = await getScopedDal()\n    const { searchParams } = new URL(request.url)\n    const where = { branch: { organizationId: dal.organizationId } }\n    const page = parseInt(searchParams.get("page") || "1")',
  'export async function GET(request: Request) {\n  try {\n    const dal = await getScopedDal()\n    const { searchParams } = new URL(request.url)\n    const where: any = { branch: { organizationId: dal.organizationId } }\n    const page = parseInt(searchParams.get("page") || "1")'
);
fs.writeFileSync('app/api/centres/route.ts', cApi);

// Fix centres page
let c = fs.readFileSync('app/app/(dashboard)/centres/page.tsx', 'utf8');
c = c.replace('import { useState }', 'import { useState, useEffect }');
c = c.replace('onSuccess={() => queryClient.invalidateQueries({ queryKey: [\'centres\'] })}', 'onSuccess={() => {}}');
fs.writeFileSync('app/app/(dashboard)/centres/page.tsx', c);

// Fix branches page
let b = fs.readFileSync('app/app/(dashboard)/branches/page.tsx', 'utf8');
b = b.replace('import { useState }', 'import { useState, useEffect }');
b = b.replace('onSuccess={() => queryClient.invalidateQueries({ queryKey: [\'branches\'] })}', 'onSuccess={() => {}}');
fs.writeFileSync('app/app/(dashboard)/branches/page.tsx', b);

// Fix groups page
let g = fs.readFileSync('app/app/(dashboard)/groups/page.tsx', 'utf8');
g = g.replace('import { useState }', 'import { useState, useEffect }');
g = g.replace('onSuccess={() => queryClient.invalidateQueries({ queryKey: [\'groups\'] })}', 'onSuccess={() => {}}');
fs.writeFileSync('app/app/(dashboard)/groups/page.tsx', g);

// Fix loan-products page
let lp = fs.readFileSync('app/app/(dashboard)/loan-products/page.tsx', 'utf8');
lp = lp.replace('onSuccess={() => queryClient.invalidateQueries({ queryKey: [\'loan-products\'] })}', 'onSuccess={() => {}}');
lp = lp.replace('if (res.ok) queryClient.invalidateQueries({ queryKey: [\'loan-products\'] })', 'if (res.ok) window.location.reload()');
lp = lp.replace('if (res.ok) queryClient.invalidateQueries({ queryKey: [\'loan-products\'] })', 'if (res.ok) window.location.reload()');
fs.writeFileSync('app/app/(dashboard)/loan-products/page.tsx', lp);

console.log('Fixed');
