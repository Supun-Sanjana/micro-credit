import prisma from "./prisma"

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export async function checkRateLimit(email: string, ip: string = "unknown") {
  const lockoutTime = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000)

  const recentAttempts = await prisma.loginAttempt.count({
    where: {
      email,
      timestamp: { gte: lockoutTime }
    }
  })

  if (recentAttempts >= MAX_ATTEMPTS) {
    throw new Error(`Too many login attempts. Please try again in ${LOCKOUT_MINUTES} minutes.`)
  }
}

export async function recordFailedLogin(email: string, ip: string = "unknown") {
  await prisma.loginAttempt.create({
    data: { email, ip }
  })
}

export async function clearFailedLogins(email: string) {
  await prisma.loginAttempt.deleteMany({
    where: { email }
  })
}
