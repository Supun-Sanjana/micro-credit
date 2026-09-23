import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal()
    const json = await request.json()
    const { memberId, monthlyIncome, householdIncome, existingObligations, incomeSource, notes } = json

    if (!memberId || monthlyIncome === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const profile = await dal.prisma.financialProfile.create({
      data: {
        organizationId: dal.organizationId,
        memberId,
        assessmentDate: new Date(),
        monthlyIncome,
        householdIncome,
        existingObligations: existingObligations || 0,
        incomeSource: incomeSource || 'EMPLOYMENT',
        notes,
        createdById: dal.userId || 'system'
      }
    })

    return NextResponse.json(profile, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
