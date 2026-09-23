-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('LOAN_APPROVED', 'LOAN_DISBURSED', 'LOAN_SETTLED', 'PAYMENT_RECEIVED', 'PAYMENT_OVERDUE', 'DOCUMENT_REJECTED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "UserNotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventType" "NotificationEventType" NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "memberId" TEXT,
    "eventType" "NotificationEventType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "recipientEmail" TEXT,
    "subject" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserNotificationPreference_organizationId_idx" ON "UserNotificationPreference"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationPreference_userId_eventType_key" ON "UserNotificationPreference"("userId", "eventType");

-- CreateIndex
CREATE INDEX "NotificationLog_organizationId_eventType_idx" ON "NotificationLog"("organizationId", "eventType");

-- CreateIndex
CREATE INDEX "NotificationLog_organizationId_createdAt_idx" ON "NotificationLog"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserNotificationPreference" ADD CONSTRAINT "UserNotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
