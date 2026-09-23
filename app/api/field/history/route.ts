import { NextResponse } from "next/server";
import { getScopedDal } from "@/lib/dal";

export async function GET(request: Request) {
  try {
    const dal = await getScopedDal();
    
    const attempts = await dal.prisma.collectionAttempt.findMany({
      where: {
        organizationId: dal.organizationId,
        officerId: dal.userId,
      },
      include: {
        schedule: {
          include: {
            loan: { include: { member: true } }
          }
        }
      },
      orderBy: { attemptedAt: 'desc' },
      take: 50
    });

    return NextResponse.json(attempts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
