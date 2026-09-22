import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { logAudit } from "@/lib/audit"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const dal = await getScopedDal(); const { id } = await params; const { reason } = await request.json()
    if (!reason?.trim()) return NextResponse.json({ error: "A reversal reason is required" }, { status: 400 })
    const payment = await dal.prisma.loanRepayment.findUnique({ where: { id } })
    if (!payment || payment.transactionType !== "PAYMENT") return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    const reversal = await dal.prisma.paymentReversal.create({ data: { organizationId: dal.organizationId, repaymentId: id, reason: reason.trim(), requestedById: dal.userId! } })
    await logAudit({ dal, action: "CREATE", entityType: "PaymentReversal", entityId: reversal.id, after: reversal, note: reason.trim() })
    return NextResponse.json(reversal, { status: 201 })
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}
