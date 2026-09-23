import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { runRiskBatch } from "@/lib/intelligence/risk-batch-service"

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal()
    if (dal.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const result = await runRiskBatch(dal.organizationId)
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
