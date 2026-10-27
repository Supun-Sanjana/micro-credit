import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { logAudit } from "@/lib/audit"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const dal = await getScopedDal()
    const { id } = await params
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const reason = body?.reason
    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json({ error: "A reversal reason is required" }, { status: 400 })
    }

    const payment = await dal.prisma.loanRepayment.findUnique({ where: { id } })
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }
    if (payment.transactionType !== "PAYMENT" || payment.reversalOfId) {
      return NextResponse.json({ error: "Cannot reverse a reversal transaction" }, { status: 400 })
    }

    const existingReversal = await dal.prisma.paymentReversal.findUnique({
      where: { repaymentId: id }
    })
    if (existingReversal) {
      return NextResponse.json({ error: "A reversal request already exists for this repayment" }, { status: 409 })
    }

    const reversal = await dal.prisma.paymentReversal.create({
      data: {
        organizationId: dal.organizationId,
        repaymentId: id,
        reason: reason.trim(),
        requestedById: dal.userId!
      }
    })

    await logAudit({
      dal,
      action: "CREATE",
      entityType: "PaymentReversal",
      entityId: reversal.id,
      after: reversal,
      note: reason.trim()
    })

    return NextResponse.json(reversal, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A reversal request already exists for this repayment" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
