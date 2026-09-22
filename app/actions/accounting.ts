"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { getScopedDal } from "@/lib/dal";

export async function getChartOfAccounts() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const accounts = await prisma.chartOfAccount.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: [{ type: "asc" }, { code: "asc" }],
  });

  // Group by type
  const grouped = accounts.reduce((acc, account) => {
    const type = account.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(account);
    return acc;
  }, {} as Record<string, typeof accounts>);

  return grouped;
}

import { requireRole } from "@/lib/auth-utils";

export async function createAccount(data: {
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
}) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }
  
  await requireRole(["SYSTEM_ADMIN", "HEAD_OFFICE", "ACCOUNTANT"]);

  const account = await prisma.chartOfAccount.create({
    data: {
      ...data,
      organizationId: session.user.organizationId,
    },
  });

  const dal = await getScopedDal();

  await logAudit({
    dal,
    action: "CREATE",
    entityType: "ChartOfAccount",
    entityId: account.id,
    after: account,
  });

  revalidatePath("/app/accounting");
  return account;
}

export async function getJournalEntries(startDate: Date, endDate: Date) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const entries = await prisma.journalEntry.findMany({
    where: {
      organizationId: session.user.organizationId,
      entryDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      lines: {
        include: {
          account: true,
        },
      },
    },
    orderBy: { entryDate: "desc" },
  });

  return entries.map((entry) => ({
    ...entry,
    lines: entry.lines.map((line) => ({
      ...line,
      debit: line.debit.toString(),
      credit: line.credit.toString(),
    })),
  }));
}

export async function getTrialBalance(asOfDate: Date) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const accounts = await prisma.chartOfAccount.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      lines: {
        where: {
          journalEntry: {
            entryDate: { lte: asOfDate },
          },
        },
      },
    },
    orderBy: { code: "asc" },
  });

  const trialBalance = accounts.map((account) => {
    let debit = new Prisma.Decimal(0);
    let credit = new Prisma.Decimal(0);

    for (const line of account.lines) {
      debit = debit.add(line.debit);
      credit = credit.add(line.credit);
    }

    return {
      code: account.code,
      name: account.name,
      type: account.type,
      debit: debit.toString(),
      credit: credit.toString(),
    };
  });

  // Filter out accounts with zero balances
  return trialBalance.filter(
    (a) => a.debit !== "0" || a.credit !== "0"
  );
}
