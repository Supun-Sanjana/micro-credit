# Milestone 8: Intelligence — Underwriting + Risk Engine

## Goal

Build a genuine underwriting and risk engine for Solida. This is not a simple PAR flag. It is a structured, auditable, extensible system that:

1. Collects income/obligation data via a `FinancialProfile` model (time-stamped, not on Member)
2. Scores a member using repayment history + exposure + income + obligations
3. Outputs human-readable factors alongside the numeric score
4. Runs a nightly risk batch via a dedicated `/api/cron/risk` endpoint
5. Surfaces all anomalies as idempotent `RiskAlert` records
6. Notifies relevant users of new HIGH/CRITICAL alerts

---

## Architecture

```
Loan Application
       │
       ▼
FinancialProfile (income, obligations, household, source)
       │
       ├── RepaymentHistory (from existing LoanRepayment)
       ├── CurrentExposure  (from outstanding Loans)
       ├── PreviousLoans    (settled/defaulted)
       └── Income + Obligations
       │
       ▼
CreditScoringEngine (pure function, deterministic)
       │
       ▼
CreditScore { score, grade, factors[], inputs{} }
       │
       ▼
CreditAssessment (persisted, immutable snapshot)

─────────────────────────────────────

Nightly Cron (/api/cron/risk)
       │
       ▼
RiskBatchService
       ├── checkHighPAR()
       ├── checkExcessiveExposure()
       ├── checkRepeatDefault()
       ├── checkDebtToIncome()
       └── checkSuspiciousActivity()
       │
       ▼
RiskAlert (idempotent, one open alert per entity+type)
       │
       ▼
dispatchNotification (PAYMENT_OVERDUE reused)
```

---

## Schema Changes (prisma/schema.prisma)

### New Enums
```prisma
enum RiskGrade { A B C D }

enum RiskAlertType {
  DUPLICATE_NIC
  DUPLICATE_PHONE
  DUPLICATE_PAYMENT
  REPEATED_REVERSALS
  HIGH_PAR
  EXCESSIVE_EXPOSURE
  DEBT_TO_INCOME
  REPEAT_DEFAULT
  SUSPICIOUS_ACTIVITY
}

enum RiskAlertSeverity { LOW MEDIUM HIGH CRITICAL }
enum RiskAlertStatus   { OPEN ACKNOWLEDGED RESOLVED DISMISSED }
enum IncomeSource      { EMPLOYMENT SELF_EMPLOYED AGRICULTURE BUSINESS OTHER }
```

### New Models

```prisma
// Time-stamped financial profile — NOT on Member directly.
// A new assessment is created each time a loan application is reviewed.
model FinancialProfile {
  id                  String        @id @default(cuid())
  organizationId      String
  memberId            String
  assessmentDate      DateTime      @db.Date
  monthlyIncome       Decimal       @db.Decimal(14, 2)
  householdIncome     Decimal?      @db.Decimal(14, 2)
  existingObligations Decimal       @default(0) @db.Decimal(14, 2)
  incomeSource        IncomeSource  @default(EMPLOYMENT)
  verificationStatus  VerificationStatus @default(PENDING)
  verifiedById        String?
  verifiedAt          DateTime?
  notes               String?
  createdById         String
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  member            Member          @relation(fields: [memberId], references: [id])
  creditAssessments CreditAssessment[]

  @@index([organizationId, memberId])
  @@index([memberId, assessmentDate])
}

// Immutable snapshot of a credit assessment.
// New record each time scoring is run. Never mutated.
model CreditAssessment {
  id                  String      @id @default(cuid())
  organizationId      String
  memberId            String
  financialProfileId  String?
  loanId              String?
  score               Int         // 0-100
  grade               RiskGrade
  // Human-readable factor list stored as JSON array of strings
  factors             Json
  // Full inputs snapshot for full auditability
  inputs              Json
  // Key computed inputs for quick queries
  totalLoans          Int         @default(0)
  activeLoans         Int         @default(0)
  settledLoans        Int         @default(0)
  defaultedLoans      Int         @default(0)
  repaymentRate       Decimal?    @db.Decimal(5, 2)
  averageDaysLate     Decimal?    @db.Decimal(5, 2)
  currentOutstanding  Decimal?    @db.Decimal(14, 2)
  debtToIncomeRatio   Decimal?    @db.Decimal(5, 2)
  createdById         String
  createdAt           DateTime    @default(now())

  member          Member           @relation(fields: [memberId], references: [id])
  financialProfile FinancialProfile? @relation(fields: [financialProfileId], references: [id])

  @@index([organizationId, memberId])
  @@index([memberId, createdAt])
}

// Idempotent risk alert — only one OPEN alert per (organizationId, entityId, type).
model RiskAlert {
  id             String            @id @default(cuid())
  organizationId String
  type           RiskAlertType
  severity       RiskAlertSeverity
  entityType     String            // "Member" | "Loan" | "LoanRepayment"
  entityId       String
  description    String
  status         RiskAlertStatus   @default(OPEN)
  assignedToId   String?
  resolvedById   String?
  resolvedAt     DateTime?
  resolutionNote String?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  @@unique([organizationId, entityId, type, status])  // idempotency
  @@index([organizationId, status])
  @@index([organizationId, severity])
  @@index([organizationId, createdAt])
}
```

