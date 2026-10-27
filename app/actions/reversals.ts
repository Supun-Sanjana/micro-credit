"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma, ScheduleStatus } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { checkSuspiciousActivity } from "@/lib/intelligence/anomaly-detector";
import { ensureActiveSubscription } from "@/lib/subscription";

export async function getReversalRequests() {
  const session = await auth();
  const role = session?.user?.role as string;
  if (!session?.user?.id || (role !== "SYSTEM_ADMIN" && role !== "HEAD_OFFICE" && role !== "BRANCH_MANAGER") || !session.user.organizationId) {
    throw new Error("Unauthorized");
  }
  await ensureActiveSubscription(session.user.organizationId as string);

  const requests = await prisma.paymentReversal.findMany({
    where: { organizationId: session.user.organizationId as string },
    include: {
      repayment: {
        include: {
          loan: {
            include: {
              member: true,
            },
          },
        },
      },
      requestedBy: true,
    },
    orderBy: { requestedAt: "desc" },
  });

  return requests;
}

export async function approveReversal(reversalId: string) {
  const session = await auth();
  const role = session?.user?.role as string;
  if (!session?.user?.id || (role !== "SYSTEM_ADMIN" && role !== "HEAD_OFFICE" && role !== "BRANCH_MANAGER") || !session.user.organizationId) {
    return { error: "Unauthorized" };
  }
  await ensureActiveSubscription(session.user.organizationId as string);

  const { organizationId, id: userId } = session.user as { organizationId: string, id: string };
  
  try {
    let loanIdForAlert: string | undefined;

    await prisma.$transaction(async (tx) => {
      // Row lock on PaymentReversal
      await tx.$executeRaw`SELECT id FROM "PaymentReversal" WHERE id = ${reversalId} FOR UPDATE`;

      const reversal = await tx.paymentReversal.findUnique({
        where: { id: reversalId, organizationId },
      });

      if (!reversal) {
        throw new Error("Reversal request not found");
      }

      if (reversal.status !== "REQUESTED") {
        throw new Error("Reversal request is not in REQUESTED status");
      }

      const originalRepayment = await tx.loanRepayment.findUnique({
        where: { id: reversal.repaymentId },
        include: { allocations: true },
      });

      if (!originalRepayment || originalRepayment.organizationId !== organizationId) {
        throw new Error("Original repayment not found");
      }

      if (originalRepayment.transactionType !== "PAYMENT") {
        throw new Error("Cannot reverse a reversal transaction");
      }

      const existingReversal = await tx.loanRepayment.findUnique({
        where: { reversalOfId: originalRepayment.id },
      });
      if (existingReversal) {
        throw new Error("Repayment has already been reversed");
      }
      
      loanIdForAlert = originalRepayment.loanId;

      // Lock loan for update
      await tx.$executeRaw`SELECT id FROM "Loan" WHERE id = ${originalRepayment.loanId} FOR UPDATE`;

      const loan = await tx.loan.findUnique({
        where: { id: originalRepayment.loanId },
      });

      if (!loan) {
        throw new Error("Loan not found");
      }

      // Create counter-balancing LoanRepayment
      const reversalRepaymentAmount = new Prisma.Decimal(originalRepayment.amount).mul(-1);
      
      const newRepayment = await tx.loanRepayment.create({
        data: {
          organizationId: organizationId,
          loanId: originalRepayment.loanId,
          instalmentNumber: originalRepayment.instalmentNumber,
          scheduledDate: originalRepayment.scheduledDate,
          paidDate: new Date(),
          amount: reversalRepaymentAmount,
          method: originalRepayment.method,
          transactionType: "REVERSAL",
          reversalOfId: originalRepayment.id,
          allocationMethod: "REVERSAL",
          allocations: {
            create: originalRepayment.allocations.map((alloc) => ({
              scheduleId: alloc.scheduleId,
              component: alloc.component,
              amount: new Prisma.Decimal(alloc.amount).mul(-1),
            })),
          },
        },
      });

      // Update Loan
      const newTotalPaid = new Prisma.Decimal(loan.totalPaid).sub(originalRepayment.amount);
      const newOutstanding = new Prisma.Decimal(loan.totalReceivable).minus(newTotalPaid);
      let newStatus = loan.status;

      if (loan.status === "SETTLED" && newOutstanding.gt(0)) {
        newStatus = "ACTIVE";
      }

      await tx.loan.update({
        where: { id: loan.id },
        data: {
          outstanding: newOutstanding,
          totalPaid: newTotalPaid,
          status: newStatus,
        },
      });

      // Reverse exact recorded schedule allocations
      const scheduleAllocationsMap = new Map<string, Prisma.Decimal>();
      for (const alloc of originalRepayment.allocations) {
        if (alloc.scheduleId) {
          const cur = scheduleAllocationsMap.get(alloc.scheduleId) ?? new Prisma.Decimal(0);
          scheduleAllocationsMap.set(alloc.scheduleId, cur.add(alloc.amount));
        }
      }

      if (scheduleAllocationsMap.size > 0) {
        for (const [scheduleId, allocatedAmount] of scheduleAllocationsMap.entries()) {
          const schedule = await tx.repaymentSchedule.findUnique({
            where: { id: scheduleId },
          });

          if (!schedule || schedule.loanId !== loan.id) continue;

          const newPaidAmount = Prisma.Decimal.max(0, new Prisma.Decimal(schedule.paidAmount).sub(allocatedAmount));
          let status: ScheduleStatus = "PENDING";
          let isPaid = false;

          if (newPaidAmount.gte(schedule.scheduledAmount)) {
            status = "PAID";
            isPaid = true;
          } else if (newPaidAmount.gt(0)) {
            status = "PARTIALLY_PAID";
            isPaid = false;
          } else {
            status = "PENDING";
            isPaid = false;
          }

          await tx.repaymentSchedule.update({
            where: { id: schedule.id },
            data: {
              paidAmount: newPaidAmount,
              status,
              isPaid,
            },
          });
        }
      } else if (originalRepayment.instalmentNumber !== null) {
        // Legacy fallback for historical payments without scheduleId:
        // Must NEVER touch superseded schedules!
        const schedules = await tx.repaymentSchedule.findMany({
          where: {
            loanId: loan.id,
            instalmentNumber: originalRepayment.instalmentNumber,
            supersededAt: null,
          },
        });

        for (const schedule of schedules) {
          const newPaidAmount = Prisma.Decimal.max(0, new Prisma.Decimal(schedule.paidAmount).sub(originalRepayment.amount));
          let status: ScheduleStatus = "PENDING";
          let isPaid = false;

          if (newPaidAmount.gte(schedule.scheduledAmount)) {
            status = "PAID";
            isPaid = true;
          } else if (newPaidAmount.gt(0)) {
            status = "PARTIALLY_PAID";
            isPaid = false;
          } else {
            status = "PENDING";
            isPaid = false;
          }

          await tx.repaymentSchedule.update({
            where: { id: schedule.id },
            data: {
              paidAmount: newPaidAmount,
              status,
              isPaid,
            },
          });
        }
      }

      // POST REVERSAL JOURNAL ENTRY
      const originalJournal = await tx.journalEntry.findFirst({
        where: {
          organizationId,
          sourceType: "REPAYMENT",
          sourceId: originalRepayment.id
        },
        include: { lines: true }
      });

      if (originalJournal) {
        await tx.journalEntry.create({
          data: {
            organizationId,
            branchId: originalJournal.branchId,
            periodId: originalJournal.periodId,
            entryDate: new Date(),
            reference: `REV-${newRepayment.id.slice(-6)}`,
            description: `Reversal of Repayment ${originalRepayment.id}`,
            sourceType: 'REVERSAL',
            sourceId: newRepayment.id,
            lines: {
              create: originalJournal.lines.map(l => ({
                accountId: l.accountId,
                debit: l.credit,
                credit: l.debit
              }))
            }
          }
        });
      }

      // Update PaymentReversal
      await tx.paymentReversal.update({
        where: { id: reversal.id },
        data: {
          status: "APPROVED",
          approvedById: userId,
          approvedAt: new Date(),
          reversalPaymentId: newRepayment.id,
        },
      });

      await logAudit({
        dal: { prisma: tx, organizationId, userId },
        action: "UPDATE",
        entityType: "PaymentReversal",
        entityId: reversal.id,
        note: `Approved payment reversal for repayment ${originalRepayment.id}`,
      });
    });
    
    if (loanIdForAlert) {
      checkSuspiciousActivity(loanIdForAlert, organizationId);
    }
    
    revalidatePath("/app/loans/reversals");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to approve reversal" };
  }
}

