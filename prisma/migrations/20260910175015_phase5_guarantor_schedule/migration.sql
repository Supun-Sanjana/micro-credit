-- CreateTable
CREATE TABLE "Guarantor" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "memberId" TEXT,
    "name" TEXT,
    "nic" TEXT,
    "contact" TEXT,
    "relationship" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guarantor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepaymentSchedule" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "instalmentNumber" INTEGER NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "scheduledAmount" DECIMAL(10,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepaymentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Guarantor_loanId_idx" ON "Guarantor"("loanId");

-- CreateIndex
CREATE INDEX "Guarantor_memberId_idx" ON "Guarantor"("memberId");

-- CreateIndex
CREATE INDEX "RepaymentSchedule_loanId_idx" ON "RepaymentSchedule"("loanId");

-- CreateIndex
CREATE INDEX "RepaymentSchedule_scheduledDate_idx" ON "RepaymentSchedule"("scheduledDate");

-- AddForeignKey
ALTER TABLE "Guarantor" ADD CONSTRAINT "Guarantor_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guarantor" ADD CONSTRAINT "Guarantor_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepaymentSchedule" ADD CONSTRAINT "RepaymentSchedule_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
