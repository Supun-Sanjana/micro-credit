import { NextResponse } from "next/server";
import { getScopedDal } from "@/lib/dal";

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal();
    const json = await request.json();
    const { scheduleId, reason, notes, clientTransactionId } = json;

    const result = await dal.prisma.$transaction(async (tx: any) => {
      const schedule = await tx.repaymentSchedule.findUnique({
        where: { id: scheduleId },
        include: { loan: { include: { member: true } } }
      });

      if (!schedule) throw new Error("Schedule not found");

      const assignment = await tx.fieldOfficerAssignment.findFirst({
        where: {
          organizationId: dal.organizationId,
          officerId: dal.userId,
          centreId: schedule.loan.member.centreId,
          isActive: true
        }
      });

      if (!assignment) throw new Error("Not assigned to this centre");

      const attempt = await tx.collectionAttempt.create({
        data: {
          organizationId: dal.organizationId,
          scheduleId,
          officerId: dal.userId,
          outcome: 'MISSED',
          reason,
          notes,
          clientTxId: clientTransactionId
        }
      });

      return attempt;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
