-- AlterTable
ALTER TABLE "LoanProduct" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "multiplier" DECIMAL(10,4) NOT NULL DEFAULT 1.17;
