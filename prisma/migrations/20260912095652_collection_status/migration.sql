-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('PENDING', 'DUE', 'PAID', 'PARTIALLY_PAID', 'MISSED', 'WAIVED');

-- AlterTable
ALTER TABLE "RepaymentSchedule" ADD COLUMN     "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "status" "ScheduleStatus" NOT NULL DEFAULT 'PENDING';
