import { PrismaClient, RiskAlertType } from '@prisma/client'

const prisma = new PrismaClient()

// Helper to safely create an alert, handling idempotency and non-throwing
async function safeCreateAlert(
  organizationId: string,
  entityId: string,
  entityType: string,
  type: RiskAlertType,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  description: string
) {
  try {
    const existing = await prisma.riskAlert.findFirst({
      where: { organizationId, entityId, type, status: 'OPEN' }
    })
    if (existing) return

    await prisma.riskAlert.create({
      data: {
        organizationId,
        type,
        severity,
        entityType,
        entityId,
        description,
        status: 'OPEN'
      }
    })
  } catch (e) {
    console.error(`[AnomalyDetector] Failed to create alert`, e)
  }
}

export async function checkDuplicateNIC(nic: string | null, organizationId: string, excludeMemberId?: string) {
  if (!nic) return
  try {
    const members = await prisma.member.findMany({
      where: {
        organizationId,
        nic,
        id: excludeMemberId ? { not: excludeMemberId } : undefined
      }
    })

    if (members.length > 0) {
      // Create alert on the newly updated/created member, or on all involved
      const entityId = excludeMemberId || members[0].id
      await safeCreateAlert(
        organizationId,
        entityId,
        'Member',
        'DUPLICATE_NIC',
        'CRITICAL',
        `Duplicate NIC detected: ${nic}`
      )
    }
  } catch (e) {
    console.error(`[AnomalyDetector] Error in checkDuplicateNIC`, e)
  }
}

export async function checkDuplicatePhone(phone: string | null, organizationId: string, excludeMemberId?: string) {
  if (!phone) return
  try {
    const members = await prisma.member.findMany({
      where: {
        organizationId,
        OR: [
          { contact1: phone },
          { contact2: phone }
        ],
        id: excludeMemberId ? { not: excludeMemberId } : undefined
      }
    })

    if (members.length > 0) {
      const entityId = excludeMemberId || members[0].id
      await safeCreateAlert(
        organizationId,
        entityId,
        'Member',
        'DUPLICATE_PHONE',
        'HIGH',
        `Duplicate phone number detected: ${phone}`
      )
    }
  } catch (e) {
    console.error(`[AnomalyDetector] Error in checkDuplicatePhone`, e)
  }
}

export async function checkDuplicatePayment(loanId: string, amount: number, date: Date, organizationId: string) {
  try {
    // Check if there is another payment with same amount on the same day for this loan
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const duplicates = await prisma.loanRepayment.findMany({
      where: {
        loanId,
        amount,
        paidDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        transactionType: 'PAYMENT'
      }
    })

    // If there is more than 1 payment with the exact same amount on the same day
    if (duplicates.length > 1) {
      await safeCreateAlert(
        organizationId,
        loanId,
        'Loan',
        'DUPLICATE_PAYMENT',
        'CRITICAL',
        `Potential duplicate payment detected for loan. Multiple payments of ${amount} on ${date.toISOString().split('T')[0]}.`
      )
    }
  } catch (e) {
    console.error(`[AnomalyDetector] Error in checkDuplicatePayment`, e)
  }
}

export async function checkSuspiciousActivity(loanId: string, organizationId: string) {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const reversals = await prisma.paymentReversal.count({
      where: {
        organizationId,
        status: 'APPROVED',
        approvedAt: {
          gte: thirtyDaysAgo
        },
        repayment: {
          loanId
        }
      }
    })

    if (reversals > 2) {
      await safeCreateAlert(
        organizationId,
        loanId,
        'Loan',
        'SUSPICIOUS_ACTIVITY',
        'HIGH',
        `Suspicious activity: ${reversals} payment reversals in the last 30 days.`
      )
    }
  } catch (e) {
    console.error(`[AnomalyDetector] Error in checkSuspiciousActivity`, e)
  }
}
