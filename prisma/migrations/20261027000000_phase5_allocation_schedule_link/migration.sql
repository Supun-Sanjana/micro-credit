-- AlterTable
ALTER TABLE "PaymentAllocation" ADD COLUMN "scheduleId" TEXT;

-- CreateIndex
CREATE INDEX "PaymentAllocation_scheduleId_idx" ON "PaymentAllocation"("scheduleId");

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "RepaymentSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
