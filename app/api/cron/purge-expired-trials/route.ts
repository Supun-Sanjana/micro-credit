import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { TRIAL_PURGE_GRACE_DAYS, purgeOrganization } from "@/lib/org-purge"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  // Enforce Authorization: Bearer <CRON_SECRET>
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const live = process.env.ENABLE_TRIAL_PURGE === "true"
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - TRIAL_PURGE_GRACE_DAYS * 24 * 60 * 60 * 1000)

    const candidates = await prisma.subscription.findMany({
      where: {
        status: "SUSPENDED",
        currentPeriodEnd: null,
        trialEndsAt: {
          lt: thirtyDaysAgo,
        },
      },
      take: 5,
      orderBy: { trialEndsAt: "asc" },
      select: { organizationId: true },
    })

    const processed = []

    for (const candidate of candidates) {
      try {
        const result = await purgeOrganization(candidate.organizationId, {
          reason: "TRIAL_EXPIRED_AUTO",
          triggeredBy: "cron",
          dryRun: !live,
        })
        processed.push({
          organizationId: candidate.organizationId,
          ok: true,
          rowCounts: result.rowCounts,
        })
      } catch (error: any) {
        processed.push({
          organizationId: candidate.organizationId,
          ok: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({ live, processed })
  } catch (error: any) {
    console.error("Cron purge failed:", error)
    return NextResponse.json(
      { error: "Failed to process trial expirations", details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  return GET(request)
}
