import { AuditAction } from "@prisma/client"

export async function logAudit({
  dal,
  action,
  entityType,
  entityId,
  before,
  after,
  note
}: {
  dal: { prisma: any; organizationId: string; userId?: string }
  action: AuditAction
  entityType: string
  entityId: string
  before?: any
  after?: any
  note?: string
}) {
  return await dal.prisma.auditLog.create({
    data: {
      organizationId: dal.organizationId,
      userId: dal.userId,
      action,
      entityType,
      entityId,
      before: before ? JSON.stringify(before) : undefined,
      after: after ? JSON.stringify(after) : undefined,
      note
    }
  })
}
