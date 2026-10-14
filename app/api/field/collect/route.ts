import { NextResponse } from "next/server";
import { getScopedDal } from "@/lib/dal";
import { recordPayment } from "@/lib/services/payment-service";
import { assertScheduleOwnership, parseFieldCollectionBody } from "@/lib/field-collection";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal();
    let json: unknown
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = parseFieldCollectionBody(json);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { loanId, scheduleId, amount, method, clientTransactionId, notes } = parsed.value;

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

    let replay = false;
    const result = await dal.prisma.$transaction(async (tx: any) => {
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

      if (scheduleId) {
        const schedule = await tx.repaymentSchedule.findFirst({
          where: { id: scheduleId },
          include: { loan: { include: { member: true } } }
        });
        assertScheduleOwnership(schedule, loan.id, dal.organizationId);
      }

      const decimalAmount = new Prisma.Decimal((amount as any) || 0);
      const repayment = await recordPayment(tx, {
        organizationId: dal.organizationId,
        loanId,
        amount: decimalAmount,
        paidDate: new Date(),
        method: (method as any) || "CASH",
        scheduleId: scheduleId ?? undefined,
        note: notes,
        collectedBy: dal.userId,
        clientTransactionId,
        source: 'FIELD_MOBILE'
      });

      if (scheduleId) {
        await tx.collectionAttempt.create({
          data: {
            organizationId: dal.organizationId,
            scheduleId,
            officerId: dal.userId,
            outcome: 'PAID',
            amountCollected: (amount as any) ?? 0,
            notes,
            clientTxId: clientTransactionId
          }
        });
      }
      return repayment;
    }).catch(async (error: any) => {
      // Unique violation on the repayment or the collection attempt: a concurrent
      // retry already committed. Return that row instead of inserting again.
      if (error.code === "P2002") {
        const existingAgain = await dal.prisma.loanRepayment.findUnique({
          where: {
            organizationId_clientTransactionId: {
              organizationId: dal.organizationId,
              clientTransactionId,
            }
          }
        });
        if (existingAgain) {
          replay = true;
          return existingAgain;
        }
      }
      throw error;
    });

    return NextResponse.json(result, { status: replay ? 200 : 201 });
  } catch (error: any) {
    const message = error?.message || "Collection failed";
    const status = message === "Not assigned to this centre" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
