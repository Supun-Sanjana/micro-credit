/*
  Warnings:

  - The values [ADMIN,USER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[organizationId,code]` on the table `Branch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[branchId,centreCode]` on the table `Centre` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[loanId,instalmentNumber,paidDate]` on the table `LoanRepayment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,clientTransactionId]` on the table `LoanRepayment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `LoanRepayment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'EXPORT');

-- CreateEnum
CREATE TYPE "SavingsType" AS ENUM ('COMPULSORY', 'VOLUNTARY');

-- CreateEnum
CREATE TYPE "SavingsStatus" AS ENUM ('ACTIVE', 'DORMANT', 'CLOSED');

-- CreateEnum
CREATE TYPE "SavingsTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'INTEREST_POSTING', 'FEE_DEDUCTION');

-- CreateEnum
CREATE TYPE "CollectionOutcome" AS ENUM ('PAID', 'PARTIAL', 'MISSED');

-- CreateEnum
CREATE TYPE "MissedReason" AS ENUM ('NO_CASH', 'MEMBER_UNAVAILABLE', 'REFUSED', 'BUSINESS_CLOSED', 'TRAVELING', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SYSTEM_ADMIN', 'HEAD_OFFICE', 'ACCOUNTANT', 'BRANCH_MANAGER', 'FIELD_OFFICER');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'FIELD_OFFICER';
COMMIT;

-- DropIndex
DROP INDEX "Branch_code_key";

-- DropIndex
DROP INDEX "Centre_centreCode_key";

-- AlterTable
ALTER TABLE "Centre" ADD COLUMN     "officerId" TEXT;

-- AlterTable
ALTER TABLE "ChartOfAccount" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "collectionRule" TEXT,
ADD COLUMN     "gracePeriodDays" INTEGER;

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "gracePeriodDays" INTEGER;

-- AlterTable
ALTER TABLE "LoanRepayment" ADD COLUMN     "clientTransactionId" TEXT,
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "role" SET DEFAULT 'FIELD_OFFICER';

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "note" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "SavingsType" NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "minimumBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsAccount" (
    "id" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "savingsProductId" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "SavingsStatus" NOT NULL DEFAULT 'ACTIVE',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsTransaction" (
    "id" TEXT NOT NULL,
    "savingsAccountId" TEXT NOT NULL,
    "type" "SavingsTransactionType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavingsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionAttempt" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" "CollectionOutcome" NOT NULL,
    "reason" "MissedReason",
    "notes" TEXT,
    "amountCollected" DECIMAL(10,2),
    "clientTxId" TEXT,

    CONSTRAINT "CollectionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldOfficerAssignment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldOfficerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldOfficerReconciliation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "expectedCash" DECIMAL(14,2) NOT NULL,
    "declaredCash" DECIMAL(14,2) NOT NULL,
    "expectedBank" DECIMAL(14,2) NOT NULL,
    "declaredBank" DECIMAL(14,2) NOT NULL,
    "difference" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldOfficerReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "minAmount" DECIMAL(12,2) NOT NULL,
    "maxAmount" DECIMAL(12,2) NOT NULL,
    "requiredRole" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldCheckIn" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataPurgeRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "rowCounts" JSONB,
    "storageFilesDeleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataPurgeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_entityType_entityId_idx" ON "AuditLog"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavingsProduct_organizationId_code_key" ON "SavingsProduct"("organizationId", "code");

-- CreateIndex
CREATE INDEX "SavingsAccount_memberId_idx" ON "SavingsAccount"("memberId");

-- CreateIndex
CREATE INDEX "SavingsAccount_savingsProductId_idx" ON "SavingsAccount"("savingsProductId");

-- CreateIndex
CREATE UNIQUE INDEX "SavingsAccount_organizationId_accountNumber_key" ON "SavingsAccount"("organizationId", "accountNumber");

-- CreateIndex
CREATE INDEX "SavingsTransaction_savingsAccountId_idx" ON "SavingsTransaction"("savingsAccountId");

-- CreateIndex
CREATE INDEX "SavingsTransaction_date_idx" ON "SavingsTransaction"("date");

-- CreateIndex
CREATE INDEX "CollectionAttempt_organizationId_officerId_attemptedAt_idx" ON "CollectionAttempt"("organizationId", "officerId", "attemptedAt");

-- CreateIndex
CREATE INDEX "CollectionAttempt_scheduleId_idx" ON "CollectionAttempt"("scheduleId");

-- CreateIndex
CREATE INDEX "FieldOfficerAssignment_organizationId_idx" ON "FieldOfficerAssignment"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "FieldOfficerAssignment_officerId_centreId_isActive_key" ON "FieldOfficerAssignment"("officerId", "centreId", "isActive");

-- CreateIndex
CREATE INDEX "FieldOfficerReconciliation_organizationId_date_idx" ON "FieldOfficerReconciliation"("organizationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "FieldOfficerReconciliation_officerId_date_key" ON "FieldOfficerReconciliation"("officerId", "date");

-- CreateIndex
CREATE INDEX "ApprovalRule_organizationId_idx" ON "ApprovalRule"("organizationId");

-- CreateIndex
CREATE INDEX "FieldCheckIn_organizationId_idx" ON "FieldCheckIn"("organizationId");

-- CreateIndex
CREATE INDEX "FieldCheckIn_officerId_idx" ON "FieldCheckIn"("officerId");

-- CreateIndex
CREATE INDEX "FieldCheckIn_centreId_idx" ON "FieldCheckIn"("centreId");

-- CreateIndex
CREATE INDEX "FieldCheckIn_timestamp_idx" ON "FieldCheckIn"("timestamp");

-- CreateIndex
CREATE INDEX "DataPurgeRecord_organizationId_idx" ON "DataPurgeRecord"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_organizationId_code_key" ON "Branch"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Centre_officerId_idx" ON "Centre"("officerId");

-- CreateIndex
CREATE UNIQUE INDEX "Centre_branchId_centreCode_key" ON "Centre"("branchId", "centreCode");

-- CreateIndex
CREATE UNIQUE INDEX "LoanRepayment_loanId_instalmentNumber_paidDate_key" ON "LoanRepayment"("loanId", "instalmentNumber", "paidDate");

-- CreateIndex
CREATE UNIQUE INDEX "LoanRepayment_organizationId_clientTransactionId_key" ON "LoanRepayment"("organizationId", "clientTransactionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Centre" ADD CONSTRAINT "Centre_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccount" ADD CONSTRAINT "ChartOfAccount_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsAccount" ADD CONSTRAINT "SavingsAccount_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsAccount" ADD CONSTRAINT "SavingsAccount_savingsProductId_fkey" FOREIGN KEY ("savingsProductId") REFERENCES "SavingsProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsTransaction" ADD CONSTRAINT "SavingsTransaction_savingsAccountId_fkey" FOREIGN KEY ("savingsAccountId") REFERENCES "SavingsAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionAttempt" ADD CONSTRAINT "CollectionAttempt_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionAttempt" ADD CONSTRAINT "CollectionAttempt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionAttempt" ADD CONSTRAINT "CollectionAttempt_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "RepaymentSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOfficerAssignment" ADD CONSTRAINT "FieldOfficerAssignment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOfficerAssignment" ADD CONSTRAINT "FieldOfficerAssignment_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOfficerAssignment" ADD CONSTRAINT "FieldOfficerAssignment_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOfficerAssignment" ADD CONSTRAINT "FieldOfficerAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOfficerReconciliation" ADD CONSTRAINT "FieldOfficerReconciliation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOfficerReconciliation" ADD CONSTRAINT "FieldOfficerReconciliation_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOfficerReconciliation" ADD CONSTRAINT "FieldOfficerReconciliation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRule" ADD CONSTRAINT "ApprovalRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldCheckIn" ADD CONSTRAINT "FieldCheckIn_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldCheckIn" ADD CONSTRAINT "FieldCheckIn_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldCheckIn" ADD CONSTRAINT "FieldCheckIn_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
