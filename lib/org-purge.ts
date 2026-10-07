import prisma from "./prisma"


export const TRIAL_PURGE_GRACE_DAYS = 30

export async function isOrgPurgeEligible(
  organizationId: string,
  now = new Date()
): Promise<{ eligible: boolean; reason: string }> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: {
      _count: {
        select: { paymentClaims: true },
      },
    },
  })

  if (!subscription) {
    return { eligible: false, reason: "No subscription found" }
  }

  if (subscription.status !== "SUSPENDED") {
    return { eligible: false, reason: "Subscription is not SUSPENDED" }
  }

  if (!subscription.trialEndsAt) {
    return { eligible: false, reason: "No trialEndsAt date" }
  }

  const gracePeriodEnd = new Date(
    subscription.trialEndsAt.getTime() + TRIAL_PURGE_GRACE_DAYS * 24 * 60 * 60 * 1000
  )

  if (now <= gracePeriodEnd) {
    return { eligible: false, reason: "Inside grace period" }
  }

  if (subscription.currentPeriodEnd !== null) {
    return { eligible: false, reason: "Has a currentPeriodEnd (was active)" }
  }

  if (subscription._count.paymentClaims > 0) {
    return { eligible: false, reason: "Has payment claims" }
  }

  return { eligible: true, reason: "" }
}

