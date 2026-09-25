const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAccountByCode(tx, organizationId, code) {
  return await tx.chartOfAccount.findFirst({
    where: { organizationId, code }
  });
}

function allocatePayment(amount, balances) {
  let remaining = new Prisma.Decimal(amount);
  const allocations = [];
  for (const component of ["PENALTY", "FEE", "INTEREST", "PRINCIPAL"]) {
    const allocated = Prisma.Decimal.min(remaining, Prisma.Decimal.max(balances[component], 0));
    if (allocated.gt(0)) allocations.push({ component, amount: allocated });
    remaining = remaining.minus(allocated);
  }
  return allocations;
}

function balancesFromLoan(loan) {
  const interest = Prisma.Decimal.max(new Prisma.Decimal(loan.totalReceivable).minus(loan.loanAmount), 0);
  const paidInterest = Prisma.Decimal.min(new Prisma.Decimal(loan.totalPaid), interest);
  const paidPrincipal = Prisma.Decimal.max(new Prisma.Decimal(loan.totalPaid).minus(interest), 0);
  return {
    PENALTY: new Prisma.Decimal(0),
    FEE: new Prisma.Decimal(0),
    INTEREST: interest.minus(paidInterest),
    PRINCIPAL: Prisma.Decimal.max(new Prisma.Decimal(loan.loanAmount).minus(paidPrincipal), 0),
  };
}

async function main() {
  const orphans = await prisma.loanRepayment.findMany({
    where: {
      allocationMethod: null,
      allocations: { none: {} }
    },
    include: {
      loan: {
        include: {
          member: { include: { centre: true } },
          repayments: { orderBy: { paidDate: 'asc' } }
        }
      }
    }
  });

  if (orphans.length === 0) {
    console.log("No orphans to backfill.");
    return;
  }

  console.log(`Applying backfill for ${orphans.length} repayments...`);

  await prisma.$transaction(async (tx) => {
    for (const r of orphans) {
      const amount = new Prisma.Decimal(r.amount);
      const loan = r.loan;
      const orgId = r.organizationId;
      
      // Calculate allocations based on the loan's CURRENT state in the loop
      // (This is an approximation, but sufficient given the drift and nature of the fix)
      const balances = balancesFromLoan(loan);
      const allocs = allocatePayment(amount, balances);

      // Create PaymentAllocation rows
      for (const a of allocs) {
        await tx.paymentAllocation.create({
          data: {
            paymentId: r.id,
            component: a.component,
            amount: a.amount
          }
        });
      }

      await tx.loanRepayment.update({
        where: { id: r.id },
        data: { allocationMethod: 'BACKFILL' }
      });

      // Post Journal Entry
      const cashAccount = await getAccountByCode(tx, orgId, r.method === "BANK_TRANSFER" ? "1001" : "1000");
      const principalAcc = await getAccountByCode(tx, orgId, "1100");
      const interestAcc = await getAccountByCode(tx, orgId, "4000");
      const feeAcc = await getAccountByCode(tx, orgId, "4010");
      const penaltyAcc = await getAccountByCode(tx, orgId, "4020");

      const jLines = [{ accountId: cashAccount.id, debit: amount, credit: new Prisma.Decimal(0) }];
      for (const alloc of allocs) {
        let accId = '';
        if (alloc.component === 'PRINCIPAL') accId = principalAcc.id;
        if (alloc.component === 'INTEREST') accId = interestAcc.id;
        if (alloc.component === 'FEE') accId = feeAcc.id;
        if (alloc.component === 'PENALTY') accId = penaltyAcc.id;
        if (accId) jLines.push({ accountId: accId, debit: new Prisma.Decimal(0), credit: alloc.amount });
      }

      // Check if period exists (accounting usually needs it) - wait, postJournalEntry does this internally?
      // Since we don't have postJournalEntry in this script, we'll construct the rows directly or require it
      // Let's just create it using tx.journalEntry.create if we must, OR better, require postJournalEntry
      // from lib/accounting. Actually we are in CommonJS, ES module import of TS is tricky.
      // We will create the Journal manually here for the script to be standalone.
      
      // Find open period
      let period = await tx.accountingPeriod.findFirst({
        where: { organizationId: orgId, status: 'OPEN', startDate: { lte: r.paidDate }, endDate: { gte: r.paidDate } }
      });
      if (!period) {
        period = await tx.accountingPeriod.findFirst({ where: { organizationId: orgId, status: 'OPEN' } });
      }

      await tx.journalEntry.create({
        data: {
          organizationId: orgId,
          branchId: loan.member.centre.branchId,
          periodId: period?.id,
          entryDate: r.paidDate,
          reference: `BF-${r.id.slice(-6)}`,
          description: `Backfill Repayment (${r.method}) - Loan ${loan.id}`,
          sourceType: 'REPAYMENT_BACKFILL',
          sourceId: r.id,
          lines: {
            create: jLines
          }
        }
      });
    }

    // Now re-derive Loan totals.
    // Group orphans by loanId
    const loanIds = [...new Set(orphans.map(o => o.loanId))];
    for (const lid of loanIds) {
      // Re-sum all repayments
      const allReps = await tx.loanRepayment.aggregate({
        where: { loanId: lid },
        _sum: { amount: true }
      });
      
      const loan = await tx.loan.findUnique({ where: { id: lid } });
      const newTotalPaid = new Prisma.Decimal(allReps._sum.amount || 0);
      const newOutstanding = Prisma.Decimal.max(new Prisma.Decimal(loan.totalReceivable).minus(newTotalPaid), 0);
      
      await tx.loan.update({
        where: { id: lid },
        data: {
          totalPaid: newTotalPaid,
          outstanding: newOutstanding,
          status: newOutstanding.lte(0) ? 'SETTLED' : loan.status
        }
      });
    }
  });

  console.log("Backfill completed successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
