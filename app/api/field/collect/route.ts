import { NextResponse } from "next/server";
import { getScopedDal } from "@/lib/dal";
import { recordPayment } from "@/lib/services/payment-service";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal();
    const json = await request.json();
    const { loanId, scheduleId, amount, method, clientTransactionId, notes } = json;

    if (!clientTransactionId || typeof clientTransactionId !== "string" || !clientTransactionId.trim()) {
      return NextResponse.json({ error: "clientTransactionId required" }, { status: 400 });
    }

    if (!loanId || typeof loanId !== "string" || !loanId.trim()) {
      return NextResponse.json({ error: "loanId required" }, { status: 400 });
    }

    if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "Valid positive amount required" }, { status: 400 });
    }

    const cleanClientTxId = clientTransactionId.trim();
    const cleanLoanId = loanId.trim();
    const cleanScheduleId = typeof scheduleId === "string" && scheduleId.trim() ? scheduleId.trim() : null;

    // Idempotency check
    const existing = await dal.prisma.loanRepayment.findUnique({
      where: {
        organizationId_clientTransactionId: {
          organizationId: dal.organizationId,
          clientTransactionId: cleanClientTxId,
        }
      }
    });

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const result = await dal.prisma.$transaction(async (tx: any) => {
      // Validate Assignment
      const loan = await tx.loan.findFirst({
        where: { id: cleanLoanId, member: { organizationId: dal.organizationId } },
        include: { member: true }
      });

      if (!loan) throw new Error("Loan not found");

      const assignment = await tx.fieldOfficerAssignment.findFirst({
        where: {
          organizationId: dal.organizationId,
          officerId: dal.userId,
          centreId: loan.member.centreId,
          isActive: true
        }
      });

      if (!assignment) throw new Error("Not assigned to this centre");

      // Validate that scheduleId (when supplied) belongs to this specific loan,
      // preventing cross-loan injection from the field app.
      if (cleanScheduleId) {
        const schedule = await tx.repaymentSchedule.findFirst({
          where: { id: cleanScheduleId, loanId: cleanLoanId }
        });
        if (!schedule) throw new Error("Schedule does not belong to this loan");
      }

      const decimalAmount = new Prisma.Decimal(amount);
      const repayment = await recordPayment(tx, {
        organizationId: dal.organizationId,
        loanId: cleanLoanId,
        amount: decimalAmount,
        paidDate: new Date(),
        method: method || "CASH",
        scheduleId: cleanScheduleId ?? undefined,
        note: notes,
        collectedBy: dal.userId,
        clientTransactionId: cleanClientTxId,
        source: 'FIELD_MOBILE'
      });

      // Update schedule attempt history idempotently
      if (cleanScheduleId) {
        const existingAttempt = await tx.collectionAttempt.findFirst({
          where: {
            organizationId: dal.organizationId,
            clientTxId: cleanClientTxId
          }
        });

        if (!existingAttempt) {
          await tx.collectionAttempt.create({
            data: {
              organizationId: dal.organizationId,
              scheduleId: cleanScheduleId,
              officerId: dal.userId,
              outcome: 'PAID',
              amountCollected: amount,
              notes,
              clientTxId: cleanClientTxId
            }
          });
        }
      }
      return { repayment, isNew: true };
    }).catch(async (error: any) => {
      if (error.code === 'P2002') {
        const existingAgain = await dal.prisma.loanRepayment.findUnique({
          where: {
            organizationId_clientTransactionId: {
              organizationId: dal.organizationId,
              clientTransactionId: cleanClientTxId,
            }
          }
        });
        if (existingAgain) return { repayment: existingAgain, isNew: false };
      }
      throw error;
    });

    return NextResponse.json(result.repayment, { status: result.isNew ? 201 : 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Not assigned to this centre" ? 403 : 400 });
  }
}
