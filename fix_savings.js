const fs = require('fs')
const file = 'app/actions/savings.ts'
let content = fs.readFileSync(file, 'utf8')

content = content.replace(`export async function getSavingsProducts() {
  const session = await getSession()
  const orgId = session.user.organizationId!
  return prisma.savingsProduct.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  })
}`, `export async function getSavingsProducts() {
  const session = await getSession()
  const orgId = session.user.organizationId!
  const products = await prisma.savingsProduct.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  })
  return products.map(p => ({ ...p, interestRate: p.interestRate.toString(), minimumBalance: p.minimumBalance.toString() }))
}`)

fs.writeFileSync(file, content)
