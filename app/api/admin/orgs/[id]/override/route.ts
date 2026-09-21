import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyAdminSession } from "@/lib/admin-session"
import { logAdminAction } from "@/lib/admin-audit"
import { SubscriptionStatus } from "@prisma/client"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await verifyAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = params

  let status: unknown
  let note: string | undefined

  try {
    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const body = await request.json()
      status = body?.status
      note = body?.note
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData()
      status = formData.get("status")
      const formNote = formData.get("note")
      note = formNote ? String(formNote) : undefined
    } else {
      const body = await request.json().catch(() => null)
      if (body) {
        status = body.status
        note = body.note
      }
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Malformed request payload" }, { status: 400 })
  }

  const validStatuses = Object.values(SubscriptionStatus)
  if (!status || !validStatuses.includes(status as SubscriptionStatus)) {
    return NextResponse.json(
      {
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      },
      { status: 400 }
    )
  }

  const organization = await prisma.organization.findUnique({
    where: { id },
  })

  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 })
  }

  const existingSub = await prisma.subscription.findUnique({
    where: { organizationId: id },
  })

  if (existingSub) {
    await prisma.subscription.update({
      where: { organizationId: id },
      data: { status: status as SubscriptionStatus },
    })
  } else {
    const defaultPlan = await prisma.subscriptionPlan.findFirst({
      where: { isActive: true },
    })
    if (!defaultPlan) {
      return NextResponse.json(
        { error: "No active subscription plan found to create subscription" },
        { status: 400 }
      )
    }
    await prisma.subscription.create({
      data: {
        organizationId: id,
        planId: defaultPlan.id,
        status: status as SubscriptionStatus,
      },
    })
  }

  await logAdminAction({
    platformAdminId: session.adminId,
    action: "OVERRIDE_SUBSCRIPTION",
    targetType: "Organization",
    targetId: id,
    note: typeof note === "string" && note.trim() ? note.trim() : undefined,
  })

  // If this was a standard browser form submission, redirect back to the org page
  const accept = request.headers.get("accept") || ""
  const contentType = request.headers.get("content-type") || ""
  if (
    accept.includes("text/html") ||
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    return NextResponse.redirect(new URL(`/app/admin/orgs/${id}`, request.url), { status: 303 })
  }

  return NextResponse.json({ success: true })
}