export async function rejectReversal(reversalId: string, note: string) {
  const session = await auth();
  const role = session?.user?.role as string;
  if (!session?.user?.id || (role !== "SYSTEM_ADMIN" && role !== "HEAD_OFFICE" && role !== "BRANCH_MANAGER") || !session.user.organizationId) {
    return { error: "Unauthorized" };
  }
  await ensureActiveSubscription(session.user.organizationId as string);

  const { organizationId, id: userId } = session.user as { organizationId: string, id: string };

  try {
    const reversal = await prisma.paymentReversal.findUnique({
      where: { id: reversalId, organizationId },
    });

    if (!reversal) {
      return { error: "Reversal request not found" };
    }

    if (reversal.status !== "REQUESTED") {
      return { error: "Reversal request is not in REQUESTED status" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.paymentReversal.update({
        where: { id: reversalId },
        data: {
          status: "REJECTED",
          approvedById: userId,
          approvedAt: new Date(),
          reason: `${reversal.reason} | Rejected Note: ${note}`
        },
      });

      await logAudit({
        dal: { prisma: tx, organizationId, userId },
        action: "UPDATE",
        entityType: "PaymentReversal",
        entityId: reversal.id,
        note: `Rejected payment reversal for repayment ${reversal.repaymentId}`,
      });
    });

    revalidatePath("/app/loans/reversals");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to reject reversal" };
  }
}
