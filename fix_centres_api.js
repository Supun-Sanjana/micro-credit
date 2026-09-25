const fs = require('fs');
const file = 'app/api/centres/route.ts';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  'export async function GET() {\n  try {\n    const dal = await getScopedDal()\n    \n    // Fetch centres where branch belongs to user\'s org\n    const page = parseInt(searchParams.get("page") || "1")',
  'export async function GET(request: Request) {\n  try {\n    const dal = await getScopedDal()\n    const { searchParams } = new URL(request.url)\n    const where = { branch: { organizationId: dal.organizationId } }\n    const page = parseInt(searchParams.get("page") || "1")'
);

fs.writeFileSync(file, c);
