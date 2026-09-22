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

  // Issue 6: Enforce Subscription Gate at API layer
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { subscription: true }
  })

  if (org?.subscription?.status === 'SUSPENDED') {
    throw new Error("ORG_SUSPENDED")
  }

  const role = (session.user as any).role
  const branchId = (session.user as any).branchId

  const scopedPrisma = prisma.$extends(withOrgScope(
    organizationId, 
    (role === "FIELD_OFFICER" || role === "BRANCH_MANAGER") ? branchId : null
  ))

  return {
    organizationId,
    userId: session.user.id,
    role,
    prisma: scopedPrisma,
    // Provide explicit aliases for convenience if needed, but scopedPrisma is safe
    branches: scopedPrisma.branch,
  }
}
