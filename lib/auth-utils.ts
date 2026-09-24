import { auth } from "@/auth"
import { Role } from "@prisma/client"

/**
 * Ensures the current user has one of the required roles.
 * Throws an error if unauthorized.
 */
export async function requireRole(allowedRoles: Role[]) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const userRole = (session.user as any).role as Role

  // SYSTEM_ADMIN generally has access to everything
  if (userRole === 'SYSTEM_ADMIN' || userRole === 'ADMIN' as any) {
    return
  }

  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Forbidden: requires one of [${allowedRoles.join(", ")}], but user is ${userRole}`)
  }
}

/**
 * Returns true if the user has the given role. Useful for UI rendering.
 */
export function hasRole(user: any, allowedRoles: Role[]) {
  if (!user || !user.role) return false
  if (user.role === 'SYSTEM_ADMIN' || user.role === 'ADMIN') return true
  return allowedRoles.includes(user.role as Role)
}

/**
 * Checks if the user is allowed to perform branch-level actions.
 */
export function canAccessBranch(user: any, branchId: string) {
  if (user.role === 'SYSTEM_ADMIN' || user.role === 'ADMIN' || user.role === 'HEAD_OFFICE' || user.role === 'ACCOUNTANT') return true
  return user.branchId === branchId
}
