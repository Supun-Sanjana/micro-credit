const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()
async function run() {
  const account = await prisma.savingsAccount.findFirst();
  console.log(account)
}
run()
