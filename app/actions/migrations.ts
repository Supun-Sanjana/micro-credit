"use server"
import { addDays, addMonths } from "date-fns"

import { getScopedDal } from "@/lib/dal"
import { requireRole } from "@/lib/auth-utils"
import { Prisma } from "@prisma/client"
import { postJournalEntry, getAccountByCode } from "@/lib/accounting"

async function authorizeMigration() {
  await requireRole(["SYSTEM_ADMIN", "HEAD_OFFICE"])
}

export async function previewMemberMigration(csvText: string) {
  await authorizeMigration()
  const dal = await getScopedDal()
  
  const lines = csvText.split("\n").map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length < 2) throw new Error("CSV must contain a header and at least one row.")
  
  const headers = lines[0].toLowerCase().split(",")
  const rows = lines.slice(1).map(line => {
    const values = line.split(",")
    const row: any = {}
    headers.forEach((h, i) => { row[h.trim()] = values[i]?.trim() })
    return row
  })

  // Validate relationships
  const centreCodes = [...new Set(rows.map(r => r.centrecode).filter(Boolean))] as string[]
  const centres = await dal.prisma.centre.findMany({
    where: { centreCode: { in: centreCodes }, branch: { organizationId: dal.organizationId } }
  })
  const validCentreCodes = new Set(centres.map(c => c.centreCode))

  const results = rows.map((row, index) => {
    const errors = []
    if (!row.name) errors.push("Missing name")
    if (!row.nic) errors.push("Missing NIC")
    if (!row.centrecode) errors.push("Missing centreCode")
    else if (!validCentreCodes.has(row.centrecode)) errors.push(`Centre code not found: ${row.centrecode}`)

    return { rowNumber: index + 2, data: row, errors, valid: errors.length === 0 }
  })

  return { total: results.length, valid: results.filter(r => r.valid).length, errors: results.filter(r => !r.valid).length, rows: results }
}

export async function executeMemberMigration(validRows: any[]) {
  await authorizeMigration()
  const dal = await getScopedDal()

  const centres = await dal.prisma.centre.findMany({
    where: { branch: { organizationId: dal.organizationId } }
  })
  const centreMap = new Map(centres.map(c => [c.centreCode, c.id]))

  let imported = 0
  await dal.prisma.$transaction(async (tx) => {
    for (const row of validRows) {
      const centreId = centreMap.get(row.centrecode)
      if (!centreId) continue // Should have been caught in preview

      // Auto-generate member number
      const existingCount = await tx.member.count({ where: { centreId } })
      const memberNumber = `${row.centrecode}/${String(existingCount + 1).padStart(3, '0')}`

      await tx.member.create({
        data: {
          organizationId: dal.organizationId,
          centreId,
          memberNumber,
          name: row.name,
          nic: row.nic,
          contact1: row.contact,
          address: row.address
        }
      })
      imported++
    }
  })

  return { success: true, imported }
}

export async function previewLoanMigration(csvText: string) {
  await authorizeMigration()
  const dal = await getScopedDal()
  
  const lines = csvText.split("\n").map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length < 2) throw new Error("CSV must contain a header and at least one row.")
  
  const headers = lines[0].toLowerCase().split(",")
  const rows = lines.slice(1).map(line => {
    const values = line.split(",")
    const row: any = {}
    headers.forEach((h, i) => { row[h.trim()] = values[i]?.trim() })
    return row
  })

  const nics = [...new Set(rows.map(r => r.membernic).filter(Boolean))] as string[]
  const members = await dal.prisma.member.findMany({
    where: { nic: { in: nics }, organizationId: dal.organizationId }
  })
  const validNics = new Set(members.map(m => m.nic))

  const products = await dal.prisma.loanProduct.findMany()
  const validProducts = new Set(products.map(p => p.name))

  const results = rows.map((row, index) => {
    const errors = []
    if (!row.membernic) errors.push("Missing memberNic")
    else if (!validNics.has(row.membernic)) errors.push(`Member NIC not found: ${row.membernic}`)
    
    if (!row.productname) errors.push("Missing productName")
    else if (!validProducts.has(row.productname)) errors.push(`Product not found: ${row.productname}`)

    if (!row.loanamount || isNaN(Number(row.loanamount))) errors.push("Invalid loanAmount")
    if (!row.outstanding || isNaN(Number(row.outstanding))) errors.push("Invalid outstanding")
    if (!row.weeksremaining || isNaN(Number(row.weeksremaining))) errors.push("Invalid weeksRemaining")
    
    return { rowNumber: index + 2, data: row, errors, valid: errors.length === 0 }
  })

  return { total: results.length, valid: results.filter(r => r.valid).length, errors: results.filter(r => !r.valid).length, rows: results }
}

