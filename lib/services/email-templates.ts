import { DomainEvent } from '../events/types'

export function getEmailTemplate(event: DomainEvent): { subject: string; html: string } {
  switch (event.type) {
    case 'LOAN_APPROVED':
      return {
        subject: 'Your loan has been approved',
        html: `<p>Your loan ${event.payload.loanNumber ? `(${event.payload.loanNumber}) ` : ''}for the amount of ${event.payload.amount} has been approved.</p>`,
      }
    case 'LOAN_DISBURSED':
      return {
        subject: 'Your loan has been disbursed',
        html: `<p>Your loan ${event.payload.loanNumber ? `(${event.payload.loanNumber}) ` : ''}for the amount of ${event.payload.amount} has been disbursed.</p>`,
      }
    case 'LOAN_SETTLED':
      return {
        subject: 'Your loan has been settled',
        html: `<p>Your loan ${event.payload.loanNumber ? `(${event.payload.loanNumber}) ` : ''}has been fully settled. Thank you!</p>`,
      }
    case 'PAYMENT_RECEIVED':
      return {
        subject: 'Payment received',
        html: `<p>We have received your payment of ${event.payload.amount} on ${event.payload.paidDate}.</p>`,
      }
    case 'PAYMENT_OVERDUE':
      return {
        subject: 'Payment overdue notice',
        html: `<p>Your payment is overdue by ${event.payload.overdueAmount}. Please make a payment as soon as possible.</p>`,
      }
    case 'DOCUMENT_REJECTED':
      return {
        subject: 'Document rejected',
        html: `<p>Your document (${event.payload.documentType}) has been rejected. ${event.payload.reason ? `Reason: ${event.payload.reason}` : ''}</p>`,
      }
  }
}
