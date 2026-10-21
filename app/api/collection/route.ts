import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { recordPayment } from "@/lib/services/payment-service"
import { Prisma } from "@prisma/client"
import { addDays, subDays } from "date-fns"
import { allocatePayment, balancesFromLoan } from "@/lib/payment-allocation"
import { logAudit } from "@/lib/audit"
import { postJournalEntry, getAccountByCode } from "@/lib/accounting"
import {
  assertMatchingPaymentFingerprint,
  normalizePaymentIdempotencyPayload,
  paymentIdempotencyFingerprint,
  PaymentIdempotencyConflictError,
} from "@/lib/payment-idempotency"

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
      const notifications: any[] = []
      const duplicates: Array<{ entryId: string; repaymentId: string }> = []

      for (const entry of entries) {
        const { loanId, scheduleId, instalmentNumber, amount, status, note, compulsorySavingsId, compulsorySavingsDeposit, voluntarySavingsId, voluntarySavingsDeposit } = entry
        const clientTransactionId = typeof entry.clientTransactionId === "string"
          ? entry.clientTransactionId.trim()
          : typeof entry.idempotencyKey === "string"
            ? entry.idempotencyKey.trim()
            : ""
        
        const decimalAmount = new Prisma.Decimal(amount || 0)

        // 1. Idempotency Check BEFORE any financial mutation
        if (clientTransactionId) {
          const compRef = `${clientTransactionId}:compulsory`
          const volRef = `${clientTransactionId}:voluntary`

          const incomingCompDeposit = (compulsorySavingsDeposit && Number(compulsorySavingsDeposit) > 0)
            ? new Prisma.Decimal(compulsorySavingsDeposit)
            : new Prisma.Decimal(0)

          const incomingVolDeposit = (voluntarySavingsDeposit && Number(voluntarySavingsDeposit) > 0)
            ? new Prisma.Decimal(voluntarySavingsDeposit)
            : new Prisma.Decimal(0)

          const hasLoanPayment = loanId && status !== 'NP' && amount > 0

          if (hasLoanPayment) {
            const idempotencyPayload = normalizePaymentIdempotencyPayload({ loanId, scheduleId, amount, method: 'CASH' })
            const fingerprint = paymentIdempotencyFingerprint(idempotencyPayload)

            const existingRepayment = await tx.loanRepayment.findUnique({
              where: {
                organizationId_clientTransactionId: {
                  organizationId: dal.organizationId,
                  clientTransactionId,
                },
              },
            })

            if (existingRepayment) {
              assertMatchingPaymentFingerprint(existingRepayment, fingerprint)

              // Symmetrical savings verification for compulsory savings
              const existingComp = await tx.savingsTransaction.findUnique({
                where: {
                  organizationId_reference: {
                    organizationId: dal.organizationId,
                    reference: compRef,
                  },
                },
              })

              if (existingComp) {
                if (!compulsorySavingsId || existingComp.savingsAccountId !== compulsorySavingsId || !existingComp.amount.equals(incomingCompDeposit)) {
                  throw new PaymentIdempotencyConflictError()
                }
              } else if (incomingCompDeposit.gt(0)) {
                throw new PaymentIdempotencyConflictError()
              }

              // Symmetrical savings verification for voluntary savings
              const existingVol = await tx.savingsTransaction.findUnique({
                where: {
                  organizationId_reference: {
                    organizationId: dal.organizationId,
                    reference: volRef,
                  },
                },
              })

              if (existingVol) {
                if (!voluntarySavingsId || existingVol.savingsAccountId !== voluntarySavingsId || !existingVol.amount.equals(incomingVolDeposit)) {
                  throw new PaymentIdempotencyConflictError()
                }
              } else if (incomingVolDeposit.gt(0)) {
                throw new PaymentIdempotencyConflictError()
              }

              duplicates.push({ entryId: clientTransactionId, repaymentId: existingRepayment.id })
              continue
            }
          } else {
            // Savings-only entry idempotency check (or NP / 0 amount loan)
            const existingComp = await tx.savingsTransaction.findUnique({
              where: {
                organizationId_reference: {
                  organizationId: dal.organizationId,
                  reference: compRef,
                },
              },
            })

            const existingVol = await tx.savingsTransaction.findUnique({
              where: {
                organizationId_reference: {
                  organizationId: dal.organizationId,
                  reference: volRef,
                },
              },
            })

            if (existingComp || existingVol) {
              if (existingComp) {
                if (!compulsorySavingsId || existingComp.savingsAccountId !== compulsorySavingsId || !existingComp.amount.equals(incomingCompDeposit)) {
                  throw new PaymentIdempotencyConflictError()
                }
              } else if (incomingCompDeposit.gt(0)) {
                throw new PaymentIdempotencyConflictError()
              }

              if (existingVol) {
                if (!voluntarySavingsId || existingVol.savingsAccountId !== voluntarySavingsId || !existingVol.amount.equals(incomingVolDeposit)) {
                  throw new PaymentIdempotencyConflictError()
                }
              } else if (incomingVolDeposit.gt(0)) {
                throw new PaymentIdempotencyConflictError()
              }

              duplicates.push({ entryId: clientTransactionId, repaymentId: existingComp?.id ?? existingVol?.id ?? "" })
              continue
            }
          }
        }

        // Process Compulsory Savings
        if (compulsorySavingsId && compulsorySavingsDeposit && compulsorySavingsDeposit > 0) {
           const depositAmount = new Prisma.Decimal(compulsorySavingsDeposit)
           await tx.savingsTransaction.create({
             data: {
               savingsAccountId: compulsorySavingsId,
               type: 'DEPOSIT',
               amount: depositAmount,
               date: paidDate,
               reference: clientTransactionId ? `${clientTransactionId}:compulsory` : undefined,
               notes: 'Collection sheet deposit',
               organizationId: dal.organizationId
             }
           })
           await tx.savingsAccount.update({
             where: { id: compulsorySavingsId },
             data: { balance: { increment: depositAmount } }
           })
           
           // Accounting
           const cashAcc = await getAccountByCode(dal.organizationId, '1000', tx)
           const compSavAcc = await getAccountByCode(dal.organizationId, '2000', tx)
           await postJournalEntry({
              organizationId: dal.organizationId,
              branchId: undefined, // we'll rely on dal scope if needed, or skip branchId for savings for now
              entryDate: paidDate,
              reference: clientTransactionId ? `SAV-C-${clientTransactionId}` : `SAV-C-${compulsorySavingsId.slice(-6)}`,
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
               reference: clientTransactionId ? `${clientTransactionId}:voluntary` : undefined,
               notes: 'Collection sheet deposit',
               organizationId: dal.organizationId
             }
           })
           await tx.savingsAccount.update({
             where: { id: voluntarySavingsId },
             data: { balance: { increment: depositAmount } }
           })
           
           // Accounting
           const cashAcc = await getAccountByCode(dal.organizationId, '1000', tx)
           const volSavAcc = await getAccountByCode(dal.organizationId, '2010', tx)
           await postJournalEntry({
              organizationId: dal.organizationId,
              branchId: undefined, 
              entryDate: paidDate,
              reference: clientTransactionId ? `SAV-V-${clientTransactionId}` : `SAV-V-${voluntarySavingsId.slice(-6)}`,
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

        if (status !== 'NP' && amount > 0) {
          const idempotencyPayload = clientTransactionId
            ? normalizePaymentIdempotencyPayload({ loanId, scheduleId, amount, method: 'CASH' })
            : null
          const fingerprint = idempotencyPayload ? paymentIdempotencyFingerprint(idempotencyPayload) : undefined

          const repayment = await recordPayment(tx as any, {
            organizationId: dal.organizationId,
            loanId,
            amount: decimalAmount,
            paidDate,
            method: 'CASH',
            scheduleId,
            note,
            collectedBy: dal.userId,
            clientTransactionId: clientTransactionId || undefined,
            idempotencyFingerprint: fingerprint,
            source: 'COLLECTION_SHEET'
          })

          const loanForAlloc = await tx.loan.findUniqueOrThrow({ where: { id: loanId } })

          notifications.push({
            type: 'PAYMENT_RECEIVED',
            payload: {
              loanId: loanId,
              memberId: loanForAlloc.memberId,
              organizationId: dal.organizationId,
              amount: decimalAmount.toString(),
              paidDate: paidDate.toISOString()
            }
          })
          
          if (loanForAlloc.status === 'SETTLED') {
            notifications.push({
              type: 'LOAN_SETTLED',
              payload: {
                loanId: loanId,
                memberId: loanForAlloc.memberId,
                organizationId: dal.organizationId,
                loanNumber: loanForAlloc.loanNumber
              }
            })
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
              organizationId: dal.organizationId,
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

      return { savedCount, totalCollected, notifications, duplicates }
    }, { maxWait: 20000, timeout: 30000 }).catch(async (error: any) => {
      // Handle P2002 on concurrent duplicate submission
      if (error?.code === "P2002") {
        const recoveredDuplicates: Array<{ entryId: string; repaymentId: string }> = []
        let allMatched = true

        for (const entry of entries) {
          const clientTransactionId = typeof entry.clientTransactionId === "string"
            ? entry.clientTransactionId.trim()
            : typeof entry.idempotencyKey === "string"
              ? entry.idempotencyKey.trim()
              : ""

          if (!clientTransactionId) {
            allMatched = false
            break
          }

          const {
            loanId,
            scheduleId,
            amount,
            status,
            compulsorySavingsId,
            compulsorySavingsDeposit,
            voluntarySavingsId,
            voluntarySavingsDeposit
          } = entry

          const compRef = `${clientTransactionId}:compulsory`
          const volRef = `${clientTransactionId}:voluntary`

          const incomingCompDeposit = (compulsorySavingsDeposit && Number(compulsorySavingsDeposit) > 0)
            ? new Prisma.Decimal(compulsorySavingsDeposit)
            : new Prisma.Decimal(0)

          const incomingVolDeposit = (voluntarySavingsDeposit && Number(voluntarySavingsDeposit) > 0)
            ? new Prisma.Decimal(voluntarySavingsDeposit)
            : new Prisma.Decimal(0)

          const hasLoanPayment = loanId && status !== 'NP' && amount > 0

          if (hasLoanPayment) {
            const idempotencyPayload = normalizePaymentIdempotencyPayload({ loanId, scheduleId, amount, method: 'CASH' })
            const fingerprint = paymentIdempotencyFingerprint(idempotencyPayload)

            const committed = await dal.prisma.loanRepayment.findUnique({
              where: {
                organizationId_clientTransactionId: {
                  organizationId: dal.organizationId,
                  clientTransactionId,
                },
              },
            })

            if (!committed) {
              allMatched = false
              break
            }

            assertMatchingPaymentFingerprint(committed, fingerprint)

            const committedComp = await dal.prisma.savingsTransaction.findUnique({
              where: {
                organizationId_reference: {
                  organizationId: dal.organizationId,
                  reference: compRef,
                },
              },
            })

            if (committedComp) {
              if (!compulsorySavingsId || committedComp.savingsAccountId !== compulsorySavingsId || !committedComp.amount.equals(incomingCompDeposit)) {
                throw new PaymentIdempotencyConflictError()
              }
            } else if (incomingCompDeposit.gt(0)) {
              throw new PaymentIdempotencyConflictError()
            }

            const committedVol = await dal.prisma.savingsTransaction.findUnique({
              where: {
                organizationId_reference: {
                  organizationId: dal.organizationId,
                  reference: volRef,
                },
              },
            })

            if (committedVol) {
              if (!voluntarySavingsId || committedVol.savingsAccountId !== voluntarySavingsId || !committedVol.amount.equals(incomingVolDeposit)) {
                throw new PaymentIdempotencyConflictError()
              }
            } else if (incomingVolDeposit.gt(0)) {
              throw new PaymentIdempotencyConflictError()
            }

            recoveredDuplicates.push({ entryId: clientTransactionId, repaymentId: committed.id })
          } else {
            // Savings-only entry
            const committedComp = await dal.prisma.savingsTransaction.findUnique({
              where: {
                organizationId_reference: {
                  organizationId: dal.organizationId,
                  reference: compRef,
                },
              },
            })

            const committedVol = await dal.prisma.savingsTransaction.findUnique({
              where: {
                organizationId_reference: {
                  organizationId: dal.organizationId,
                  reference: volRef,
                },
              },
            })

            if (!committedComp && !committedVol) {
              allMatched = false
              break
            }

            if (committedComp) {
              if (!compulsorySavingsId || committedComp.savingsAccountId !== compulsorySavingsId || !committedComp.amount.equals(incomingCompDeposit)) {
                throw new PaymentIdempotencyConflictError()
              }
            } else if (incomingCompDeposit.gt(0)) {
              throw new PaymentIdempotencyConflictError()
            }

            if (committedVol) {
              if (!voluntarySavingsId || committedVol.savingsAccountId !== voluntarySavingsId || !committedVol.amount.equals(incomingVolDeposit)) {
                throw new PaymentIdempotencyConflictError()
              }
            } else if (incomingVolDeposit.gt(0)) {
              throw new PaymentIdempotencyConflictError()
            }

            recoveredDuplicates.push({ entryId: clientTransactionId, repaymentId: committedComp?.id ?? committedVol?.id ?? "" })
          }
        }

        if (allMatched && recoveredDuplicates.length === entries.length) {
          return {
            savedCount: 0,
            totalCollected: 0,
            notifications: [],
            duplicates: recoveredDuplicates,
          }
        }
      }
      throw error
    })

    // Dispatch notifications after successful transaction
    const { dispatchNotification } = await import('@/lib/services/notification-service')
    if (result.notifications && result.notifications.length > 0) {
      for (const notif of result.notifications) {
        void dispatchNotification(notif)
      }
    }

    return NextResponse.json({ savedCount: result.savedCount, totalCollected: result.totalCollected, duplicates: result.duplicates })
  } catch (error: any) {
    if (error instanceof PaymentIdempotencyConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
