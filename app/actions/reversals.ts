"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { checkSuspiciousActivity } from "@/lib/intelligence/anomaly-detector";

export async function getReversalRequests() {
  const session = await auth();
  const role = session?.user?.role as string;
  if (!session?.user?.id || (role !== "SYSTEM_ADMIN" && role !== "HEAD_OFFICE" && role !== "BRANCH_MANAGER") || !session.user.organizationId) {
    throw new Error("Unauthorized");
  }

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

  const { organizationId, id: userId } = session.user as { organizationId: string, id: string };
  
  try {
    let loanIdForAlert: string | undefined;

    await prisma.$transaction(async (tx) => {
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

      if (!originalRepayment) {
        throw new Error("Original repayment not found");
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
              component: alloc.component,
              amount: new Prisma.Decimal(alloc.amount).mul(-1),
            })),
          },
        },
      });

      // Update Loan
      const newOutstanding = new Prisma.Decimal(loan.outstanding).add(originalRepayment.amount);
      const newTotalPaid = new Prisma.Decimal(loan.totalPaid).sub(originalRepayment.amount);
      let newStatus = loan.status;

      if (loan.status === "SETTLED") {
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

      // Re-open affected RepaymentSchedule entries
      if (originalRepayment.instalmentNumber !== null) {
        const schedules = await tx.repaymentSchedule.findMany({
          where: {
            loanId: loan.id,
            instalmentNumber: originalRepayment.instalmentNumber,
          },
        });

        for (const schedule of schedules) {
          const newPaidAmount = new Prisma.Decimal(schedule.paidAmount).sub(originalRepayment.amount);
          
          await tx.repaymentSchedule.update({
            where: { id: schedule.id },
            data: {
              paidAmount: newPaidAmount.isNegative() ? new Prisma.Decimal(0) : newPaidAmount,
              status: "PENDING", // Simplistic fallback
              isPaid: false,
            },
          });
        }
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
