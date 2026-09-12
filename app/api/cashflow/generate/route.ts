import { NextResponse } from "next/server"
import { getScopedDal } from "@/lib/dal"
import { Prisma } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const dal = await getScopedDal()
    const json = await request.json()
    // Optional date, defaults to today
    const dateStr = json.date ? new Date(json.date) : new Date()
    dateStr.setUTCHours(0,0,0,0)

    // 1. Find all repayments made on this date for this org
    const repayments = await dal.prisma.loanRepayment.findMany({
      where: {
        paidDate: {
          gte: dateStr,
          lt: new Date(dateStr.getTime() + 24 * 60 * 60 * 1000)
        },
        loan: { member: { centre: { branch: { organizationId: dal.organizationId } } } }
      },
      include: {
        loan: { include: { member: { include: { centre: { include: { branch: true } } } } } }
      }
    })

    // 2. Find all loans issued on this date
    const loansIssued = await dal.prisma.loan.findMany({
      where: {
        grantedDate: {
          gte: dateStr,
          lt: new Date(dateStr.getTime() + 24 * 60 * 60 * 1000)
        },
        member: { centre: { branch: { organizationId: dal.organizationId } } }
      },
      include: { member: { include: { centre: { include: { branch: true } } } } }
    })

    // Grouping by Branch -> CentreName -> LoanType
    const grouped: any = {}
    
    const getGroup = (branchId: string, centreName: string, loanType: string) => {
      const key = `${branchId}|${centreName}|${loanType}`
      if (!grouped[key]) {
        grouped[key] = {
          branchId,
          centreName,
          loanType,
          date: dateStr,
          loansIssued: 0,
          amountIssued: new Prisma.Decimal(0),
          recoveryAmount: new Prisma.Decimal(0),
          totalRecovery: new Prisma.Decimal(0)
        }
      }
      return grouped[key]
    }

    for (const r of repayments) {
      const bId = r.loan.member.centre.branchId
      const cName = r.loan.member.centre.name
      const lType = r.loan.loanType
      
      const group = getGroup(bId, cName, lType)
      group.recoveryAmount = group.recoveryAmount.add(r.amount)
      group.totalRecovery = group.totalRecovery.add(r.amount)
    }

    for (const l of loansIssued) {
      const bId = l.member.centre.branchId
      const cName = l.member.centre.name
      const lType = l.loanType
      
      const group = getGroup(bId, cName, lType)
      group.loansIssued += 1
      group.amountIssued = group.amountIssued.add(l.loanAmount) // loanAmount is the capital issued
    }

    // Upsert to CashFlow table
    const results = await dal.prisma.$transaction(async (tx) => {
      const upserted = []
      for (const key of Object.keys(grouped)) {
        const g = grouped[key]
        const record = await tx.cashFlow.upsert({
          where: {
            branchId_date_centreName_loanType: {
              branchId: g.branchId,
              date: g.date,
              centreName: g.centreName,
              loanType: g.loanType
            }
          },
          create: g,
          update: {
            loansIssued: g.loansIssued,
            amountIssued: g.amountIssued,
            recoveryAmount: g.recoveryAmount,
            totalRecovery: g.totalRecovery
          }
        })
        upserted.push(record)
      }
      return upserted
    })

    return NextResponse.json({ success: true, count: results.length, data: results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
