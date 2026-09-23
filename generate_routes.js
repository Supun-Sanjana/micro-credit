const fs = require('fs');
const path = require('path');

const writeRoute = (p, content) => {
  const fullPath = path.join('f:/Personal/micro-credit', p);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
};

writeRoute('app/api/field/dashboard/route.ts', `import { NextResponse } from "next/server";
import { getScopedDal } from "@/lib/dal";
import { startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export async function GET(request: Request) {
  try {
    const dal = await getScopedDal();
    const today = new Date();
    // Simplified timezone handling for now, using UTC start/end of day
    const start = startOfDay(today);
    const end = endOfDay(today);

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
`);

writeRoute('app/api/field/centres/route.ts', `import { NextResponse } from "next/server";
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
`);

writeRoute('app/api/field/centres/[id]/collection-sheet/route.ts', `import { NextResponse } from "next/server";
import { getScopedDal } from "@/lib/dal";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const dal = await getScopedDal();
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

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
`);

writeRoute('app/api/field/collect/route.ts', `import { NextResponse } from "next/server";
import { getScopedDal } from "@/lib/dal";

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

      const repayment = await tx.loanRepayment.create({
        data: {
          organizationId: dal.organizationId,
          loanId,
          amount,
          method,
          note: notes,
          collectedBy: dal.userId,
          clientTransactionId,
          paidDate: new Date(),
        }
      });

      // Update schedule
      if (scheduleId) {
        await tx.repaymentSchedule.update({
          where: { id: scheduleId },
          data: {
            isPaid: true,
            status: 'PAID',
            paidAmount: amount,
          }
        });
        
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
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Not assigned to this centre" ? 403 : 400 });
  }
}
`);

writeRoute('app/api/field/missed/route.ts', `import { NextResponse } from "next/server";
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
`);

writeRoute('app/api/field/reconcile/route.ts', `import { NextResponse } from "next/server";
import { getScopedDal } from "@/lib/dal";
import { startOfDay, endOfDay } from "date-fns";

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal();
    const json = await request.json();
    const { declaredCash, declaredBank, date } = json;
    
    const targetDate = new Date(date);
    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);

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
`);

writeRoute('app/api/field/history/route.ts', `import { NextResponse } from "next/server";
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
`);

// UI ROUTES
writeRoute('app/app/field/layout.tsx', `import { ReactNode } from "react";
import { Home, MapPin, History, FileText } from "lucide-react";
import Link from "next/link";
import { OfflineIndicator } from "./OfflineIndicator";

export default function FieldLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex flex-col relative pb-16">
      <OfflineIndicator />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 flex justify-around p-3 text-gray-500">
        <Link href="/app/field" className="flex flex-col items-center">
          <Home className="w-6 h-6" />
          <span className="text-xs">Home</span>
        </Link>
        <Link href="/app/field/centres" className="flex flex-col items-center">
          <MapPin className="w-6 h-6" />
          <span className="text-xs">Centres</span>
        </Link>
        <Link href="/app/field/history" className="flex flex-col items-center">
          <History className="w-6 h-6" />
          <span className="text-xs">History</span>
        </Link>
      </nav>
    </div>
  );
}
`);

writeRoute('app/app/field/OfflineIndicator.tsx', `"use client";
import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    setIsOffline(!navigator.onLine);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-red-500 text-white text-xs text-center p-1 w-full z-50">
      🔴 Offline - Payments will be available when connection returns
    </div>
  );
}
`);

writeRoute('app/app/field/page.tsx', `export default function Dashboard() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold">Today's Progress</h2>
        <p className="text-sm text-gray-500">Collected vs Expected</p>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
`);

writeRoute('app/app/field/centres/page.tsx', `export default function CentresList() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Centres</h1>
      <div className="bg-white p-4 rounded shadow mb-2 cursor-pointer">
        Centre A
      </div>
      <div className="bg-white p-4 rounded shadow mb-2 cursor-pointer">
        Centre B
      </div>
    </div>
  );
}
`);

writeRoute('app/app/field/centres/[id]/page.tsx', `export default function CollectionSheet({ params }: { params: { id: string } }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Collection Sheet {params.id}</h1>
      <p className="text-gray-500 text-sm">Members due today...</p>
    </div>
  );
}
`);

writeRoute('app/app/field/history/page.tsx', `export default function History() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">History</h1>
      <div className="bg-white p-4 rounded shadow mb-2">
        Collection Attempt 1
      </div>
    </div>
  );
}
`);

writeRoute('app/app/field/receipt/[repaymentId]/page.tsx', `export default function Receipt({ params }: { params: { repaymentId: string } }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Receipt</h1>
      <div className="bg-white p-4 rounded shadow">
        Receipt ID: {params.repaymentId}
      </div>
    </div>
  );
}
`);

writeRoute('app/app/field/reconcile/page.tsx', `export default function Reconcile() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Reconcile</h1>
      <div className="bg-white p-4 rounded shadow">
        Submit EOD reconciliation
      </div>
    </div>
  );
}
`);
