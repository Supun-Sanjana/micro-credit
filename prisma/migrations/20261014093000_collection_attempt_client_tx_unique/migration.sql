-- One field collection retry must not insert a second attempt for the same client transaction.
-- NULL clientTxId values stay allowed (Postgres unique indexes permit multiple nulls).
CREATE UNIQUE INDEX "CollectionAttempt_organizationId_clientTxId_key" ON "CollectionAttempt"("organizationId", "clientTxId");
