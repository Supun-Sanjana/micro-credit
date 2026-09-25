const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  try {
     const member = await prisma.member.findFirst();
     const product = await prisma.savingsProduct.findFirst();
     console.log(member.id, product.id)
  } catch(e) {
     console.error(e)
  }
}
main()
