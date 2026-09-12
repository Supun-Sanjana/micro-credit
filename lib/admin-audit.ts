import prisma from "@/lib/prisma"

export async function logAdminAction({
  platformAdminId,
  action,
  targetType,
  targetId,
  note
}: {
  platformAdminId: string
  action: string
  targetType: string
  targetId: string
  note?: string
}) {
  return await prisma.platformAdminAuditLog.create({
    data: {
      platformAdminId,
      action,
      targetType,
      targetId,
      note
    }
  })
}
