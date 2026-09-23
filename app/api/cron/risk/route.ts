import { NextResponse } from "next/server"
import { runRiskBatch } from "@/lib/intelligence/risk-batch-service"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizations = await prisma.organization.findMany({ select: { id: true } })
    const results = []

    for (const org of organizations) {
      const result = await runRiskBatch(org.id)
      results.push({ organizationId: org.id, result })
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