export async function purgeOrganization(
  organizationId: string,
  opts: { reason: "TRIAL_EXPIRED_AUTO"; triggeredBy: string; dryRun: boolean }
): Promise<{ dryRun: boolean; rowCounts: Record<string, number>; storageFiles: number }> {
  const { eligible, reason } = await isOrgPurgeEligible(organizationId)
  if (!eligible) {
    throw new Error("NOT_ELIGIBLE: " + reason)
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  })
  if (!org) {
    throw new Error("Organization not found")
  }

  const documents = await prisma.memberDocument.findMany({
    where: { organizationId },
    select: { storagePath: true },
  })
  const paths = documents.map((d) => d.storagePath)

  // Determine scoping clauses for row counts and deletes
  const orgWhere = { organizationId }
  const memberOrgWhere = { member: { organizationId } }
  const loanOrgWhere = { loan: { member: { organizationId } } }
  const journalOrgWhere = { journalEntry: { organizationId } }
  const branchOrgWhere = { branch: { organizationId } }
  const writeOffOrgWhere = { writeOff: { organizationId } }
  const documentOrgWhere = { document: { organizationId } }

  // 1. Gather all count promises to run concurrently
  const countPromises = {
    DocumentVerification: prisma.documentVerification.count({ where: documentOrgWhere }),
    WriteOffRecovery: prisma.writeOffRecovery.count({ where: writeOffOrgWhere }),
    PaymentAllocation: prisma.paymentAllocation.count({ where: { payment: { organizationId } } }),
    PaymentReversal: prisma.paymentReversal.count({ where: orgWhere }),
    JournalLine: prisma.journalLine.count({ where: journalOrgWhere }),
    SavingsTransaction: prisma.savingsTransaction.count({ where: orgWhere }),
    SavingsAccount: prisma.savingsAccount.count({ where: orgWhere }),
    NotificationLog: prisma.notificationLog.count({ where: orgWhere }),
    UserNotificationPreference: prisma.userNotificationPreference.count({ where: orgWhere }),
    CollectionAttempt: prisma.collectionAttempt.count({ where: orgWhere }),
    CreditAssessment: prisma.creditAssessment.count({ where: orgWhere }),
    RiskAlert: prisma.riskAlert.count({ where: orgWhere }),
    GroupMembership: prisma.groupMembership.count({ where: { group: { organizationId } } }),
    Guarantor: prisma.guarantor.count({ where: loanOrgWhere }),
    FinancialProfile: prisma.financialProfile.count({ where: orgWhere }),
    LoanRepayment: prisma.loanRepayment.count({ where: orgWhere }),
    MemberDocument: prisma.memberDocument.count({ where: orgWhere }),
    LoanRefinance: prisma.loanRefinance.count({ where: orgWhere }),
    LoanRestructure: prisma.loanRestructure.count({ where: orgWhere }),
    LoanWriteOff: prisma.loanWriteOff.count({ where: orgWhere }),
    RepaymentSchedule: prisma.repaymentSchedule.count({ where: loanOrgWhere }),
    LoanScheduleVersion: prisma.loanScheduleVersion.count({ where: loanOrgWhere }),
    Loan: prisma.loan.count({ where: memberOrgWhere }),
    JournalEntry: prisma.journalEntry.count({ where: orgWhere }),
    AccountingPeriod: prisma.accountingPeriod.count({ where: orgWhere }),
    ChartOfAccount: prisma.chartOfAccount.count({ where: orgWhere }),
    CashFlow: prisma.cashFlow.count({ where: branchOrgWhere }),
    FieldOfficerReconciliation: prisma.fieldOfficerReconciliation.count({ where: orgWhere }),
    FieldOfficerAssignment: prisma.fieldOfficerAssignment.count({ where: orgWhere }),
    ApprovalRule: prisma.approvalRule.count({ where: orgWhere }),
    Group: prisma.group.count({ where: orgWhere }),
    Member: prisma.member.count({ where: orgWhere }),
    Centre: prisma.centre.count({ where: branchOrgWhere }), // Centre is scoped by branch
    LoanProduct: prisma.loanProduct.count({ where: orgWhere }),
    SavingsProduct: prisma.savingsProduct.count({ where: orgWhere }),
    AuditLog: prisma.auditLog.count({ where: orgWhere }),
    PaymentClaim: prisma.paymentClaim.count({ where: { subscription: { organizationId } } }),
    Subscription: prisma.subscription.count({ where: orgWhere }),
    User: prisma.user.count({ where: orgWhere }),
    Branch: prisma.branch.count({ where: orgWhere }),
    Organization: prisma.organization.count({ where: { id: organizationId } }),
  }

  // Resolve all counts
  const resolvedCountsEntries = await Promise.all(
    Object.entries(countPromises).map(async ([k, p]) => [k, await p] as const)
  )
  const rowCounts = Object.fromEntries(resolvedCountsEntries)

  if (opts.dryRun) {
    return { dryRun: true, rowCounts, storageFiles: paths.length }
  }

  // Delete S3 storage files in batches of 1000
  if (paths.length > 0) {
    const { S3Client, DeleteObjectsCommand } = await import("@aws-sdk/client-s3")
    const s3 = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      forcePathStyle: true,
    })
    
    for (let i = 0; i < paths.length; i += 1000) {
      const batch = paths.slice(i, i + 1000).map(Key => ({ Key }))
      try {
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: "documents",
            Delete: { Objects: batch },
          })
        )
      } catch (error: any) {
        throw new Error("Failed to delete storage files: " + error.message)
      }
    }
  }

  // Execute database deletions inside a transaction
  await prisma.$transaction(
    async (tx) => {
      // Leaves
      await tx.documentVerification.deleteMany({ where: documentOrgWhere })
      await tx.writeOffRecovery.deleteMany({ where: writeOffOrgWhere })
      await tx.paymentAllocation.deleteMany({ where: { payment: { organizationId } } })
      await tx.paymentReversal.deleteMany({ where: orgWhere })
      await tx.journalLine.deleteMany({ where: journalOrgWhere })
      await tx.savingsTransaction.deleteMany({ where: orgWhere })
      await tx.savingsAccount.deleteMany({ where: orgWhere })
      await tx.notificationLog.deleteMany({ where: orgWhere })
      await tx.userNotificationPreference.deleteMany({ where: orgWhere })
      await tx.collectionAttempt.deleteMany({ where: orgWhere })
      await tx.creditAssessment.deleteMany({ where: orgWhere })
      await tx.riskAlert.deleteMany({ where: orgWhere })
      await tx.groupMembership.deleteMany({ where: { group: { organizationId } } })
      await tx.guarantor.deleteMany({ where: loanOrgWhere })
      await tx.financialProfile.deleteMany({ where: orgWhere })

      // Repayments (self-referencing reversalOfId)
      await tx.loanRepayment.deleteMany({ where: { organizationId, reversalOfId: { not: null } } })
      await tx.loanRepayment.deleteMany({ where: orgWhere })

      await tx.memberDocument.deleteMany({ where: orgWhere })
      await tx.loanRefinance.deleteMany({ where: orgWhere })
      await tx.loanRestructure.deleteMany({ where: orgWhere })
      await tx.loanWriteOff.deleteMany({ where: orgWhere })

      // Schedule and its versions
      await tx.repaymentSchedule.deleteMany({ where: loanOrgWhere })
      await tx.loanScheduleVersion.deleteMany({ where: loanOrgWhere })

      // Loan and its dependencies
      await tx.loan.deleteMany({ where: memberOrgWhere })

      // Core Accounting
      await tx.journalEntry.deleteMany({ where: orgWhere })
      await tx.accountingPeriod.deleteMany({ where: orgWhere })
      await tx.chartOfAccount.deleteMany({ where: orgWhere })

      // Branch-dependent records
      await tx.cashFlow.deleteMany({ where: branchOrgWhere })
      await tx.fieldOfficerReconciliation.deleteMany({ where: orgWhere })
      await tx.fieldOfficerAssignment.deleteMany({ where: orgWhere })
      await tx.approvalRule.deleteMany({ where: orgWhere })

      // Group and Member hierarchy
      await tx.group.deleteMany({ where: orgWhere })
      await tx.member.deleteMany({ where: orgWhere })
      await tx.centre.deleteMany({ where: branchOrgWhere })

      // Products
      await tx.loanProduct.deleteMany({ where: orgWhere })
      await tx.savingsProduct.deleteMany({ where: orgWhere })

      // Audit and Subscription
      await tx.auditLog.deleteMany({ where: orgWhere })
      await tx.paymentClaim.deleteMany({ where: { subscription: { organizationId } } })
      await tx.subscription.deleteMany({ where: orgWhere })

      // Base Entities
      await tx.user.deleteMany({ where: orgWhere }) // cascades to Account, Session
      await tx.branch.deleteMany({ where: orgWhere })
      await tx.organization.delete({ where: { id: organizationId } })
    },
    { timeout: 60000, maxWait: 10000 }
  )

  // Write tombstone
  await prisma.dataPurgeRecord.create({
    data: {
      organizationId,
      organizationName: org.name,
      reason: opts.reason,
      triggeredBy: opts.triggeredBy,
      rowCounts,
      storageFilesDeleted: paths.length,
    },
  })

  return { dryRun: false, rowCounts, storageFiles: paths.length }
}
