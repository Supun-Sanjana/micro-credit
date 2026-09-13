import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { MemberDocumentType } from "@prisma/client"

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>
}

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await auth()
    const organizationId = (session?.user as any)?.organizationId

    if (!session || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const memberId = resolvedParams.id

    // Fetch all documents for this member within the organization
    const documents = await prisma.memberDocument.findMany({
      where: {
        memberId,
        organizationId,
      },
      orderBy: {
        uploadedAt: "desc",
      },
    })

    // Compute total storage usage for this organization
    const usageAggregate = await prisma.memberDocument.aggregate({
      where: { organizationId },
      _sum: {
        sizeBytes: true,
      },
    })
    const totalUsedBytes = usageAggregate._sum.sizeBytes ?? 0

    // Fetch subscription plan quota
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    })

    let quotaMb = subscription?.plan?.storageQuotaMb
    if (!quotaMb) {
      const defaultPlan = await prisma.subscriptionPlan.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      })
      quotaMb = defaultPlan?.storageQuotaMb ?? 5000
    }

    const quotaBytes = quotaMb * 1024 * 1024

    return NextResponse.json({
      documents,
      totalUsedBytes,
      quotaBytes,
    })
  } catch (error: any) {
    console.error("GET member documents error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await auth()
    const organizationId = (session?.user as any)?.organizationId

    if (!session || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const memberId = resolvedParams.id

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const type = formData.get("type") as MemberDocumentType | null

    if (!file || !type) {
      return NextResponse.json(
        { error: "File and document type are required" },
        { status: 400 }
      )
    }

    // Validate document type
    const validTypes: MemberDocumentType[] = [
      MemberDocumentType.NIC_PHOTO,
      MemberDocumentType.PAYSLIP,
      MemberDocumentType.BANK_BOOK,
      MemberDocumentType.OTHER,
    ]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      )
    }

    // Validate MIME type
    const ext = ALLOWED_MIME_TYPES[file.type]
    if (!ext) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WEBP, and PDF files are allowed." },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit." },
        { status: 400 }
      )
    }

    // Quota check
    const usageAggregate = await prisma.memberDocument.aggregate({
      where: { organizationId },
      _sum: {
        sizeBytes: true,
      },
    })
    const currentUsage = usageAggregate._sum.sizeBytes ?? 0

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    })

    let quotaMb = subscription?.plan?.storageQuotaMb
    if (!quotaMb) {
      const defaultPlan = await prisma.subscriptionPlan.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      })
      quotaMb = defaultPlan?.storageQuotaMb ?? 5000
    }
    const quotaBytes = quotaMb * 1024 * 1024

    if (currentUsage + file.size > quotaBytes) {
      return NextResponse.json(
        { error: "Storage quota exceeded" },
        { status: 413 }
      )
    }

    const { supabase } = await import("@/lib/supabase")

    // Generate filename: [organizationId]/[memberId]/[type]_[Date.now()].[ext]
    const filename = `${organizationId}/${memberId}/${type.toLowerCase()}_${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const { data, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filename, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      throw new Error("Failed to upload document to storage")
    }

    const { data: publicUrlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filename)

    const url = publicUrlData.publicUrl

    // Create MemberDocument record in database
    const document = await prisma.memberDocument.create({
      data: {
        organizationId,
        memberId,
        type,
        url,
        sizeBytes: file.size,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error: any) {
    console.error("POST member document error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload document" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await auth()
    const organizationId = (session?.user as any)?.organizationId

    if (!session || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const memberId = resolvedParams.id

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("documentId")

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      )
    }

    const document = await prisma.memberDocument.findFirst({
      where: {
        id: documentId,
        memberId,
        organizationId,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete database record
    await prisma.memberDocument.delete({
      where: { id: document.id },
    })

    // Try deleting file from storage
    try {
      const { supabase } = await import("@/lib/supabase")
      
      // We need to extract the filename path from the public URL
      // The public URL looks like: https://[project].supabase.co/storage/v1/object/public/documents/[organizationId]/[memberId]/[filename]
      const urlParts = document.url.split("/documents/")
      if (urlParts.length > 1) {
        const filePathInBucket = urlParts[1]
        await supabase.storage.from("documents").remove([filePathInBucket])
      }
    } catch (storageErr) {
      console.warn("Could not delete file from Supabase storage:", storageErr)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("DELETE member document error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete document" },
      { status: 500 }
    )
  }
}
