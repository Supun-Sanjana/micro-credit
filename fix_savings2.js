const fs = require('fs')
const file = 'app/actions/savings.ts'
let lines = fs.readFileSync(file, 'utf8').split('\n')

const newBlock = `export async function getSavingsProducts() {
  const session = await getSession()
  const orgId = session.user.organizationId!
  const products = await prisma.savingsProduct.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  })
  return products.map(p => ({ ...p, interestRate: p.interestRate.toString(), minimumBalance: p.minimumBalance.toString() }))
}`

let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export async function getSavingsProducts')) {
    start = i;
  }
  if (start !== -1 && lines[i].includes('export async function createSavingsProduct')) {
    end = i - 1;
    break;
  }
}

if (start !== -1 && end !== -1) {
  let newLines = [...lines.slice(0, start), newBlock, ...lines.slice(end)];
  fs.writeFileSync(file, newLines.join('\n'));
  console.log('done');
}
