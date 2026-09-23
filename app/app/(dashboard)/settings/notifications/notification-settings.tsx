'use client'

import { useState } from 'react'
import { NotificationEventType } from '@prisma/client'
import { saveNotificationPreferences } from '@/app/actions/notification-preferences'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Preference = {
  eventType: NotificationEventType
  emailEnabled: boolean
  notificationEmail: string
}

export function NotificationSettings({ initialPrefs }: { initialPrefs: Preference[] }) {
  const [prefs, setPrefs] = useState<Preference[]>(initialPrefs)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleToggle = (eventType: NotificationEventType) => {
    setPrefs(prefs.map(p => p.eventType === eventType ? { ...p, emailEnabled: !p.emailEnabled } : p))
  }

  const handleEmailChange = (eventType: NotificationEventType, value: string) => {
    setPrefs(prefs.map(p => p.eventType === eventType ? { ...p, notificationEmail: value } : p))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await saveNotificationPreferences(prefs)
      setSuccess('Preferences saved successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-500">{success}</div>}
      
      <div className="border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-4 text-left font-medium">Event Type</th>
              <th className="p-4 text-left font-medium">Email Enabled</th>
              <th className="p-4 text-left font-medium">Override Email (Optional)</th>
            </tr>
          </thead>
          <tbody>
            {prefs.map(pref => (
              <tr key={pref.eventType} className="border-t">
                <td className="p-4">{pref.eventType.replace(/_/g, ' ')}</td>
                <td className="p-4">
                  <input 
                    type="checkbox"
                    checked={pref.emailEnabled}
                    onChange={() => handleToggle(pref.eventType)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="p-4">
                  <Input 
                    placeholder="Defaults to account email"
                    value={pref.notificationEmail}
                    onChange={(e) => handleEmailChange(pref.eventType, e.target.value)}
                    disabled={!pref.emailEnabled}
                    className="max-w-xs"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </div>
  )
}
