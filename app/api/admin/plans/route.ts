import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyAdminSession } from "@/lib/admin-session"
import { logAdminAction } from "@/lib/admin-audit"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await verifyAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
      orderBy: {
        monthlyPrice: "asc",
      },
    })

    return NextResponse.json({ success: true, plans })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch plans", details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await verifyAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: any = {}

  try {
    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      body = await request.json()
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData()
      body = {
        name: formData.get("name"),
        maxOfficerSeats: formData.get("maxOfficerSeats"),
        maxBranches: formData.get("maxBranches"),
        storageQuotaMb: formData.get("storageQuotaMb"),
        monthlyPrice: formData.get("monthlyPrice"),
        isActive: formData.get("isActive"),
      }
    } else {
      body = await request.json().catch(() => ({}))
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Malformed request payload" }, { status: 400 })
  }

  const { name, maxOfficerSeats, maxBranches, storageQuotaMb, monthlyPrice } = body

  // Validations
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Plan name is required" }, { status: 400 })
  }

  const seats = Number(maxOfficerSeats)
  if (isNaN(seats) || seats < 1) {
    return NextResponse.json(
      { error: "Max officer seats must be a positive integer" },
      { status: 400 }
    )
  }

  const branches = Number(maxBranches)
  if (isNaN(branches) || branches < 1) {
    return NextResponse.json(
      { error: "Max branches must be a positive integer" },
      { status: 400 }
    )
  }

  const storage = Number(storageQuotaMb)
  if (isNaN(storage) || storage < 1) {
    return NextResponse.json(
      { error: "Storage quota must be a positive number (in MB)" },
      { status: 400 }
    )
  }

  const price = Number(monthlyPrice)
  if (isNaN(price) || price < 0) {
    return NextResponse.json(
      { error: "Monthly price must be a non-negative number" },
      { status: 400 }
    )
  }

  let isActive = true
  if (body.isActive !== undefined && body.isActive !== null) {
    if (typeof body.isActive === "boolean") {
      isActive = body.isActive
    } else if (typeof body.isActive === "string") {
      isActive = body.isActive === "true" || body.isActive === "on" || body.isActive === "1"
    }
  }

  try {
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: name.trim(),
        maxOfficerSeats: Math.floor(seats),
        maxBranches: Math.floor(branches),
        storageQuotaMb: Math.floor(storage),
        monthlyPrice: price,
        isActive,
      },
    })

    await logAdminAction({
      platformAdminId: session.adminId,
      action: "CREATE_PLAN",
      targetType: "SubscriptionPlan",
      targetId: plan.id,
      note: `Created plan "${plan.name}" (Seats: ${plan.maxOfficerSeats}, Branches: ${plan.maxBranches}, Storage: ${plan.storageQuotaMb}MB, Price: LKR ${plan.monthlyPrice.toString()})`,
    })

    const contentType = request.headers.get("content-type") || ""
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      return NextResponse.redirect(new URL("/admin/plans", request.url), { status: 303 })
    }

    return NextResponse.json({ success: true, plan }, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create subscription plan:", error)
    return NextResponse.json(
      { error: "Failed to create subscription plan", details: error?.message },
      { status: 500 }
    )
  }
}
