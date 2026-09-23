"use client"

import { useState, useEffect } from "react"
import { ShieldAlert } from "lucide-react"

export default function RiskPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/intelligence/risk-alerts")
      if (res.ok) {
        const data = await res.json()
        setAlerts(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/intelligence/risk-alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        fetchAlerts()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Critical</span>
      case 'HIGH': return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">High</span>
      case 'MEDIUM': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">Medium</span>
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">Low</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-medium flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-600" />
          Risk Alerts
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-subtle-3 border border-[#ececec] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-gray">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-gray">No open risk alerts found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fafafa] border-b border-[#ececec]">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-gray">Type</th>
                <th className="px-4 py-3 font-medium text-slate-gray">Severity</th>
                <th className="px-4 py-3 font-medium text-slate-gray">Entity</th>
                <th className="px-4 py-3 font-medium text-slate-gray">Description</th>
                <th className="px-4 py-3 font-medium text-slate-gray">Status</th>
                <th className="px-4 py-3 font-medium text-slate-gray text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec]">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-3 font-medium">{alert.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">{getSeverityBadge(alert.severity)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-gray block">{alert.entityType}</span>
                    <span className="font-mono text-xs">{alert.entityId.slice(-8)}</span>
                  </td>
                  <td className="px-4 py-3 max-w-md truncate">{alert.description}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{alert.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {alert.status === 'OPEN' && (
                      <button 
                        onClick={() => handleStatusChange(alert.id, 'ACKNOWLEDGED')}
                        className="text-xs font-medium text-sienna-brown hover:underline"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alert.status !== 'RESOLVED' && (
                      <button 
                        onClick={() => handleStatusChange(alert.id, 'RESOLVED')}
                        className="text-xs font-medium text-green-600 hover:underline"
                      >
                        Resolve
                      </button>
                    )}
                    {alert.status !== 'DISMISSED' && (
                      <button 
                        onClick={() => handleStatusChange(alert.id, 'DISMISSED')}
                        className="text-xs font-medium text-gray-500 hover:underline"
                      >
                        Dismiss
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
