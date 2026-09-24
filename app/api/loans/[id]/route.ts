import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { calculateLoanTerms } from "@/lib/calc-engine"
import { Prisma } from "@prisma/client"
import { logAudit } from "@/lib/audit"
import { assertLoanTransition } from "@/lib/loan-lifecycle"
import { dispatchNotification } from "@/lib/services/notification-service"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dal = await getScopedDal()
    const { id } = await params
    
    const loan = await dal.prisma.loan.findUnique({
      where: { id },
      include: { 
        member: {
          include: {
            creditAssessments: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        },
        loanProduct: true, 
        guarantors: true,
        repaymentSchedule: { orderBy: { instalmentNumber: 'asc' } },
        repayments: { orderBy: { createdAt: 'desc' } }
      }
    })
    
    if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 })
      
    return NextResponse.json(loan)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dal = await getScopedDal()
    const { id } = await params
    const json = await request.json()
    
    const loan = await dal.prisma.loan.findUnique({ where: { id }, include: { loanProduct: true } })
    if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 })
    
    // RBAC: Disburse and Transition require Branch Manager or higher
    if (json.action === "DISBURSE" || json.action === "TRANSITION") {
      if (dal.role !== "BRANCH_MANAGER" && dal.role !== "SYSTEM_ADMIN" && dal.role !== "HEAD_OFFICE" && dal.role !== "ACCOUNTANT") {
        return NextResponse.json({ error: "Forbidden: role required" }, { status: 403 })
      }
    }

    if (json.action === "VERIFY" && json.status === "VERIFIED") {
      const { canApproveLoanAmount } = await import("@/app/actions/approvals")
      const canApprove = await canApproveLoanAmount(loan.loanAmount, dal.role, dal)
      if (!canApprove) {
        return NextResponse.json({ error: "Forbidden: Loan amount exceeds your configured approval limit." }, { status: 403 })
      }
    }

    if (json.action === "TRANSITION") {
      assertLoanTransition(loan.status, json.status)
      const updated = await dal.prisma.loan.update({ where: { id }, data: { status: json.status } })
      await logAudit({ dal, action: "UPDATE", entityType: "Loan", entityId: id, before: loan, after: updated, note: `Lifecycle transition: ${loan.status} → ${json.status}` })
      return NextResponse.json(updated)
    }

    // Action: VERIFY
    if (json.action === 'VERIFY') {
      const updated = await dal.prisma.loan.update({
        where: { id },
        data: {
          verificationStatus: json.status, // "VERIFIED" | "REJECTED"
          verificationNote: json.note
        }
      })
      await logAudit({
        dal,
        action: "UPDATE",
        entityType: "Loan",
        entityId: id,
        before: loan,
        after: updated,
        note: `Verification: ${json.status}`
      })
      if (json.status === 'VERIFIED') {
        void dispatchNotification({
          type: 'LOAN_APPROVED',
          payload: { loanId: updated.id, memberId: updated.memberId, organizationId: dal.organizationId, loanNumber: updated.loanNumber, amount: updated.loanAmount.toString() }
        })
      }
      return NextResponse.json(updated)
    }

    // Action: DISBURSE (generates schedule and makes ACTIVE)
    if (json.action === 'DISBURSE') {
      if (loan.verificationStatus !== 'VERIFIED') {
        return NextResponse.json({ error: "Cannot disburse unverified loan" }, { status: 400 })
      }
      if (loan.status === 'ACTIVE') {
        return NextResponse.json({ error: "Already disbursed" }, { status: 400 })
      }

      if (!loan.loanProduct) {
        return NextResponse.json({ error: "Loan is missing a product" }, { status: 400 })
      }
      // Re-calculate to get finalPayment using our calc engine
      const terms = calculateLoanTerms(loan.loanAmount, loan.loanProduct)
      
      const grantedDate = new Date(json.grantedDate || new Date())
      const schedules: any[] = []
      
      // Generate exactly N rows, 7 days apart
      let currentDate = new Date(grantedDate)
      for (let i = 1; i <= terms.numberOfWeeks; i++) {
        currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        
        let amount = terms.weeklyRental
        if (i === terms.numberOfWeeks) {
          amount = terms.finalPayment // Use the exact final payment to absorb pennies
        }

        schedules.push({
          instalmentNumber: i,
          scheduledDate: currentDate,
          scheduledAmount: amount,
          isPaid: false
        })
      }

      const updated = await dal.prisma.$transaction(async (tx) => {
        // Acquire row lock
        await tx.$executeRaw`SELECT id FROM "Loan" WHERE id = ${id} FOR UPDATE`
        
        const lockedLoan = await tx.loan.findUnique({ where: { id } })
        if (lockedLoan?.status === 'ACTIVE') throw new Error("Already disbursed");

        const updatedLoan = await tx.loan.update({
          where: { id },
          data: {
            status: 'ACTIVE',
            grantedDate,
            expireDate: schedules[schedules.length - 1].scheduledDate,
            repaymentSchedule: {
              create: schedules
            }
          },
          include: { repaymentSchedule: true, member: { include: { centre: true } } }
        })

        // POST JOURNAL ENTRY for Disbursement (Debit Loan Receivable, Credit Cash)
        const { postJournalEntry, getAccountByCode } = await import("@/lib/accounting")
        const receivableAccount = await getAccountByCode(dal.organizationId, '1100')
        const cashAccount = await getAccountByCode(dal.organizationId, '1000')

        if (!receivableAccount || !cashAccount) throw new Error("Missing accounting codes for disbursement");

        await postJournalEntry({
          organizationId: dal.organizationId,
          branchId: updatedLoan.member.centre.branchId,
          entryDate: grantedDate,
          reference: `LOAN-${updatedLoan.id.slice(-6)}`,
          description: `Loan Disbursement for Member ${updatedLoan.member.name}`,
          sourceType: 'DISBURSEMENT',
          sourceId: updatedLoan.id,
          tx,
          lines: [
            { accountId: receivableAccount.id, debit: updatedLoan.loanAmount, credit: 0 },
            { accountId: cashAccount.id, debit: 0, credit: updatedLoan.loanAmount }
          ]
        })

        return updatedLoan
      })
      
      await logAudit({
        dal,
        action: "UPDATE",
        entityType: "Loan",
        entityId: id,
        before: loan,
        after: updated,
        note: `Disbursed`
      })

      void dispatchNotification({
        type: 'LOAN_DISBURSED',
        payload: { loanId: updated.id, memberId: updated.memberId, organizationId: dal.organizationId, loanNumber: updated.loanNumber, amount: updated.loanAmount.toString() }
      })

      return NextResponse.json(updated)
    }
    
    // Normal update (e.g. edit amounts before verification)
    if (loan.status !== 'PENDING') {
      return NextResponse.json({ error: "Cannot edit disbursed loan" }, { status: 400 })
    }

    const updateData: Prisma.LoanUpdateInput = {
      loanAmount: json.loanAmount
    }

    if (json.guarantors) {
      // Re-calculate guarantors payload
      const guarantorsData = json.guarantors.map((g: any) => ({
        memberId: g.memberId || null,
        name: g.name,
        nic: g.nic,
        contact: g.contact,
        relationship: g.relationship
      }))

      // Replace existing guarantors by deleting them and creating new ones
      updateData.guarantors = {
        deleteMany: {}, // Deletes all associated guarantors for this loan
        create: guarantorsData
      }
    }

    // Re-calculate loan terms if the amount or product changed
    if (json.loanAmount && json.loanAmount !== loan.loanAmount.toNumber()) {
      const terms = calculateLoanTerms(json.loanAmount, loan.loanProduct!)
      updateData.weeklyRental = terms.weeklyRental
      updateData.totalReceivable = terms.totalReceivable
      updateData.outstanding = terms.totalReceivable
      updateData.numberOfWeeks = terms.numberOfWeeks
    }

    const updated = await dal.prisma.loan.update({
      where: { id },
      data: updateData,
      include: { guarantors: true }
    })
    
    await logAudit({
      dal,
      action: "UPDATE",
      entityType: "Loan",
      entityId: id,
      before: loan,
      after: updated
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
