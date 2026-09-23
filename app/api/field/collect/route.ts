import { NextResponse } from "next/server";
import { getScopedDal } from "@/lib/dal";
import { recordPayment } from "@/lib/services/payment-service";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal();
    const json = await request.json();
    const { loanId, scheduleId, amount, method, clientTransactionId, notes } = json;

    if (!clientTransactionId) {
      return NextResponse.json({ error: "clientTransactionId required" }, { status: 400 });
    }

    // Idempotency check
    const existing = await dal.prisma.loanRepayment.findUnique({
      where: {
        organizationId_clientTransactionId: {
          organizationId: dal.organizationId,
          clientTransactionId,
        }
      }
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const result = await dal.prisma.$transaction(async (tx: any) => {
      // Validate Assignment
      const loan = await tx.loan.findFirst({
        where: { id: loanId, member: { organizationId: dal.organizationId } },
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

      const decimalAmount = new Prisma.Decimal(amount || 0);
      const repayment = await recordPayment(tx, {
        organizationId: dal.organizationId,
        loanId,
        amount: decimalAmount,
        paidDate: new Date(),
        method,
        scheduleId,
        note: notes,
        collectedBy: dal.userId,
        clientTransactionId,
        source: 'FIELD_MOBILE'
      });

      // Update schedule attempt history
      if (scheduleId) {
        await tx.collectionAttempt.create({
          data: {
            organizationId: dal.organizationId,
            scheduleId,
            officerId: dal.userId,
            outcome: 'PAID',
            amountCollected: amount,
            notes,
            clientTxId: clientTransactionId
          }
        });
      }
      return repayment;
    }).catch(async (error: any) => {
      if (error.code === 'P2002') {
        const existingAgain = await dal.prisma.loanRepayment.findUnique({
          where: {
            organizationId_clientTransactionId: {
              organizationId: dal.organizationId,
              clientTransactionId,
            }
          }
        });
        if (existingAgain) return existingAgain;
      }
      throw error;
    });

    // If it's an existing record from the catch block, return 200 instead of 201
    // We can just return 201 for both or 200 for existing, but 201 is fine, wait, idempotency expects same result
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Not assigned to this centre" ? 403 : 400 });
  }
}
