# Milestone 10: Field Officer Portal

## Goal Description

Provide a purpose-built, mobile-first web workflow for Field Officers at `/app/field`. The portal enables rapid one-tap cash collection, offline-ready transaction idempotency, missed payment tracking via collection attempts, and strict end-of-day cash reconciliation.

The architecture ensures the field portal acts strictly as a UI/workflow layer that interfaces with the core financial domain.

---

## Proposed Changes

### 1. Database Schema

#### [MODIFY] [schema.prisma](file:///f:/Personal/micro-credit/prisma/schema.prisma)

**Modify Model `LoanRepayment`:**
- Add `organizationId String` (for strict multi-tenant queries and constraint).
- Add `clientTransactionId String?`
- Add constraint: `@@unique([organizationId, clientTransactionId])`
- *(Run a data migration or set a default for existing rows if necessary, though this is a greenfield-ish state).*

**New Enum `CollectionOutcome` and `MissedReason`:**
```prisma
enum CollectionOutcome { PAID PARTIAL MISSED }
enum MissedReason { NO_CASH MEMBER_UNAVAILABLE REFUSED BUSINESS_CLOSED TRAVELING OTHER }
```

**New Model `CollectionAttempt`:**
Tracks the reality of the field visit without prematurely failing the financial schedule.
```prisma
model CollectionAttempt {
  id              String            @id @default(cuid())
  organizationId  String
  scheduleId      String
  officerId       String
  attemptedAt     DateTime          @default(now())
  outcome         CollectionOutcome
  reason          MissedReason?
  notes           String?
  amountCollected Decimal?          @db.Decimal(10, 2)
  clientTxId      String?           // For idempotency of the attempt itself

  organization    Organization      @relation(fields: [organizationId], references: [id])
  schedule        RepaymentSchedule @relation(fields: [scheduleId], references: [id])
  officer         User              @relation(fields: [officerId], references: [id])

  @@index([organizationId, officerId, attemptedAt])
  @@index([scheduleId])
}
```

**New Model `FieldOfficerAssignment`:**
Explicitly models who collects where, enabling historical tracking and strict auth.
```prisma
model FieldOfficerAssignment {
  id             String       @id @default(cuid())
  organizationId String
  branchId       String
  officerId      String
  centreId       String
  startDate      DateTime     @db.Date
  endDate        DateTime?    @db.Date
  isActive       Boolean      @default(true)
  createdAt      DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])
  branch         Branch       @relation(fields: [branchId], references: [id])
  officer        User         @relation(fields: [officerId], references: [id])
  centre         Centre       @relation(fields: [centreId], references: [id])

  @@unique([officerId, centreId, isActive])
  @@index([organizationId])
}
```

**New Model `FieldOfficerReconciliation`:**
```prisma
model FieldOfficerReconciliation {
  id               String   @id @default(cuid())
  organizationId   String
  branchId         String
  officerId        String
  date             DateTime @db.Date
  
  expectedCash     Decimal  @db.Decimal(14,2)
  declaredCash     Decimal  @db.Decimal(14,2)
  expectedBank     Decimal  @db.Decimal(14,2)
  declaredBank     Decimal  @db.Decimal(14,2)
  difference       Decimal  @db.Decimal(14,2)
  
  status           String   @default("SUBMITTED") // SUBMITTED, VERIFIED, DISPUTED
  createdAt        DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id])
  officer      User         @relation(fields: [officerId], references: [id])
  branch       Branch       @relation(fields: [branchId], references: [id])

  @@unique([officerId, date])
  @@index([organizationId, date])
}
```

---

### 2. Timezone & Authorization Strategy
- **Timezone**: All `date` boundaries (e.g., "today") will be calculated using `Asia/Colombo` (or the configured org timezone). 
- **Authorization**: API endpoints must resolve: `Session -> Organization -> FieldOfficerAssignment -> Centre -> Member -> Loan -> Schedule`. No blind acceptance of arbitrary `loanId`s.

---

### 3. API Routes

#### [NEW] `/api/field/dashboard` (GET)
- Uses DB `aggregate`/`groupBy` to efficiently sum today's expected and collected amounts for the assigned centres.

#### [NEW] `/api/field/centres` (GET)
- Returns centres from `FieldOfficerAssignment` where `isActive == true`.

#### [NEW] `/api/field/centres/[id]/collection-sheet` (GET)
- Returns members + loans + schedules due today.

#### [NEW] `/api/field/collect` (POST)
- Body: `{ loanId, scheduleId, amount, method, clientTransactionId, notes? }`
- **Idempotency & Transaction Boundary**:
  ```ts
  BEGIN TRANSACTION
    1. Check unique `[organizationId, clientTransactionId]` on LoanRepayment (returns existing if found).
    2. Validate Officer Assignment -> Centre -> Member -> Loan.
    3. create LoanRepayment.
    4. call core allocatePayment() logic.
    5. create CollectionAttempt (outcome: PAID/PARTIAL).
  COMMIT
  ```

#### [NEW] `/api/field/missed` (POST)
- Body: `{ scheduleId, reason, notes, clientTransactionId? }`
- Creates a `CollectionAttempt` (outcome: `MISSED`). Leaves `RepaymentSchedule` as `PENDING`.

#### [NEW] `/api/field/reconcile` (POST)
- Body: `{ declaredCash, declaredBank, date }`
- **Server Calculation**: The server queries all `LoanRepayment`s for that officer + date to compute `expectedCash` and `expectedBank`.
- Creates `FieldOfficerReconciliation`.

#### [NEW] `/api/field/history` (GET)
- Returns paginated `CollectionAttempt` and `LoanRepayment` records for the officer's assigned scopes.

---

### 4. UI: Mobile-First Layout

#### [NEW] `app/app/field/layout.tsx`
- Bypasses desktop shell. Max-width container, bottom nav (Home, Centres, History).
- Includes an **Online/Offline Status Indicator** (🟢 Online / 🔴 Offline - "Payments will be available when connection returns").

#### [NEW] `app/app/field/page.tsx` (Dashboard)
- Progress bar, collected vs expected, reconciliation entry point.

#### [NEW] `app/app/field/centres/[id]/page.tsx` (Daily Collection Sheet)
- Bottom drawer pattern for rapid 2-tap collections (Default exact amount -> Confirm). 
- Options for Partial and Missed (with structured reason select).

#### [NEW] `app/app/field/receipt/[repaymentId]/page.tsx`
- Professional receipt display: Receipt No (server ID), Member, Loan, Instalment, Amount, Method, DateTime, Officer, Remaining Balance.

---

## Verification Plan
1. **Idempotency & Concurrency**: Send the exact same `collect` POST request *concurrently* (using `Promise.all`). Ensure the DB unique constraint safely processes one and returns the existing record for the other, preventing double allocation.
2. **Authorization**: Attempt to POST a collection for a `loanId` outside the officer's active `FieldOfficerAssignment`. Expect 403 Forbidden.
3. **Missed Payment**: Verify marking as missed creates a `CollectionAttempt` but leaves the financial schedule outstanding.
4. **Reconciliation**: Submit reconciliation with malicious `expectedCash` payload; verify the server ignores it and strictly calculates expected cash from DB records.
