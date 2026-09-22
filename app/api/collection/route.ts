import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { Prisma } from "@prisma/client"
import { addDays, subDays } from "date-fns"
import { allocatePayment, balancesFromLoan } from "@/lib/payment-allocation"
import { logAudit } from "@/lib/audit"
import { postJournalEntry, getAccountByCode } from "@/lib/accounting"

export async function GET(request: Request) {
  try {
    const dal = await getScopedDal()
    const { searchParams } = new URL(request.url)
    const centreId = searchParams.get("centreId")
    const dateStr = searchParams.get("date")

    if (!centreId || !dateStr) {
      return NextResponse.json({ error: "Missing centreId or date" }, { status: 400 })
    }

    // Restrict Field Officers to only see their assigned centres
    if (dal.role === "FIELD_OFFICER") {
      const centre = await dal.prisma.centre.findFirst({
        where: { id: centreId, officerId: dal.userId }
      })
      if (!centre) {
        return NextResponse.json({ error: "Unauthorized centre access" }, { status: 403 })
      }
    }

    const date = new Date(dateStr)
    const sevenDaysBefore = subDays(date, 7)
    const sevenDaysAfter = addDays(date, 7)

    const members = await dal.prisma.member.findMany({
      where: {
        centreId: centreId,
        organizationId: dal.organizationId
      },
      include: {
        loans: {
          where: { status: 'ACTIVE' },
          include: {
            repaymentSchedule: true
          }
        },
        savingsAccounts: {
          include: { product: true }
        }
      },
      orderBy: { memberNumber: 'asc' }
    })

    const results = []

    for (const member of members) {
      const activeLoan = member.loans[0]

      const sortedSchedules = activeLoan ? [...activeLoan.repaymentSchedule].sort(
        (a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()
      ) : []

      const currentSchedule = sortedSchedules.find(s => 
        s.scheduledDate >= sevenDaysBefore && 
        s.scheduledDate <= sevenDaysAfter && 
        s.status !== 'PAID'
      )

      const scheduledAmount = currentSchedule ? Number(currentSchedule.scheduledAmount) : (activeLoan ? Number(activeLoan.weeklyRental) : 0)
      
      const arrearsSchedules = sortedSchedules.filter(s => 
        (s.status === 'PARTIALLY_PAID' || s.status === 'MISSED') && 
        (!currentSchedule || s.id !== currentSchedule.id)
      )

      let arrearsBF = 0
      for (const s of arrearsSchedules) {
        if (s.status === 'PARTIALLY_PAID') {
          arrearsBF += Number(s.scheduledAmount) - Number(s.paidAmount)
        } else if (s.status === 'MISSED') {
          arrearsBF += Number(s.scheduledAmount) - Number(s.paidAmount)
        }
      }

      let compulsorySavingsAccount = member.savingsAccounts.find((a: any) => a.product.type === 'COMPULSORY' && a.status === 'ACTIVE')
      let voluntarySavingsAccount = member.savingsAccounts.find((a: any) => a.product.type === 'VOLUNTARY' && a.status === 'ACTIVE')

      results.push({
        memberId: member.id,
        memberName: member.name,
        memberNumber: member.memberNumber,
        groupNumber: member.groupNumber,
        loanId: activeLoan?.id || null,
        scheduleId: currentSchedule ? currentSchedule.id : null,
        instalmentNumber: currentSchedule ? currentSchedule.instalmentNumber : null,
        scheduledAmount,
        arrearsBF,
        totalDue: scheduledAmount + arrearsBF,
        weeklyRental: activeLoan ? Number(activeLoan.weeklyRental) : 0,
        outstanding: activeLoan ? Number(activeLoan.outstanding) : 0,
        currentStatus: currentSchedule ? currentSchedule.status : 'NONE',
        
        compulsorySavingsId: compulsorySavingsAccount?.id || null,
        compulsorySavingsBalance: compulsorySavingsAccount ? Number(compulsorySavingsAccount.balance) : 0,
        voluntarySavingsId: voluntarySavingsAccount?.id || null,
        voluntarySavingsBalance: voluntarySavingsAccount ? Number(voluntarySavingsAccount.balance) : 0,
      })
    }
    
    results.sort((a, b) => (a.groupNumber || 0) - (b.groupNumber || 0))

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal()
    const json = await request.json()
    const { date, centreId, entries } = json

    if (!date || !centreId || !entries) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (dal.role === "FIELD_OFFICER") {
      const centre = await dal.prisma.centre.findFirst({
        where: { id: centreId, officerId: dal.userId }
      })
      if (!centre) {
        return NextResponse.json({ error: "Unauthorized centre access" }, { status: 403 })
      }
    }

    const paidDate = new Date(date)

    // Issue 2: Cross-org bypass fix.
    // Validate all loanIds belong to the caller's organization using the scoped Prisma client.
    const loanIds = entries.map((e: any) => e.loanId)
    const validLoans = await dal.prisma.loan.findMany({
      where: { id: { in: loanIds } },
      select: { id: true }
    })
    const validLoanIds = new Set(validLoans.map((l: any) => l.id))

    for (const entry of entries) {
      if (!validLoanIds.has(entry.loanId)) {
        return NextResponse.json({ error: `Invalid or unauthorized loan ID: ${entry.loanId}` }, { status: 403 })
      }
    }

    const result = await dal.prisma.$transaction(async (tx: any) => {
      let savedCount = 0
      let totalCollected = 0

      for (const entry of entries) {
        const { loanId, scheduleId, instalmentNumber, amount, status, note, compulsorySavingsId, compulsorySavingsDeposit, voluntarySavingsId, voluntarySavingsDeposit } = entry
        
        const decimalAmount = new Prisma.Decimal(amount || 0)

        // Process Compulsory Savings
        if (compulsorySavingsId && compulsorySavingsDeposit && compulsorySavingsDeposit > 0) {
           const depositAmount = new Prisma.Decimal(compulsorySavingsDeposit)
           await tx.savingsTransaction.create({
             data: {
               savingsAccountId: compulsorySavingsId,
               type: 'DEPOSIT',
               amount: depositAmount,
               date: paidDate,
               notes: 'Collection sheet deposit',
               organizationId: dal.organizationId
             }
           })
           await tx.savingsAccount.update({
             where: { id: compulsorySavingsId },
             data: { balance: { increment: depositAmount } }
           })
           
           // Accounting
           const cashAcc = await getAccountByCode(dal.organizationId, '1000')
           const compSavAcc = await getAccountByCode(dal.organizationId, '2000')
           await postJournalEntry({
              organizationId: dal.organizationId,
              branchId: undefined, // we'll rely on dal scope if needed, or skip branchId for savings for now
              entryDate: paidDate,
              reference: `SAV-C-${compulsorySavingsId.slice(-6)}`,
              description: `Compulsory Savings Deposit via Collection`,
              sourceType: 'REPAYMENT',
              sourceId: compulsorySavingsId,
              tx,
              lines: [
                { accountId: cashAcc.id, debit: depositAmount, credit: new Prisma.Decimal(0) },
                { accountId: compSavAcc.id, debit: new Prisma.Decimal(0), credit: depositAmount }
              ]
            })
            totalCollected += compulsorySavingsDeposit
        }

        // Process Voluntary Savings
        if (voluntarySavingsId && voluntarySavingsDeposit && voluntarySavingsDeposit > 0) {
           const depositAmount = new Prisma.Decimal(voluntarySavingsDeposit)
           await tx.savingsTransaction.create({
             data: {
               savingsAccountId: voluntarySavingsId,
               type: 'DEPOSIT',
               amount: depositAmount,
               date: paidDate,
               notes: 'Collection sheet deposit',
               organizationId: dal.organizationId
             }
           })
           await tx.savingsAccount.update({
             where: { id: voluntarySavingsId },
             data: { balance: { increment: depositAmount } }
           })
           
           // Accounting
           const cashAcc = await getAccountByCode(dal.organizationId, '1000')
           const volSavAcc = await getAccountByCode(dal.organizationId, '2010')
           await postJournalEntry({
              organizationId: dal.organizationId,
              branchId: undefined, 
              entryDate: paidDate,
              reference: `SAV-V-${voluntarySavingsId.slice(-6)}`,
              description: `Voluntary Savings Deposit via Collection`,
              sourceType: 'REPAYMENT',
              sourceId: voluntarySavingsId,
              tx,
              lines: [
                { accountId: cashAcc.id, debit: depositAmount, credit: new Prisma.Decimal(0) },
                { accountId: volSavAcc.id, debit: new Prisma.Decimal(0), credit: depositAmount }
              ]
            })
            totalCollected += voluntarySavingsDeposit
        }


        if (!loanId) continue // If there's no loan, just process savings.

        // Issue 3: Idempotency check. Avoid double-billing if the request is retried.
        const existingRepayment = await tx.loanRepayment.findFirst({
          where: {
            loanId,
            instalmentNumber,
            paidDate
          }
        })
        if (existingRepayment) {
          continue // Skip this entry as it was already processed
        }

        if (status !== 'NP' && amount > 0) {
          // Fetch loan for balance computation before payment
          const loanForAlloc = await tx.loan.findUniqueOrThrow({ where: { id: loanId } })

          const repayment = await tx.loanRepayment.create({
            data: {
              loanId,
              instalmentNumber,
              scheduledDate: paidDate,
              paidDate,
              amount: decimalAmount,
              method: 'CASH',
              note,
              allocationMethod: 'COLLECTION'
            }
          })

          // Waterfall payment allocation (same as /api/repayments)
          const balances = balancesFromLoan(loanForAlloc)
          try {
            const allocs = allocatePayment(decimalAmount, balances)
            for (const alloc of allocs) {
              await tx.paymentAllocation.create({
                data: {
                  paymentId: repayment.id,
                  component: alloc.component,
                  amount: alloc.amount,
                }
              })
            }

            // --- ACCOUNTING ---
            const { postJournalEntry, getAccountByCode } = await import("@/lib/accounting")
            const cashAcc = await getAccountByCode(dal.organizationId, '1000')
            const principalAcc = await getAccountByCode(dal.organizationId, '1100')
            const interestAcc = await getAccountByCode(dal.organizationId, '4000')
            const feeAcc = await getAccountByCode(dal.organizationId, '4010')
            const penaltyAcc = await getAccountByCode(dal.organizationId, '4020')

            const jLines = [{ accountId: cashAcc.id, debit: decimalAmount, credit: new Prisma.Decimal(0) }]
            for (const alloc of allocs) {
              let accId = ''
              if (alloc.component === 'PRINCIPAL') accId = principalAcc.id
              if (alloc.component === 'INTEREST') accId = interestAcc.id
              if (alloc.component === 'FEE') accId = feeAcc.id
              if (alloc.component === 'PENALTY') accId = penaltyAcc.id
              if (accId) jLines.push({ accountId: accId, debit: new Prisma.Decimal(0), credit: alloc.amount })
            }

            // We need branchId from the loan member.
            // The collection endpoint currently has `centreId` via query param. Wait, we can get branchId from loanForAlloc if we included it, or fetch it.
            // Let's fetch branchId
            const loanMember = await tx.member.findUnique({ where: { id: loanForAlloc.memberId }, include: { centre: true }})
            const branchId = loanMember?.centre.branchId

            await postJournalEntry({
              organizationId: dal.organizationId,
              branchId: branchId,
              entryDate: paidDate,
              reference: `COL-${repayment.id.slice(-6)}`,
              description: `Bulk Collection Repayment`,
              sourceType: 'REPAYMENT',
              sourceId: repayment.id,
              tx,
              lines: jLines
            })
            // ------------------
          } catch (e: any) {
            console.error("Allocation/Accounting failed:", e)
            await tx.loanRepayment.update({
              where: { id: repayment.id },
              data: { allocationMethod: 'COLLECTION_UNALLOCATED' }
            })
          }

          // Atomic balance update
          const updatedLoan = await tx.loan.update({
            where: { id: loanId },
            data: {
              totalPaid: { increment: decimalAmount },
              outstanding: { decrement: decimalAmount }
            }
          })

          // Check if loan is now settled
          if (updatedLoan.outstanding.lte(0) && updatedLoan.status !== 'SETTLED') {
            await tx.loan.update({
              where: { id: loanId },
              data: { status: 'SETTLED' }
            })
          }

          if (scheduleId) {
            const updatedSchedule = await tx.repaymentSchedule.update({
              where: { id: scheduleId },
              data: {
                paidAmount: { increment: decimalAmount }
              }
            })
            
            const newScheduleStatus = updatedSchedule.paidAmount.gte(updatedSchedule.scheduledAmount) ? 'PAID' : 'PARTIALLY_PAID'
            if (updatedSchedule.status !== newScheduleStatus) {
              await tx.repaymentSchedule.update({
                where: { id: scheduleId },
                data: { status: newScheduleStatus }
              })
            }
          }
          savedCount++
          totalCollected += amount
        } else if (status === 'NP') {
          if (scheduleId) {
            await tx.repaymentSchedule.update({
              where: { id: scheduleId },
              data: { status: 'MISSED' }
            })
          }
          await tx.loanRepayment.create({
            data: {
              loanId,
              instalmentNumber,
              scheduledDate: paidDate,
              paidDate,
              amount: new Prisma.Decimal(0),
              method: 'CASH',
              note: note || 'NP'
            }
          })
          savedCount++
        }
      }

      return { savedCount, totalCollected }
    }, { maxWait: 20000, timeout: 30000 })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
