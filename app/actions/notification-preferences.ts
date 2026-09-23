'use server'

import { getScopedDal } from '@/lib/dal'
import { NotificationEventType } from '@prisma/client'

export async function getMyNotificationPreferences() {
  const dal = await getScopedDal()
  
  const prefs = await dal.prisma.userNotificationPreference.findMany({
    where: {
      userId: dal.userId,
      organizationId: dal.organizationId
    }
  })

  // Ensure all event types have a preference record
  const allEventTypes = Object.values(NotificationEventType)
  const prefsMap = new Map(prefs.map(p => [p.eventType, p]))

  return allEventTypes.map(eventType => {
    const existing = prefsMap.get(eventType)
    return {
      eventType,
      emailEnabled: existing ? existing.emailEnabled : true,
      notificationEmail: existing?.notificationEmail || ''
    }
  })
}

export async function saveNotificationPreferences(
  prefs: { eventType: NotificationEventType; emailEnabled: boolean; notificationEmail: string }[]
) {
  const dal = await getScopedDal()
  if (!dal.userId) throw new Error("Unauthorized")

  for (const pref of prefs) {
    if (pref.notificationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pref.notificationEmail)) {
      throw new Error(`Invalid email for ${pref.eventType}`)
    }
  }

  await dal.prisma.$transaction(
    prefs.map(pref => 
      dal.prisma.userNotificationPreference.upsert({
        where: {
          userId_eventType: {
            userId: dal.userId!,
            eventType: pref.eventType
          }
        },
        update: {
          emailEnabled: pref.emailEnabled,
          notificationEmail: pref.notificationEmail || null
        },
        create: {
          userId: dal.userId!,
          organizationId: dal.organizationId,
          eventType: pref.eventType,
          emailEnabled: pref.emailEnabled,
          notificationEmail: pref.notificationEmail || null
        }
      })
    )
  )

  return { success: true }
}
