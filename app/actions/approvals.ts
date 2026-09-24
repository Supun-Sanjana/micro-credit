"use server"

import { getScopedDal } from "@/lib/dal"
import { requireRole } from "@/lib/auth-utils"
import { Prisma, Role } from "@prisma/client"
import { revalidatePath } from "next/cache"

async function authorizeApprovals() {
  await requireRole(["SYSTEM_ADMIN", "HEAD_OFFICE"])
}

export async function getApprovalRules() {
  await authorizeApprovals()
  const dal = await getScopedDal()

  const rules = await dal.prisma.approvalRule.findMany({
    where: { organizationId: dal.organizationId },
    orderBy: { minAmount: 'asc' }
  })

  // Prisma Decimals to Numbers for Client Components
  return rules.map(r => ({
    id: r.id,
    minAmount: r.minAmount.toNumber(),
    maxAmount: r.maxAmount.toNumber(),
    requiredRole: r.requiredRole
  }))
}

export async function saveApprovalRule(data: { id?: string, minAmount: number, maxAmount: number, requiredRole: Role }) {
  await authorizeApprovals()
  const dal = await getScopedDal()

  if (data.id) {
    await dal.prisma.approvalRule.update({
      where: { id: data.id, organizationId: dal.organizationId },
      data: {
        minAmount: new Prisma.Decimal(data.minAmount),
        maxAmount: new Prisma.Decimal(data.maxAmount),
        requiredRole: data.requiredRole
      }
    })
  } else {
    await dal.prisma.approvalRule.create({
      data: {
        organizationId: dal.organizationId,
        minAmount: new Prisma.Decimal(data.minAmount),
        maxAmount: new Prisma.Decimal(data.maxAmount),
        requiredRole: data.requiredRole
      }
    })
  }
  
  revalidatePath("/app/settings/approvals")
  return { success: true }
}

export async function deleteApprovalRule(id: string) {
  await authorizeApprovals()
  const dal = await getScopedDal()

  await dal.prisma.approvalRule.delete({
    where: { id, organizationId: dal.organizationId }
  })
  
  revalidatePath("/app/settings/approvals")
  return { success: true }
}

/**
 * Validates if the user has permission to approve a loan of a certain amount.
 */
export async function canApproveLoanAmount(amount: Prisma.Decimal, role: Role, dal: Awaited<ReturnType<typeof getScopedDal>>) {
  // SYSTEM_ADMIN and HEAD_OFFICE override
  if (role === 'SYSTEM_ADMIN' || role === 'HEAD_OFFICE') return true

  const rules = await dal.prisma.approvalRule.findMany({
    where: { organizationId: dal.organizationId },
    orderBy: { minAmount: 'desc' }
  })

  // If no rules exist, default to old behavior (Admin/Head Office/Branch Manager)
  if (rules.length === 0) {
    return role === 'BRANCH_MANAGER'
  }

  // Find the highest threshold the loan amount crosses
  // Example:
  // Rule A: 0 - 50k -> BRANCH_MANAGER
  // Rule B: 50k - 200k -> HEAD_OFFICE
  
  const applicableRule = rules.find(r => amount.gte(r.minAmount) && amount.lte(r.maxAmount))
  
  if (!applicableRule) {
    // If no rule matches (e.g. gap in rules), fallback to false unless System Admin
    return false
  }

  const roleHierarchy: Record<Role, number> = {
    FIELD_OFFICER: 1,
    BRANCH_MANAGER: 2,
    ACCOUNTANT: 3,
    HEAD_OFFICE: 4,
    SYSTEM_ADMIN: 5
  }

  return roleHierarchy[role] >= roleHierarchy[applicableRule.requiredRole]
}
