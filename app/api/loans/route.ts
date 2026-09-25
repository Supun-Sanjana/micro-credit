import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { getScopedDal } from "@/lib/dal"
import { calculateLoanTerms } from "@/lib/calc-engine"
import { logAudit } from "@/lib/audit"
import { runCreditAssessment } from "@/lib/intelligence/credit-assessment-service"

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export async function GET(request: Request) {
  try {
    const dal = await getScopedDal()
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")
    const status = searchParams.get("status")

    const where: any = {}
    if (memberId) where.memberId = memberId
    if (status) where.status = status

    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const [loans, total] = await Promise.all([
      dal.prisma.loan.findMany({
        where,
        include: { member: true, loanProduct: true, guarantors: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      dal.prisma.loan.count({ where })
    ])
    
    return NextResponse.json({
      data: loans,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    })
    
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal()
    const json = await request.json()
    
    // Validate member
    const member = await dal.prisma.member.findUnique({
      where: { id: json.memberId }
    })
    if (!member) return NextResponse.json({ error: "Invalid member" }, { status: 400 })

    // Validate product
    const product = await dal.prisma.loanProduct.findUnique({
      where: { id: json.loanProductId }
    })
    if (!product) return NextResponse.json({ error: "Invalid product" }, { status: 400 })

    // Validate boundaries
    const amt = new Prisma.Decimal(json.loanAmount)
    if (product.minimumAmount && amt.lt(product.minimumAmount)) {
      return NextResponse.json({ error: `Amount cannot be less than ${product.minimumAmount}` }, { status: 400 })
    }
    if (product.maximumAmount && amt.gt(product.maximumAmount)) {
      return NextResponse.json({ error: `Amount cannot be greater than ${product.maximumAmount}` }, { status: 400 })
    }

    // Calculate loan terms
    const terms = calculateLoanTerms(json.loanAmount, product)

    // Determine loanNumber (1ST, 2ND, etc.)
    const existingLoansCount = await dal.prisma.loan.count({
      where: { memberId: member.id }
    })
    const loanNumber = getOrdinal(existingLoansCount + 1).toUpperCase()

    // Handle guarantors payload
    const guarantorsData = (json.guarantors || []).map((g: any) => ({
      memberId: g.memberId || null,
      name: g.name,
      nic: g.nic,
      contact: g.contact,
      relationship: g.relationship
    }))

    const loan = await dal.prisma.loan.create({
      data: {
        memberId: member.id,
        loanProductId: product.id,
        loanType: product.loanType,
        loanNumber,
        loanAmount: terms.loanAmount,
        weeklyRental: terms.weeklyRental,
        numberOfWeeks: terms.numberOfWeeks,
        totalReceivable: terms.totalReceivable,
        status: "PENDING", // PENDING -> ACTIVE -> CLOSED
        verificationStatus: "PENDING",
        totalPaid: 0,
        outstanding: terms.totalReceivable,
        guarantors: {
          create: guarantorsData
        }
      },
      include: { guarantors: true }
    })
    
    await logAudit({
      dal,
      action: "CREATE",
      entityType: "Loan",
      entityId: loan.id,
      after: loan
    })

    // Trigger credit assessment (void)
    void runCreditAssessment(member.id, dal.organizationId, loan.id, dal.userId).catch((e) => {
      console.error("[Loans] Failed to trigger credit assessment:", e)
    })

    return NextResponse.json(loan, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
