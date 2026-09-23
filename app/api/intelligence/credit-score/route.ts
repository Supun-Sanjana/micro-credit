import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { runCreditAssessment } from "@/lib/intelligence/credit-assessment-service"

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal()
    const json = await request.json()
    const { memberId, loanId } = json

    if (!memberId) return NextResponse.json({ error: "memberId is required" }, { status: 400 })

    const assessment = await runCreditAssessment(memberId, dal.organizationId, loanId, dal.userId)

    return NextResponse.json(assessment)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
