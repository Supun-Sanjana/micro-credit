import { NotificationEventType } from '@prisma/client'

export type DomainEvent =
  | { type: 'LOAN_APPROVED';   payload: { loanId: string; memberId: string; organizationId: string; loanNumber?: string | null; amount: string } }
  | { type: 'LOAN_DISBURSED';  payload: { loanId: string; memberId: string; organizationId: string; loanNumber?: string | null; amount: string } }
  | { type: 'LOAN_SETTLED';    payload: { loanId: string; memberId: string; organizationId: string; loanNumber?: string | null } }
  | { type: 'PAYMENT_RECEIVED'; payload: { loanId: string; memberId: string; organizationId: string; amount: string; paidDate: string } }
  | { type: 'PAYMENT_OVERDUE'; payload: { loanId: string; memberId: string; organizationId: string; overdueAmount: string } }
  | { type: 'DOCUMENT_REJECTED'; payload: { memberId: string; organizationId: string; documentId: string; documentType: string; reason?: string } }
