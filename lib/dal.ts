import { auth } from "@/auth"
import prisma, { withOrgScope } from "@/lib/prisma"
import { ensureActiveSubscription } from "@/lib/subscription"

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

  // Enforce Subscription / Trial Gate at API layer
  await ensureActiveSubscription(organizationId)

  const role = (session.user as any).role
  const branchId = (session.user as any).branchId

  // Verify the user is still active in the system
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true }
  })

  if (currentUser?.isActive === false) {
    throw new Error("Your account has been suspended.")
  }

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
