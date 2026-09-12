import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { calculateLoanTerms } from "@/lib/calc-engine"

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

    const loans = await dal.prisma.loan.findMany({
      where,
      include: { member: true, loanProduct: true, guarantors: true },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(loans)
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
    
    return NextResponse.json(loan, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
