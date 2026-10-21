-- Permit multiple legitimate partial repayments against the same loan and
-- instalment on one calendar date. Retries are identified by the tenant-scoped
-- client transaction key below, not by a financial date tuple.
DROP INDEX "LoanRepayment_loanId_instalmentNumber_paidDate_key";

-- New idempotent payments retain a canonical, financially material payload
-- fingerprint. It is nullable to preserve historical repayment records
-- without rewriting or reinterpreting them.
ALTER TABLE "LoanRepayment" ADD COLUMN "idempotencyFingerprint" TEXT;
