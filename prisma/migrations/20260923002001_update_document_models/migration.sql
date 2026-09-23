-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "MemberDocumentType" ADD VALUE 'LOAN_APPLICATION';

-- DropIndex
DROP INDEX "MemberDocument_organizationId_idx";

-- AlterTable
ALTER TABLE "MemberDocument" DROP COLUMN "sizeBytes",
DROP COLUMN "url",
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "fileSize" INTEGER NOT NULL,
ADD COLUMN     "loanId" TEXT,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "storagePath" TEXT NOT NULL,
ADD COLUMN     "uploadedById" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "DocumentVerification" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL,
    "reason" TEXT,
    "verifiedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentVerification_documentId_idx" ON "DocumentVerification"("documentId");

-- CreateIndex
CREATE INDEX "MemberDocument_organizationId_status_idx" ON "MemberDocument"("organizationId", "status");

-- CreateIndex
CREATE INDEX "MemberDocument_loanId_idx" ON "MemberDocument"("loanId");

-- AddForeignKey
ALTER TABLE "MemberDocument" ADD CONSTRAINT "MemberDocument_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberDocument" ADD CONSTRAINT "MemberDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "MemberDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

