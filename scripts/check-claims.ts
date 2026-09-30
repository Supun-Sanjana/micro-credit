import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const attempts = await prisma.loginAttempt.findMany({ where: { email: 'super@steep.local' } })
  console.log(`Login attempts for super@steep.local: ${attempts.length}`)
  if (attempts.length > 0) {
    // Clear them so user isn't locked out
    await prisma.loginAttempt.deleteMany({ where: { email: 'super@steep.local' } })
    console.log('Cleared all failed login attempts.')
  }
}
main().finally(() => prisma.$disconnect())
