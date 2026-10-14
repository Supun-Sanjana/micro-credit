"use client"

import { useEffect, useState, useCallback } from "react"
import {
  getAllOfflineRepayments,
  clearSyncedRepayments,
} from "@/lib/indexed-db"
import {
  syncAllPendingRepayments,
  retryAllFailedRepayments,
} from "@/lib/offline-sync"
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react"
import Link from "next/link"

export function OfflineSyncManager() {
  const [isOnline, setIsOnline] = useState(true)
  const [counts, setCounts] = useState({ pending: 0, failed: 0, synced: 0 })
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null)

  const refreshCounts = useCallback(async () => {
    try {
      const all = await getAllOfflineRepayments()
      const pending = all.filter((r) => r.status === "PENDING" && !r.synced).length
      const failed = all.filter((r) => r.status === "FAILED" && !r.synced).length
      const synced = all.filter((r) => r.synced || r.status === "SYNCED").length
      setCounts({ pending, failed, synced })
    } catch {
      // In SSR or when IndexedDB is unavailable
    }
  }, [])

  const triggerSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return
    setIsSyncing(true)
    setSyncStatusMsg("Syncing...")

    try {
      const res = await syncAllPendingRepayments((prog) => {
        setSyncStatusMsg(`Syncing ${prog.current} of ${prog.total}...`)
      })

      if (res.failed > 0) {
        setSyncStatusMsg(`${res.synced} synced, ${res.failed} failed`)
      } else if (res.synced > 0) {
        setSyncStatusMsg(`All ${res.synced} payments synced!`)
        setTimeout(() => {
          setSyncStatusMsg(null)
          clearSyncedRepayments().catch(() => {})
        }, 4000)
      } else {
        setSyncStatusMsg(null)
      }
    } catch {
      setSyncStatusMsg("Sync interrupted")
    } finally {
      setIsSyncing(false)
      await refreshCounts()
    }
  }, [isSyncing, refreshCounts])

  const handleRetryFailed = async () => {
    if (isSyncing || !navigator.onLine) return
    setIsSyncing(true)
    setSyncStatusMsg("Retrying failed...")
    try {
      await retryAllFailedRepayments()
    } finally {
      setIsSyncing(false)
      await refreshCounts()
    }
  }

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      triggerSync()
    }
    const handleOffline = () => {
      setIsOnline(false)
      refreshCounts()
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    refreshCounts()
    const interval = setInterval(refreshCounts, 10000)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [triggerSync, refreshCounts])

  const totalUnsynced = counts.pending + counts.failed
  if (isOnline && totalUnsynced === 0 && counts.synced === 0 && !syncStatusMsg) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 bg-navy-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3 text-[13px] font-medium z-50 border border-white/10 max-w-md">
      <div className="flex items-center gap-2.5">
        {!isOnline ? (
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4" />
          </div>
        ) : isSyncing ? (
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4 animate-spin" />
          </div>
        ) : counts.failed > 0 ? (
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Wifi className="w-4 h-4" />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2">
            <span>
              {!isOnline
                ? "Offline Mode"
                : isSyncing
                ? syncStatusMsg || "Syncing Data..."
                : counts.failed > 0
                ? "Sync Needs Attention"
                : "Connected"}
            </span>

            {counts.pending > 0 && (
              <span className="bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-full text-[11px] font-mono">
                {counts.pending} pending
              </span>
            )}

            {counts.failed > 0 && (
              <span className="bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full text-[11px] font-mono">
                {counts.failed} failed
              </span>
            )}

            {counts.synced > 0 && totalUnsynced === 0 && (
              <span className="bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3" />
                {counts.synced} synced
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-white/10">
        {isOnline && !isSyncing && counts.pending > 0 && (
          <button
            onClick={triggerSync}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
          >
            Sync Now
          </button>
        )}

        {isOnline && !isSyncing && counts.failed > 0 && (
          <button
            onClick={handleRetryFailed}
            className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
          >
            Retry Failed
          </button>
        )}

        <Link
          href="/~offline"
          className="text-xs text-neutral-300 hover:text-white flex items-center gap-0.5 pl-1"
          title="Open Offline Queue Workspace"
        >
          Details
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
