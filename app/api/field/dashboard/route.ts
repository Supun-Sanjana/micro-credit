import { NextResponse } from "next/server";
import { getScopedDal } from "@/lib/dal";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
  try {
    const dal = await getScopedDal();
    const today = new Date();
    // Simplified timezone handling for now, using UTC start/end of day
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" });
    const parts = formatter.formatToParts(today);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    const start = new Date(`${y}-${m}-${d}T00:00:00+05:30`);
    const end = new Date(`${y}-${m}-${d}T23:59:59.999+05:30`);

    // Get assigned centres
    const assignments = await dal.prisma.fieldOfficerAssignment.findMany({
      where: {
        organizationId: dal.organizationId,
        officerId: dal.userId,
        isActive: true,
      }
    });

    const centreIds = assignments.map(a => a.centreId);

    // Find schedules due today in these centres
    const schedules = await dal.prisma.repaymentSchedule.findMany({
      where: {
        loan: {
          member: {
            centreId: { in: centreIds }
          }
        },
        scheduledDate: {
          gte: start,
          lte: end
        }
      },
      include: {
        loan: {
          include: {
            member: true
          }
        }
      }
    });

    const expectedAmount = schedules.reduce((acc, s) => acc + Number(s.scheduledAmount), 0);
    
    // Find collections today
    const collections = await dal.prisma.loanRepayment.findMany({
      where: {
        organizationId: dal.organizationId,
        collectedBy: dal.userId,
        paidDate: {
          gte: start,
          lte: end
        }
      }
    });

    const collectedAmount = collections.reduce((acc, c) => acc + Number(c.amount), 0);

    return NextResponse.json({
      expectedAmount,
      collectedAmount,
      progress: expectedAmount ? (collectedAmount / expectedAmount) * 100 : 0
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
