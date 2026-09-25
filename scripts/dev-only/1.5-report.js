const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find orphan repayments
  const orphanRepayments = await prisma.loanRepayment.findMany({
    where: {
      allocationMethod: null,
      allocations: { none: {} }
    },
    include: {
      loan: {
        include: {
          repayments: {
            orderBy: { paidDate: 'asc' }
          }
        }
      }
    }
  });

  if (orphanRepayments.length === 0) {
    console.log("No orphaned repayments found. No backfill needed.");
    return;
  }

  const affectedLoans = new Set();
  let driftLKR = 0;
  const orgBreakdown = {};

  for (const r of orphanRepayments) {
    affectedLoans.add(r.loanId);
    
    // We compute the proper drift.
    // The previous code incremented nothing on the loan. So the loan is missing this payment amount.
    driftLKR += Number(r.amount);

    if (!orgBreakdown[r.organizationId]) orgBreakdown[r.organizationId] = 0;
    orgBreakdown[r.organizationId] += Number(r.amount);
  }

  console.log("--- PHASE 1.5 BACKFILL REPORT ---");
  console.log(`Affected Repayments: ${orphanRepayments.length}`);
  console.log(`Affected Loans: ${affectedLoans.size}`);
  console.log(`Total LKR Drift (Missing from loan.totalPaid): ${driftLKR}`);
  console.log(`Per-Organization Breakdown:`, orgBreakdown);
  console.log("---------------------------------");
  console.log("WAITING FOR EXPLICIT USER APPROVAL BEFORE PROCEEDING TO APPLY BACKFILL.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
