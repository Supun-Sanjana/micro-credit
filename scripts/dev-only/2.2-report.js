const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const approvedReversals = await prisma.paymentReversal.findMany({
    where: { status: 'APPROVED' },
    include: {
      reversalPayment: true,
      repayment: true
    }
  });

  if (approvedReversals.length === 0) {
    console.log("No approved reversals to backfill.");
    return;
  }

  // Find reversals that have NO journal entry
  const missingJournalReversals = [];
  let totalDebitUnposted = new Prisma.Decimal(0);
  let totalCreditUnposted = new Prisma.Decimal(0);

  for (const reversal of approvedReversals) {
    if (!reversal.reversalPaymentId) continue;
    
    const existingJournal = await prisma.journalEntry.findFirst({
      where: {
        sourceType: 'REVERSAL',
        sourceId: reversal.reversalPaymentId
      }
    });

    if (!existingJournal) {
      // Find original journal
      const originalJournal = await prisma.journalEntry.findFirst({
        where: {
          sourceType: 'REPAYMENT',
          sourceId: reversal.repaymentId
        },
        include: { lines: true }
      });

      if (originalJournal) {
        missingJournalReversals.push({ reversal, originalJournal });
        for (const line of originalJournal.lines) {
          totalDebitUnposted = totalDebitUnposted.add(line.credit); // swap
          totalCreditUnposted = totalCreditUnposted.add(line.debit); // swap
        }
      }
    }
  }

  console.log("--- PHASE 2.2 BACKFILL REPORT ---");
  console.log(`Approved Reversals missing Journals: ${missingJournalReversals.length}`);
  console.log(`Total Unposted Debits: ${totalDebitUnposted.toString()}`);
  console.log(`Total Unposted Credits: ${totalCreditUnposted.toString()}`);
  console.log("---------------------------------");
  console.log("WAITING FOR EXPLICIT USER APPROVAL BEFORE PROCEEDING TO APPLY BACKFILL.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
