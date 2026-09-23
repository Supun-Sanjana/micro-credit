import { NextRequest, NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { DocumentStatus } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const { prisma, role } = await getScopedDal()

    if (role !== "BRANCH_MANAGER" && role !== "HEAD_OFFICE" && role !== "SYSTEM_ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status") as DocumentStatus | null
    const type = searchParams.get("type")

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    const documents = await prisma.memberDocument.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      include: {
        member: { select: { name: true, memberNumber: true } },
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
