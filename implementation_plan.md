# Milestone 9: Document Handling (KYC & Financial Documents)

## Goal Description

Enable secure uploading, private storage, and structured verification of sensitive member documents (NIC photos, payslips, loan applications, etc.). 

This system uses a **Private** Supabase bucket, enforces strict tenant isolation, guarantees document immutability, and maintains a full verification history and audit trail.

---

## Proposed Changes

### 1. Database Schema

#### [MODIFY] [schema.prisma](file:///f:/Personal/micro-credit/prisma/schema.prisma)

**New Enums:**
- `DocumentStatus { PENDING VERIFIED REJECTED ARCHIVED }`
- Modify `MemberDocumentType`: add `LOAN_APPLICATION`

**Modify Model `MemberDocument`:**
Replace existing `url` and `sizeBytes` with strict metadata and status tracking.
```prisma
model MemberDocument {
  id              String             @id @default(cuid())
  organizationId  String
  memberId        String
  loanId          String?            // Future-proofing for LOAN_APPLICATION
  
  type            MemberDocumentType
  status          DocumentStatus     @default(PENDING)

  fileName        String
  storagePath     String
  mimeType        String
  fileSize        Int

  uploadedById    String
  uploadedAt      DateTime           @default(now())

  organization    Organization       @relation(fields: [organizationId], references: [id])
  member          Member             @relation(fields: [memberId], references: [id])
  loan            Loan?              @relation(fields: [loanId], references: [id])
  uploadedBy      User               @relation(fields: [uploadedById], references: [id])
  verifications   DocumentVerification[]

  @@index([organizationId, status])
  @@index([memberId])
  @@index([loanId])
}
```

**New Model `DocumentVerification`:**
Maintains the history of verification actions (Upload → Reject → Re-upload → Verify).
```prisma
model DocumentVerification {
  id             String         @id @default(cuid())
  documentId     String
  status         DocumentStatus // VERIFIED or REJECTED
  reason         String?
  verifiedById   String
  createdAt      DateTime       @default(now())

  document       MemberDocument @relation(fields: [documentId], references: [id])
  verifiedBy     User           @relation(fields: [verifiedById], references: [id])

  @@index([documentId])
}
```

---

### 2. Event Types & Notifications

#### [MODIFY] `lib/events/types.ts`
Update `DOCUMENT_REJECTED` payload to include `documentId`:
```ts
| { type: 'DOCUMENT_REJECTED'; payload: { memberId: string; organizationId: string; documentId: string; documentType: string; reason?: string } }
```

---

### 3. Storage Layer

#### [NEW] [lib/storage.ts](file:///f:/Personal/micro-credit/lib/storage.ts)
Wrapper around the existing `lib/supabase.ts`.
- **Bucket**: `member-documents` (Must be **PRIVATE**)
- **Path**: `${organizationId}/${memberId}/${crypto.randomUUID()}`
- **Security**: 
  - Restrict MIME types (`image/jpeg`, `image/png`, `application/pdf`)
  - Size limits: Images 5MB, PDF 10MB
- **Functions**:
  - `uploadDocument(file: File, orgId, memberId)`: returns `storagePath` and metadata.
  - `generateSignedUrl(storagePath: string)`: returns a short-lived (5-minute) signed URL using `supabase.storage.from('member-documents').createSignedUrl(path, 300)`.

---

### 4. API Routes

**Tenant Safety Rule:** Always resolve `organizationId` from `getScopedDal()`. Never trust the client's `organizationId`.

#### [NEW] `app/api/members/[id]/documents/route.ts`
- **POST**: 
  - Validate file extension/MIME/size.
  - Upload via `lib/storage.ts`.
  - Create `MemberDocument` (status `PENDING`).
  - Log `DOCUMENT_UPLOADED` in `AuditLog`.
- **GET**: 
  - Returns document metadata only (no signed URLs).

#### [NEW] `app/api/documents/[id]/view/route.ts`
- **GET**:
  - Checks if user has permission to view.
  - Generates signed URL via `lib/storage.ts`.
  - Logs `DOCUMENT_VIEWED` in `AuditLog`.
  - Redirects to or returns the signed URL.

#### [NEW] `app/api/documents/[id]/verify/route.ts`
- **PATCH**: 
  - Restricts to `BRANCH_MANAGER+`.
  - State machine check: Cannot change if already `VERIFIED`.
  - **Prisma Transaction**:
    1. Update `MemberDocument.status`.
    2. Create `DocumentVerification` record.
    3. Log `DOCUMENT_VERIFIED` or `DOCUMENT_REJECTED` in `AuditLog`.
  - Post-Transaction: Dispatch `DOCUMENT_REJECTED` notification if applicable.

#### [NEW] `app/api/documents/route.ts`
- **GET**:
  - Returns paginated documents for the Verification Dashboard.
  - Supports filters: `branchId`, `type`, `status`, `date`.

---

### 5. UI Components & Pages

#### [MODIFY] `app/app/(dashboard)/members/[id]/page.tsx`
- Add a "Documents" tab.
- Show existing documents (metadata + status badge).
- "View" button calls `/api/documents/[id]/view` (opens in new tab/modal).
- File upload zone: creates *new* document records (immutable history).

#### [NEW] `app/app/(dashboard)/documents/page.tsx`
- **Verification Dashboard**: For `BRANCH_MANAGER+`.
- Filter bar (Branch, Document Type, Status, Date).
- Table columns: Member, Document Type, Branch, Uploaded Date, Status, Actions.
- Review Modal:
  - Fetches the signed URL to preview.
  - Action buttons: "Verify", "Reject" (prompts for reason).

#### [MODIFY] `components/dashboard-shell.tsx`
- Add "Document Verification" link under Operations.

---

## Security & Architectural Constraints
1. **Private Bucket**: Public storage is NOT supported. All access passes through authenticated API with short-lived signed URLs.
2. **Immutability**: Rejected documents are NOT overwritten. A new upload creates a new `MemberDocument` record.
3. **Transactions**: The verification API must wrap state updates and audit logs in a single Prisma transaction. Notification dispatch happens *after* successful commit.
