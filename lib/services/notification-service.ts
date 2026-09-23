import prisma from '@/lib/prisma'
import { DomainEvent } from '../events/types'
import { getEmailTemplate } from './email-templates'
import { sendEmail } from './providers/email-provider'
import { NotificationEventType } from '@prisma/client'

export async function dispatchNotification(event: DomainEvent): Promise<void> {
  try {
    const { organizationId } = event.payload

    // Load ALL users in the organization
    const users = await prisma.user.findMany({
      where: { organizationId },
      include: {
        notificationPreferences: {
          where: { eventType: event.type as NotificationEventType }
        }
      }
    })

    const template = getEmailTemplate(event)

    for (const user of users) {
      try {
        const pref = user.notificationPreferences[0]
        const emailEnabled = pref ? pref.emailEnabled : true
        const notificationEmail = (pref?.notificationEmail) || user.email

        if (!emailEnabled || !notificationEmail) continue

        // Create PENDING log
        const log = await prisma.notificationLog.create({
          data: {
            organizationId,
            userId: user.id,
            memberId: 'memberId' in event.payload ? event.payload.memberId : null,
            eventType: event.type as NotificationEventType,
            channel: 'EMAIL',
            recipientEmail: notificationEmail,
            subject: template.subject,
            status: 'PENDING',
          }
        })

        // Send email
        const result = await sendEmail({
          to: notificationEmail,
          subject: template.subject,
          html: template.html,
        })

        // Update log
        await prisma.notificationLog.update({
          where: { id: log.id },
          data: {
            status: result.success ? 'SENT' : 'FAILED',
            errorMessage: result.error,
            sentAt: result.success ? new Date() : null,
          }
        })
      } catch (userError) {
        console.error(`Failed to dispatch notification for user ${user.id}:`, userError)
      }
    }
  } catch (err) {
    console.error('Failed to dispatch notifications:', err)
  }
}
