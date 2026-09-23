import { NextResponse } from "next/server";
import { getScopedDal } from "@/lib/dal";

export async function GET(request: Request) {
  try {
    const dal = await getScopedDal();

    const assignments = await dal.prisma.fieldOfficerAssignment.findMany({
      where: {
        organizationId: dal.organizationId,
        officerId: dal.userId,
        isActive: true,
      },
      include: {
        centre: true
      }
    });

    return NextResponse.json(assignments.map(a => a.centre));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
