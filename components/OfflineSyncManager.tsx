"use client"

import { useEffect, useState } from "react"
import { getPendingRepayments, removePendingRepayment } from "@/lib/indexed-db"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"

export function OfflineSyncManager() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Only run on client
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      syncPendingData()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Initial check for pending data
    checkPending()

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const checkPending = async () => {
    const pending = await getPendingRepayments()
    setPendingCount(pending.length)
  }

  const syncPendingData = async () => {
    const pending = await getPendingRepayments()
    if (pending.length === 0) return

    setIsSyncing(true)
    let successCount = 0

    for (const item of pending) {
      try {
        const res = await fetch("/api/field/collect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loanId: item.loanId,
            amount: item.amount,
            notes: `Offline Collection (Synced at ${new Date().toISOString()})`
          })
        })
        
        if (res.ok) {
          await removePendingRepayment(item.id)
          successCount++
        }
      } catch (err) {
        console.error("Sync failed for item", item.id, err)
      }
    }

    setPendingCount(pending.length - successCount)
    setIsSyncing(false)
  }

  if (isOnline && pendingCount === 0) return null

  return (
    <div className="fixed bottom-6 right-6 bg-ink-black text-paper-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-[14px] font-medium z-50">
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4 text-[#c5221f]" />
          <span>Offline Mode</span>
          {pendingCount > 0 && <span className="bg-[#444] px-2 py-0.5 rounded text-[12px]">{pendingCount} pending</span>}
        </>
      ) : (
        <>
          {isSyncing ? <RefreshCw className="w-4 h-4 text-golden-sun animate-spin" /> : <Wifi className="w-4 h-4 text-[#137333]" />}
          <span>{isSyncing ? "Syncing data..." : "Back Online"}</span>
          {!isSyncing && pendingCount > 0 && (
            <button onClick={syncPendingData} className="ml-2 text-golden-sun hover:underline">
              Sync Now ({pendingCount})
            </button>
          )}
        </>
      )}
    </div>
  )
}
