import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  // Enforce Authorization: Bearer <CRON_SECRET>
  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } else {
    // If CRON_SECRET is not set in environment, still require Bearer header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const now = new Date()

    // 1. Subscriptions where status = "TRIAL" and trialEndsAt < now()
    // 2. Subscriptions where status = "ACTIVE" and currentPeriodEnd < now()
    // 3. Update all of them to status = "SUSPENDED"
    const result = await prisma.subscription.updateMany({
      where: {
        OR: [
          {
            status: "TRIAL",
            trialEndsAt: {
              lt: now,
            },
          },
          {
            status: "ACTIVE",
            currentPeriodEnd: {
              lt: now,
            },
          },
        ],
      },
      data: {
        status: "SUSPENDED",
      },
    })

    return NextResponse.json({ suspendedCount: result.count })
  } catch (error: any) {
    console.error("Cron subscription enforcement failed:", error)
    return NextResponse.json(
      { error: "Failed to enforce subscription expirations", details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  return GET(request)
}
