"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ShieldAlert } from "lucide-react"

export default function RiskPage() {
  const queryClient = useQueryClient()

  // 1. Fetch & cache risk alerts
  const { data: alerts = [], isLoading: loading } = useQuery<any[]>({
    queryKey: ["risk-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/intelligence/risk-alerts")
      if (!res.ok) return []
      return res.json()
    },
  })

  // 2. Mutation for updating risk alert status
  const statusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const res = await fetch(`/api/intelligence/risk-alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-alerts"] })
    },
    onError: (e) => {
      console.error("An error occurred during fetch")
    },
  })

  const handleStatusChange = (id: string, newStatus: string) => {
    statusMutation.mutate({ id, newStatus })
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
          <div className="p-8 text-center text-slate-500">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No open risk alerts found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fafafa] border-b border-[#ececec]">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Type</th>
                <th className="px-4 py-3 font-medium text-slate-500">Severity</th>
                <th className="px-4 py-3 font-medium text-slate-500">Entity</th>
                <th className="px-4 py-3 font-medium text-slate-500">Description</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec]">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-3 font-medium">{alert.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">{getSeverityBadge(alert.severity)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-500 block">{alert.entityType}</span>
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
                        className="text-xs font-medium text-brand-700 hover:underline"
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