Also add to `Member`:
```prisma
  financialProfiles  FinancialProfile[]
  creditAssessments  CreditAssessment[]
```

---

## Service Layer

### `lib/intelligence/credit-engine.ts`
Pure function. No DB calls. Receives pre-fetched data, returns score.

**Scoring rubric:**

| Factor | Max pts | Rule |
|--------|---------|------|
| Repayment rate | 35 | `settled paid / settled receivable` |
| PAR status | 25 | -25 if any active loan is overdue >30 days |
| Loan history | 15 | +5 per settled loan, capped at 3 |
| Default penalty | -30 | -10 per defaulted/written-off loan |
| Debt-to-income | 15 | 0 DTI=100%, scales down to 0 at DTI=80%+ |
| On-time streak | 10 | Last 5 payments on/before schedule |

Grade bands: A=75-100, B=50-74, C=25-49, D=0-24

**Factors output example:**
```json
[
  "+ Strong repayment history (94% on-time)",
  "+ 3 successfully settled loans",
  "- Current loan exposure is relatively high (DTI 62%)",
  "- Existing obligations reduce available income"
]
```

### `lib/intelligence/risk-batch-service.ts`
Runs all risk checks for an org. Each check is idempotent.

```ts
export async function runRiskBatch(organizationId: string): Promise<{
  alertsCreated: number
  alertsSkipped: number  // already open
  checks: string[]
}>
```

Checks:
- `checkHighPAR(org)` — PAR30+ loans → MEDIUM alert on Member
- `checkExcessiveExposure(org)` — member with >3 active loans → HIGH
- `checkRepeatDefault(org)` — 2+ defaults → HIGH alert on Member
- `checkDebtToIncome(org)` — DTI >80% on latest FinancialProfile → MEDIUM
- `checkSuspiciousActivity(org)` — >2 reversals in 30 days on same loan → HIGH

### `lib/intelligence/anomaly-detector.ts`
Point-in-time checks triggered during normal workflows:
- `checkDuplicateNIC(nic, orgId, excludeMemberId?)` → CRITICAL alert
- `checkDuplicatePhone(phone, orgId, excludeMemberId?)` → HIGH alert
- `checkDuplicatePayment(loanId, amount, date, orgId)` → CRITICAL alert

All functions are fire-and-forget safe (wrap in try/catch, never throw).

---

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/intelligence/credit-score` | POST | BRANCH_MANAGER+ | Run + store credit assessment for a member |
| `/api/intelligence/risk-alerts` | GET | BRANCH_MANAGER+ | List org risk alerts (filter by status/type/severity) |
| `/api/intelligence/risk-alerts/[id]` | PATCH | BRANCH_MANAGER+ | Acknowledge / resolve / dismiss alert |
| `/api/intelligence/financial-profile` | POST | BRANCH_MANAGER+ | Create a new financial profile for a member |
| `/api/intelligence/financial-profile/[memberId]` | GET | BRANCH_MANAGER+ | Get latest profile for a member |
| `/api/cron/risk` | POST | Bearer cron token | Nightly risk batch |
| `/api/risk/run-checks` | POST | SYSTEM_ADMIN | Manual trigger (same service as cron) |

---

## Integrations into Existing Code

| File | Change |
|------|--------|
| `app/api/members/route.ts` | After member create → `checkDuplicateNIC`, `checkDuplicatePhone` (void) |
| `app/api/members/[id]/route.ts` | After NIC/phone update → same checks |
| `app/api/repayments/route.ts` | After payment → `checkDuplicatePayment` (void) |
| `app/actions/reversals.ts` | After reversal approved → `checkSuspiciousActivity` (void) |
| `app/api/loans/route.ts` | After loan create → trigger credit assessment (void) |

---

## UI

### [NEW] `/app/risk` — Risk Alerts Dashboard
- Table of RiskAlerts with severity color badges (CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=grey)
- Filter by type, severity, status
- Acknowledge / Resolve / Dismiss inline
- Visible to BRANCH_MANAGER, HEAD_OFFICE, SYSTEM_ADMIN

### [MODIFY] `/app/loans/[id]` — Loan Detail Page
- New sidebar card: "Credit Assessment"
- Shows score (0-100), grade badge (A/B/C/D with color), and factor list

### [MODIFY] `components/dashboard-shell.tsx`
- Add "Risk" link under Operations (BRANCH_MANAGER+)

---

## Verification Plan

### Unit Tests (`lib/__tests__/credit-engine.test.ts`)
- Perfect member → grade A
- Member with 2 defaults → grade D
- Member with high DTI → factors include DTI warning
- Zero-history member → grade C (neutral)

### Unit Tests (`lib/__tests__/anomaly-detector.test.ts`)
- Duplicate NIC detected correctly
- Idempotency: second call with same entity does NOT create a second OPEN alert

### E2E Tests (Playwright)
- Risk alerts page loads
- FIELD_OFFICER cannot access /app/risk (redirect)
- Acknowledge alert → status changes in UI

---

## Idempotency Rule

`RiskAlert` has a `@@unique([organizationId, entityId, type, status])` constraint with `status = OPEN`.

Before creating a new alert, always check:
```ts
const existing = await prisma.riskAlert.findFirst({
  where: { organizationId, entityId, type, status: 'OPEN' }
})
if (existing) return  // skip, already flagged
```
