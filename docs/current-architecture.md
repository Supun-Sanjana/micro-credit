# Current architecture baseline

Solida is a Next.js 14 App Router application backed by PostgreSQL and Prisma. Auth.js credentials sessions carry the user, organization, role, and optional branch context. `getScopedDal()` applies organization/branch filters; all financial routes must additionally verify ownership inside their transaction.

The hierarchy is Organization → Branch → Centre → Member. Loans use multiplier-based weekly terms from `lib/calc-engine.ts`; schedules and repayments drive collection, cash-flow, PAR, ageing, and collection-efficiency reports. Audit records are written through `lib/audit.ts`.

Milestone 1 adds Groups and append-only payment allocations/reversal requests. `Member.groupNumber` remains during the controlled migration. Existing repayments receive no inferred allocation; allocations are created only for new payments using the configured default waterfall. The database migration is additive and has not been applied by this change.

Known debt: some dashboard loan screens still consume `lib/mock-data.ts` rather than the live APIs; the existing role model is binary; reports currently consume aggregate repayment amounts and need reversal-aware refactoring before reversals are approved.

## Milestone 2 event model

`LoanRefinance` links a settled source loan to its successor and records the settlement and additional disbursement separately. `LoanScheduleVersion` and `LoanRestructure` preserve replacement schedules as immutable snapshots; prior schedule rows are marked superseded, not altered. `LoanWriteOff` and `WriteOffRecovery` retain write-off and later recovery events. The administrator-only endpoint is `POST /api/loans/:id/events` with `TOP_UP`, `RESTRUCTURE`, `WRITE_OFF`, or `RECOVERY` actions.

## Migration process

Back up the development database, review `prisma/migrations/20260922000000_milestone1_financial_foundation/migration.sql`, then run `npx prisma migrate deploy`, `npx prisma generate`, lint, tests, and build. Never run destructive migration commands against production data.
