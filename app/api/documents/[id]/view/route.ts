import { NextRequest, NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { generateSignedUrl } from "@/lib/storage"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { prisma, organizationId, userId } = await getScopedDal()

    const document = await prisma.memberDocument.findUnique({
      where: { id }
    })

    if (!document) {
      return new NextResponse("Not found", { status: 404 })
    }

    const url = await generateSignedUrl(document.storagePath)

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId!,
        action: "UPDATE",
        entityType: "MemberDocument",
        entityId: id,
        note: `Viewed document ${document.fileName}`
      }
    })

    return NextResponse.json({ url })
  } catch (error: any) {
    if (error.message === "ORG_SUSPENDED") return new NextResponse("Organization Suspended", { status: 403 })
    console.error("Error viewing document:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
