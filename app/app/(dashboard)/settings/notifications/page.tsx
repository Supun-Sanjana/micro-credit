import { getMyNotificationPreferences } from '@/app/actions/notification-preferences'
import { NotificationSettings } from './notification-settings'

export default async function NotificationsPage() {
  const prefs = await getMyNotificationPreferences()

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground">Manage how you receive alerts and updates.</p>
      </div>

      <NotificationSettings initialPrefs={prefs} />
    </div>
  )
}
