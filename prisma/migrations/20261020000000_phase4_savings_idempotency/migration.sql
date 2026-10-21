-- CreateIndex
CREATE UNIQUE INDEX "SavingsTransaction_organizationId_reference_key" ON "SavingsTransaction"("organizationId", "reference");
