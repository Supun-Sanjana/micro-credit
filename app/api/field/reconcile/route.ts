import { NextResponse } from "next/server";
import { getScopedDal } from "@/lib/dal";
import { startOfDay, endOfDay } from "date-fns";

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal();
    const json = await request.json();
    const { declaredCash, declaredBank, date } = json;
    
    const targetDate = new Date(date);
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    // Adjusted for Asia/Colombo statically if needed
    start.setUTCHours(start.getUTCHours() - 5, start.getUTCMinutes() - 30);
    end.setUTCHours(end.getUTCHours() - 5, end.getUTCMinutes() - 30);

    // Calculate actual from DB
    const repayments = await dal.prisma.loanRepayment.findMany({
      where: {
        organizationId: dal.organizationId,
        collectedBy: dal.userId,
        paidDate: {
          gte: start,
          lte: end
        }
      }
    });

    const expectedCash = repayments
      .filter(r => r.method === 'CASH')
      .reduce((sum, r) => sum + Number(r.amount), 0);
      
    const expectedBank = repayments
      .filter(r => r.method !== 'CASH')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const user = await dal.prisma.user.findUnique({ where: { id: dal.userId } });

    const diff = (Number(declaredCash) - expectedCash) + (Number(declaredBank) - expectedBank);

    const reconciliation = await dal.prisma.fieldOfficerReconciliation.create({
      data: {
        organizationId: dal.organizationId,
        branchId: user?.branchId || "",
        officerId: dal.userId,
        date: targetDate,
        expectedCash,
        declaredCash,
        expectedBank,
        declaredBank,
        difference: diff,
        status: 'SUBMITTED'
      }
    });

    return NextResponse.json(reconciliation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
