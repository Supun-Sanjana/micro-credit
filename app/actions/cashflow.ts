"use server"

import { getScopedDal } from "@/lib/dal"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function getCashFlows(dateStr: string) {
  const dal = await getScopedDal()
  
  // Only branch managers or admins can view all cash flows for their branch/org
  const flows = await dal.prisma.cashFlow.findMany({
    where: {
      date: new Date(dateStr),
      ...(dal.role === "USER" ? { branchId: (dal as any).branchId } : {})
    },
    include: {
      branch: true
    }
  })
  return flows
}

export async function upsertCashFlow(data: {
  branchId: string
  date: string
  centreName: string
  loanType: any
  loansIssued: number
  amountIssued: number
  dcAmount: number
  recoveryAmount: number
  totalRecovery: number
  interestAmount?: number
  capitalAmount?: number
  note?: string
}) {
  const dal = await getScopedDal()
  
  // Verify branch belongs to org
  const branch = await dal.prisma.branch.findFirst({
    where: { id: data.branchId, organizationId: dal.organizationId }
  })
  if (!branch) throw new Error("Invalid branch")

  const date = new Date(data.date)

  const flow = await dal.prisma.cashFlow.upsert({
    where: {
      branchId_date_centreName_loanType: {
        branchId: data.branchId,
        date: date,
        centreName: data.centreName,
        loanType: data.loanType
      }
    },
    update: {
      loansIssued: data.loansIssued,
      amountIssued: data.amountIssued,
      dcAmount: data.dcAmount,
      recoveryAmount: data.recoveryAmount,
      totalRecovery: data.totalRecovery,
      interestAmount: data.interestAmount,
      capitalAmount: data.capitalAmount,
      note: data.note
    },
    create: {
      branchId: data.branchId,
      date: date,
      centreName: data.centreName,
      loanType: data.loanType,
      loansIssued: data.loansIssued,
      amountIssued: data.amountIssued,
      dcAmount: data.dcAmount,
      recoveryAmount: data.recoveryAmount,
      totalRecovery: data.totalRecovery,
      interestAmount: data.interestAmount,
      capitalAmount: data.capitalAmount,
      note: data.note
    }
  })

  return flow
}
