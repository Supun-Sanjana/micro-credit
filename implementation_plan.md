# Milestone 7: Automation (Notifications)

This plan covers the implementation of Phase 16 (Notifications) to introduce an event-driven notification layer for the Solida MFI platform.

## Goal Description
Introduce a decoupled, event-driven notification layer to handle automated alerts for loan and payment lifecycles. We will implement channels for In-App and Email (using Resend, which is already installed). SMS and WhatsApp will be structured as providers in the service layer, ready for integration when API keys are available.

## User Review Required
> [!IMPORTANT]
> **Messaging Providers**: The plan assumes we will use Resend for emails. For SMS and WhatsApp, we will build the provider interfaces but leave them as mock/logger implementations until you provide the specific vendor details (e.g., Twilio, messagebird). Is this acceptable for now?

## Proposed Changes

### 1. Database Schema (`prisma/schema.prisma`)
We will introduce models to store notifications, domain events, and notification preferences.

#### [MODIFY] [schema.prisma](file:///f:/Personal/micro-credit/prisma/schema.prisma)
- **Add Enums**: `NotificationChannel` (IN_APP, EMAIL, SMS, WHATSAPP), `NotificationStatus` (PENDING, SENT, FAILED, READ), `DomainEventType` (LOAN_APPROVED, LOAN_DISBURSED, PAYMENT_RECEIVED, PAYMENT_DUE, PAYMENT_OVERDUE, DOCUMENT_REJECTED, LOAN_SETTLED).
- **Add Model `Notification`**: Stores the notification instance, channel, status, recipient (`memberId` or `userId`), and content.
- **Add Model `NotificationPreference`**: Stores JSON configuration for which events should trigger which channels, configurable per organization and overrideable per user/member.

### 2. Domain Events Layer

#### [NEW] [lib/events/bus.ts](file:///f:/Personal/micro-credit/lib/events/bus.ts)
- A simple event dispatcher that intercepts domain events and routes them to the `NotificationService`.

#### [NEW] [lib/events/types.ts](file:///f:/Personal/micro-credit/lib/events/types.ts)
- Type definitions for all domain events and their payloads (e.g., `LoanApprovedEvent`, `PaymentReceivedEvent`).

### 3. Notification Service & Providers

#### [NEW] [lib/services/notification-service.ts](file:///f:/Personal/micro-credit/lib/services/notification-service.ts)
- Listens to domain events.
- Checks `NotificationPreference` to determine if a channel is enabled.
- Creates `Notification` records in the database with `PENDING` status.
- Dispatches to the appropriate provider (Email, SMS, etc.).
- Updates the `Notification` record to `SENT` or `FAILED`.

#### [NEW] [lib/services/providers/email-provider.ts](file:///f:/Personal/micro-credit/lib/services/providers/email-provider.ts)
- Implements email sending using the `resend` package.

#### [NEW] [lib/services/providers/sms-provider.ts](file:///f:/Personal/micro-credit/lib/services/providers/sms-provider.ts)
- Placeholder implementation for SMS (logs to console until vendor is selected).

### 4. Integration into Existing Workflows

#### [MODIFY] [lib/loan-lifecycle.ts](file:///f:/Personal/micro-credit/lib/loan-lifecycle.ts)
- Dispatch `LOAN_APPROVED`, `LOAN_DISBURSED`, `LOAN_SETTLED` events during state transitions instead of tight-coupling the notification logic.

#### [MODIFY] [app/actions/repayments.ts](file:///f:/Personal/micro-credit/app/actions/repayments.ts)
- Dispatch `PAYMENT_RECEIVED` event upon successful transaction commit.

### 5. User Interface

#### [NEW] [app/app/settings/notifications/page.tsx](file:///f:/Personal/micro-credit/app/app/settings/notifications/page.tsx)
- A settings page for Org Admins to configure global notification preferences (which events go to which channels).

#### [NEW] [components/notifications/notification-bell.tsx](file:///f:/Personal/micro-credit/components/notifications/notification-bell.tsx)
- A UI component for the dashboard header to display `IN_APP` notifications to users (officers, managers).

## Verification Plan

### Automated Tests
- Unit tests for `NotificationService` to ensure preferences are respected (e.g., if SMS is disabled, no SMS is sent).
- Integration tests ensuring `loan-lifecycle.ts` successfully dispatches domain events without failing the main transaction.

### Manual Verification
- Trigger a loan approval and verify an email is sent (if configured) and an In-App notification appears.
- Adjust preferences in the UI and verify the changes take effect for the next event.
