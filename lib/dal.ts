import { auth } from "@/auth"
import prisma, { withOrgScope } from "@/lib/prisma"

/**
 * Data Access Layer (DAL) helper to enforce organization isolation.
 * Automatically scopes Prisma queries to the current user's organizationId.
 */
export async function getScopedDal() {
  const session = await auth()

  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized: No organization context found")
  }

  const organizationId = session.user.organizationId

  const scopedPrisma = prisma.$extends(withOrgScope(organizationId))

  return {
    organizationId,
    prisma: scopedPrisma,
    // Provide explicit aliases for convenience if needed, but scopedPrisma is safe
    branches: scopedPrisma.branch,
  }
}
