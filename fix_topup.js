const fs = require('fs');
const file = 'app/api/loans/[id]/events/route.ts';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/getAccountByCode\(dal.organizationId, '1100'\)/g, `getAccountByCode(dal.organizationId, '1100', tx)`);
c = c.replace(/getAccountByCode\(dal.organizationId, '5000'\)/g, `getAccountByCode(dal.organizationId, '5000', tx)`);
c = c.replace(/getAccountByCode\(dal.organizationId, '1000'\)/g, `getAccountByCode(dal.organizationId, '1000', tx)`);

const oldAccounting = `          // --- ACCOUNTING ---
          const { postJournalEntry, getAccountByCode } = await import("@/lib/accounting")
          const receivableAcc = await getAccountByCode(dal.organizationId, '1100', tx)
          const loanMember = await tx.member.findUnique({ where: { id: loan.memberId }, include: { centre: true }})
          const branchId = loanMember?.centre.branchId
  
          await postJournalEntry({
            organizationId: dal.organizationId,
            branchId,
            entryDate: new Date(),
            reference: \`TOPUP-\${loan.id.slice(-6)}\`,
            description: \`Loan Top-up settlement for Member \${loan.member.name}\`,
            sourceType: 'TOP_UP',
            sourceId: newLoan.id,
            tx,
            lines: [
              { accountId: receivableAcc.id, debit: loan.outstanding, credit: 0 },
              { accountId: receivableAcc.id, debit: 0, credit: loan.outstanding }
            ]
          })`

const newAccounting = `          // --- ACCOUNTING ---
          const { postJournalEntry, getAccountByCode } = await import("@/lib/accounting")
          const { balancesFromLoan } = await import("@/lib/payment-allocation")
          const balances = balancesFromLoan(loan as any)
          const receivableAcc = await getAccountByCode(dal.organizationId, '1100', tx)
          const cashAcc = await getAccountByCode(dal.organizationId, '1000', tx)
          const interestAcc = await getAccountByCode(dal.organizationId, '4000', tx)
          const loanMember = await tx.member.findUnique({ where: { id: loan.memberId }, include: { centre: true }})
          const branchId = loanMember?.centre.branchId
  
          await postJournalEntry({
            organizationId: dal.organizationId,
            branchId,
            entryDate: new Date(),
            reference: \`TOPUP-\${loan.id.slice(-6)}\`,
            description: \`Loan Top-up settlement for Member \${loan.member.name}\`,
            sourceType: 'TOP_UP',
            sourceId: newLoan.id,
            tx,
            lines: [
              // Clear old loan's receivable (Principal portion)
              { accountId: receivableAcc.id, debit: 0, credit: balances.PRINCIPAL },
              // Recognize old loan's unpaid interest as paid by the new loan
              { accountId: interestAcc.id, debit: 0, credit: balances.INTEREST },
              // Open new loan's receivable (Principal only, matching disbursement logic)
              { accountId: receivableAcc.id, debit: terms.loanAmount, credit: 0 },
              // Cash out for the additional amount disbursed beyond settlement
              { accountId: cashAcc.id, debit: 0, credit: amount.minus(loan.outstanding) }
            ]
          })`

c = c.replace(oldAccounting, newAccounting)
fs.writeFileSync(file, c);
console.log('done');
