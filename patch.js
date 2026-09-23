const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf-8');

// Add to Organization
content = content.replace(/(model Organization \{[\s\S]*?)(\n\})/, '$1\n  loanRepayments          LoanRepayment[]\n  collectionAttempts      CollectionAttempt[]\n  fieldOfficerAssignments FieldOfficerAssignment[]\n  reconciliations         FieldOfficerReconciliation[]$2');

// Add to User
content = content.replace(/(model User \{[\s\S]*?)(\n  @@index)/, '$1\n  collectionAttempts      CollectionAttempt[]\n  fieldOfficerAssignments FieldOfficerAssignment[]\n  reconciliations         FieldOfficerReconciliation[]$2');

// Add to Branch
content = content.replace(/(model Branch \{[\s\S]*?)(\n\})/, '$1\n  fieldOfficerAssignments FieldOfficerAssignment[]\n  reconciliations         FieldOfficerReconciliation[]$2');

// Add to Centre
content = content.replace(/(model Centre \{[\s\S]*?)(\n  @@index)/, '$1\n  fieldOfficerAssignments FieldOfficerAssignment[]$2');

// Add to RepaymentSchedule
content = content.replace(/(model RepaymentSchedule \{[\s\S]*?)(\n  @@index)/, '$1\n  collectionAttempts      CollectionAttempt[]$2');

const newModels = `

enum CollectionOutcome {
  PAID
  PARTIAL
  MISSED
}

enum MissedReason {
  NO_CASH
  MEMBER_UNAVAILABLE
  REFUSED
  BUSINESS_CLOSED
  TRAVELING
  OTHER
}

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
  clientTxId      String?

  organization    Organization      @relation(fields: [organizationId], references: [id])
  schedule        RepaymentSchedule @relation(fields: [scheduleId], references: [id])
  officer         User              @relation(fields: [officerId], references: [id])

  @@index([organizationId, officerId, attemptedAt])
  @@index([scheduleId])
}

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
`;

fs.writeFileSync('prisma/schema.prisma', content + newModels);
