import { NextRequest, NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { uploadDocument } from "@/lib/storage"
import { MemberDocumentType } from "@prisma/client"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: memberId } = await params
    const { prisma, organizationId } = await getScopedDal()

    const documents = await prisma.memberDocument.findMany({
      where: { memberId },
      orderBy: { uploadedAt: "desc" },
      include: {
        uploadedBy: { select: { name: true } }
      }
    })

    return NextResponse.json(documents)
  } catch (error: any) {
    if (error.message === "ORG_SUSPENDED") return new NextResponse("Organization Suspended", { status: 403 })
    console.error("Error fetching documents:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: memberId } = await params
    const { prisma, organizationId, userId } = await getScopedDal()

    // Verify member belongs to org
    const member = await prisma.member.findUnique({
      where: { id: memberId }
    })

    if (!member) {
      return new NextResponse("Member not found", { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const type = formData.get("type") as MemberDocumentType | null

    if (!file || !type) {
      return new NextResponse("Missing file or document type", { status: 400 })
    }

    let uploadResult
    try {
      uploadResult = await uploadDocument(file, organizationId, memberId)
    } catch (e: any) {
      return new NextResponse(e.message, { status: 400 })
    }

    const document = await prisma.memberDocument.create({
      data: {
        organizationId,
        memberId,
        type,
        status: "PENDING",
        fileName: uploadResult.fileName,
        storagePath: uploadResult.storagePath,
        mimeType: uploadResult.mimeType,
        fileSize: uploadResult.fileSize,
        uploadedById: userId!
      }
    })

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId!,
        action: "CREATE",
        entityType: "MemberDocument",
        entityId: document.id,
        note: `Uploaded document ${uploadResult.fileName}`
      }
    })

    return NextResponse.json(document)
  } catch (error: any) {
    if (error.message === "ORG_SUSPENDED") return new NextResponse("Organization Suspended", { status: 403 })
    console.error("Error uploading document:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
