import { NextResponse } from "next/server";
import { getScopedDal } from "@/lib/dal";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const dal = await getScopedDal();
    const today = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" });
    const parts = formatter.formatToParts(today);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    const start = new Date(`${y}-${m}-${d}T00:00:00+05:30`);
    const end = new Date(`${y}-${m}-${d}T23:59:59.999+05:30`);

    // Verify assignment
    const assignment = await dal.prisma.fieldOfficerAssignment.findFirst({
      where: {
        organizationId: dal.organizationId,
        officerId: dal.userId,
        centreId: params.id,
        isActive: true,
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: "Not assigned to this centre" }, { status: 403 });
    }

    const members = await dal.prisma.member.findMany({
      where: {
        centreId: params.id,
        organizationId: dal.organizationId,
        loans: {
          some: {
            repaymentSchedule: {
              some: {
                scheduledDate: { gte: start, lte: end }
              }
            }
          }
        }
      },
      include: {
        loans: {
          where: {
            repaymentSchedule: {
              some: {
                scheduledDate: { gte: start, lte: end }
              }
            }
          },
          include: {
            repaymentSchedule: {
              where: {
                scheduledDate: { gte: start, lte: end }
              }
            }
          }
        }
      }
    });

    return NextResponse.json(members);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
