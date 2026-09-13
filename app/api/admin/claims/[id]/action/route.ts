import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyAdminSession } from "@/lib/admin-session"
import { logAdminAction } from "@/lib/admin-audit"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // verifyAdminSession() must be the very first thing called
  const session = await verifyAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = params

  let action: unknown
  let note: string | undefined

  try {
    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const body = await request.json()
      action = body?.action
      note = body?.note
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData()
      action = formData.get("action")
      const formNote = formData.get("note")
      note = formNote ? String(formNote) : undefined
    } else {
      const body = await request.json().catch(() => null)
      if (body) {
        action = body.action
        note = body.note
      }
    }
  } catch {
    return NextResponse.json(
      { error: "Malformed request payload" },
      { status: 400 }
    )
  }

  // Validate action
  if (action !== "APPROVE" && action !== "REJECT") {
    return NextResponse.json(
      { error: "Invalid action. Must be 'APPROVE' or 'REJECT'." },
      { status: 400 }
    )
  }

  const trimmedNote = typeof note === "string" ? note.trim() : ""

  // Note is required on REJECT
  if (action === "REJECT" && !trimmedNote) {
    const contentType = request.headers.get("content-type") || ""
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      return NextResponse.redirect(new URL(`/admin/claims/${id}?error=note_required`, request.url), { status: 303 })
    }
    return NextResponse.json(
      { error: "Verification note is required when rejecting a claim." },
      { status: 400 }
    )
  }

  // Fetch target claim
  const claim = await prisma.paymentClaim.findUnique({
    where: { id },
    include: { subscription: true },
  })

  if (!claim) {
    return NextResponse.json(
      { error: "Payment claim not found" },
      { status: 404 }
    )
  }

  // Critical 409 double-processing guard
  if (claim.status !== "PENDING") {
    const contentType = request.headers.get("content-type") || ""
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      return NextResponse.redirect(new URL(/app/admin/claims", request.url), { status: 303 })
    }
    return NextResponse.json(
      { error: "Claim already processed" },
      { status: 409 }
    )
  }

  const now = new Date()

  if (action === "APPROVE") {
    const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Execute claim update, subscription update, and audit log in a single transaction
    await prisma.$transaction([
      prisma.paymentClaim.update({
        where: { id },
        data: {
          status: "VERIFIED",
          verifiedAt: now,
          verifiedByPlatformAdminId: session.adminId,
          ...(trimmedNote ? { reviewNote: trimmedNote } : {}),
        },
      }),
      prisma.subscription.update({
        where: { id: claim.subscriptionId },
        data: {
          status: "ACTIVE",
          currentPeriodEnd,
        },
      }),
      prisma.platformAdminAuditLog.create({
        data: {
          platformAdminId: session.adminId,
          action: "APPROVE_CLAIM",
          targetType: "PaymentClaim",
          targetId: id,
          note: trimmedNote || undefined,
        }
      })
    ])

    const contentType = request.headers.get("content-type") || ""
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      return NextResponse.redirect(new URL(/app/admin/claims", request.url), { status: 303 })
    }

    return NextResponse.json({ success: true })
  }

  if (action === "REJECT") {
    // Execute claim update and audit log in a single transaction
    await prisma.$transaction([
      prisma.paymentClaim.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewNote: trimmedNote,
          verifiedAt: now,
          verifiedByPlatformAdminId: session.adminId,
        },
      }),
      prisma.platformAdminAuditLog.create({
        data: {
          platformAdminId: session.adminId,
          action: "REJECT_CLAIM",
          targetType: "PaymentClaim",
          targetId: id,
          note: trimmedNote,
        }
      })
    ])

    const contentType = request.headers.get("content-type") || ""
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      return NextResponse.redirect(new URL(/app/admin/claims", request.url), { status: 303 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Unhandled action" }, { status: 400 })
}
