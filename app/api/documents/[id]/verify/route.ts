import { NextRequest, NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { DocumentStatus } from "@prisma/client"
import { dispatchNotification } from "@/lib/services/notification-service"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { prisma, organizationId, userId, role } = await getScopedDal()

    if (role !== "BRANCH_MANAGER" && role !== "HEAD_OFFICE" && role !== "SYSTEM_ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { status, reason } = await req.json() as { status: DocumentStatus; reason?: string }

    if (status !== "VERIFIED" && status !== "REJECTED") {
      return new NextResponse("Invalid status", { status: 400 })
    }

    const document = await prisma.memberDocument.findUnique({
      where: { id }
    })

    if (!document) {
      return new NextResponse("Not found", { status: 404 })
    }

    if (document.status === "VERIFIED") {
      return new NextResponse("Document is already verified", { status: 400 })
    }

    await prisma.$transaction([
      prisma.memberDocument.update({
        where: { id },
        data: { status }
      }),
      prisma.documentVerification.create({
        data: {
          documentId: id,
          status,
          reason,
          verifiedById: userId!
        }
      }),
      prisma.auditLog.create({
        data: {
          organizationId,
          userId: userId!,
          action: "UPDATE",
          entityType: "MemberDocument",
          entityId: id,
          note: `Document ${status.toLowerCase()}`
        }
      })
    ])

    if (status === "REJECTED") {
      await dispatchNotification({
        type: 'DOCUMENT_REJECTED',
        payload: {
          memberId: document.memberId,
          organizationId,
          documentId: id,
          documentType: document.type,
          reason
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "ORG_SUSPENDED") return new NextResponse("Organization Suspended", { status: 403 })
    console.error("Error verifying document:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
