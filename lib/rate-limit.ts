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


const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

export function checkMemoryRateLimit(identifier: string, limit: number = 5, windowMinutes: number = 10) {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (record) {
    if (now > record.resetTime) {
      rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMinutes * 60 * 1000 });
    } else {
      record.count += 1;
      if (record.count > limit) {
        throw new Error(`Too many requests. Please try again in ${windowMinutes} minutes.`);
      }
    }
  } else {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMinutes * 60 * 1000 });
  }
}