export async function executeLoanMigration(validRows: any[]) {
  await authorizeMigration()
  const dal = await getScopedDal()

  const members = await dal.prisma.member.findMany({
    where: { organizationId: dal.organizationId },
    include: { centre: true }
  })
  const memberMap = new Map(members.map(m => [m.nic, m]))

  const products = await dal.prisma.loanProduct.findMany()
  const productMap = new Map(products.map(p => [p.name, p]))

  let imported = 0
  let totalReceivableValue = new Prisma.Decimal(0)

  // Use a transaction for safety
  await dal.prisma.$transaction(async (tx) => {
    for (const row of validRows) {
      const member = memberMap.get(row.membernic)
      const product = productMap.get(row.productname)
      if (!member || !product) continue

      const loanAmount = new Prisma.Decimal(row.loanamount)
      const outstanding = new Prisma.Decimal(row.outstanding)
      const weeksRemaining = Number(row.weeksremaining)
      const totalPaid = loanAmount.minus(outstanding) // Approximation if flat rate, but we trust the outstanding provided.
      
      const loan = await tx.loan.create({
        data: {
          memberId: member.id,
          loanProductId: product.id,
          loanType: product.loanType,
          loanAmount: loanAmount,
          weeklyRental: outstanding.dividedBy(weeksRemaining), // Simplistic assumption for legacy remaining schedules
          numberOfWeeks: product.numberOfWeeks,
          totalReceivable: loanAmount, // Keeping simplistic for migration
          grantedDate: new Date(row.granteddate || new Date()),
          status: 'ACTIVE',
          verificationStatus: 'VERIFIED',
          outstanding: outstanding,
          totalPaid: totalPaid.gte(0) ? totalPaid : 0,
        }
      })

      // Generate remaining schedule rows
        const schedules = []
        let currentDate = new Date()
        const frequency = product.repaymentFrequency || 'WEEKLY'
        for (let i = 1; i <= weeksRemaining; i++) {
          if (frequency === 'DAILY') {
            currentDate = addDays(currentDate, 1)
          } else if (frequency === 'WEEKLY') {
            currentDate = addDays(currentDate, 7)
          } else if (frequency === 'BIWEEKLY') {
            currentDate = addDays(currentDate, 14)
          } else if (frequency === 'MONTHLY') {
            currentDate = addMonths(currentDate, 1)
          }
          
          schedules.push({
            loanId: loan.id,
            instalmentNumber: product.numberOfWeeks - weeksRemaining + i,
            scheduledDate: currentDate,
            scheduledAmount: loan.weeklyRental,
            isPaid: false
          })
        }

      if (schedules.length > 0) {
        await tx.repaymentSchedule.createMany({ data: schedules })
      }

      imported++
      totalReceivableValue = totalReceivableValue.add(outstanding)
    }

    // POST JOURNAL ENTRY for Migration (Opening Balances)
    // Debit 1100 (Loan Receivable)
    // Credit 3900 (Opening Balances Equity) - or equivalent
    try {
      const receivableAccount = await getAccountByCode(dal.organizationId, '1100', tx)
      let equityAccount = await getAccountByCode(dal.organizationId, '3900', tx)
      
      if (!equityAccount) {
         // Create it if it doesn't exist
         equityAccount = await tx.chartOfAccount.create({
            data: {
              organizationId: dal.organizationId,
              code: '3900',
              name: 'Opening Balances / Migration',
              type: 'EQUITY'
            }
         })
      }

      const journal = await tx.journalEntry.create({
        data: {
          organizationId: dal.organizationId,
          branchId: members[0]?.centre.branchId,
          entryDate: new Date(),
          reference: `MIGRATE-${Date.now()}`,
          description: `Legacy Loan Migration Batch`,
          sourceType: 'SYSTEM',
          sourceId: 'MIGRATION',
          lines: {
            create: [
              { accountId: receivableAccount.id, debit: totalReceivableValue, credit: 0 },
              { accountId: equityAccount.id, debit: 0, credit: totalReceivableValue }
            ]
          }
        }
      })
    } catch (err) {
      console.error("Migration journal failed", err)
      // Throw to rollback everything if accounting fails
      throw err 
    }
  })

  return { success: true, imported, totalValue: totalReceivableValue.toNumber() }
}
