"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  WifiOff,
  Wifi,
  RefreshCw,
  CheckCircle2,
  MapPin,
  Users,
  Trash2,
  ArrowLeft,
  Database,
  PlusCircle,
  AlertCircle,
  RotateCw,
} from "lucide-react"
import {
  getAllCachedCollectionSheets,
  getCachedCentresList,
  getAllOfflineRepayments,
  saveRepaymentOffline,
  removePendingRepayment,
  clearSyncedRepayments,
  retryFailedRepayment,
  PendingRepaymentRecord,
} from "@/lib/indexed-db"
import {
  syncAllPendingRepayments,
  retryAllFailedRepayments,
  syncSingleRepayment,
} from "@/lib/offline-sync"

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "FAILED" | "SYNCED">("ALL")
  const [cachedSheets, setCachedSheets] = useState<any[]>([])
  const [centresMap, setCentresMap] = useState<Record<string, string>>({})
  const [offlineRepayments, setOfflineRepayments] = useState<PendingRepaymentRecord[]>([])
  const [selectedCentreId, setSelectedCentreId] = useState<string | null>(null)
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({})
  const [justSavedLoanId, setJustSavedLoanId] = useState<string | null>(null)

  const loadOfflineStore = async () => {
    try {
      const [sheets, centres, allRepayments] = await Promise.all([
        getAllCachedCollectionSheets(),
        getCachedCentresList(),
        getAllOfflineRepayments(),
      ])

      const map: Record<string, string> = {}
      if (Array.isArray(centres)) {
        centres.forEach((c: any) => {
          if (c?.id && c?.name) map[c.id] = c.name
        })
      }
      setCentresMap(map)
      setCachedSheets(sheets || [])
      setOfflineRepayments(allRepayments || [])

      if (!selectedCentreId && sheets && sheets.length > 0) {
        setSelectedCentreId(sheets[0].centreId)
      }
    } catch (err) {
      console.error("Failed to load IndexedDB store:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsOnline(navigator.onLine)
    loadOfflineStore()

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleRecordOfflinePayment = async (
    centreId: string,
    member: any,
    loan: any,
    amount: number
  ) => {
    if (!amount || amount <= 0) return
    const scheduleId = loan.repaymentSchedule?.[0]?.id
    await saveRepaymentOffline({
      id: crypto.randomUUID(),
      loanId: loan.id,
      scheduleId,
      amount,
      method: "CASH",
      notes: "Offline Field Collection",
      centreId,
      memberId: member.id,
      memberName: member.name,
      centreName: centresMap[centreId] || `Centre ${centreId.slice(0, 6)}`,
    })
    setJustSavedLoanId(loan.id)
    setTimeout(() => setJustSavedLoanId(null), 2000)
    await loadOfflineStore()
  }

  const handleRemovePending = async (id: string) => {
    await removePendingRepayment(id)
    await loadOfflineStore()
  }

  const handleSyncAll = async () => {
    if (!navigator.onLine || offlineRepayments.length === 0) return
    setSyncing(true)
    setSyncMessage("Syncing offline payments...")
    try {
      const res = await syncAllPendingRepayments((prog) => {
        setSyncMessage(`Syncing ${prog.current} of ${prog.total}...`)
      })
      if (res.failed > 0) {
        setSyncMessage(`${res.synced} synced, ${res.failed} failed. Check errors below.`)
      } else {
        setSyncMessage(`All ${res.synced} payments synchronized successfully!`)
        setTimeout(() => setSyncMessage(null), 4000)
      }
      await loadOfflineStore()
    } catch (err) {
      console.error("Failed to sync offline repayments:", err)
      setSyncMessage("Sync process interrupted.")
    } finally {
      setSyncing(false)
    }
  }

  const handleRetrySingle = async (item: PendingRepaymentRecord) => {
    if (!navigator.onLine) return
    setSyncing(true)
    try {
      await retryFailedRepayment(item.id)
      await syncSingleRepayment(item)
      await loadOfflineStore()
    } finally {
      setSyncing(false)
    }
  }

  const handleRetryAllFailed = async () => {
    if (!navigator.onLine) return
    setSyncing(true)
    setSyncMessage("Retrying all failed records...")
    try {
      await retryAllFailedRepayments()
      await loadOfflineStore()
    } finally {
      setSyncing(false)
    }
  }

  const handleClearSynced = async () => {
    await clearSyncedRepayments()
    await loadOfflineStore()
  }

  const pendingList = offlineRepayments.filter((r) => r.status === "PENDING" && !r.synced)
  const failedList = offlineRepayments.filter((r) => r.status === "FAILED" && !r.synced)
  const syncedList = offlineRepayments.filter((r) => r.synced || r.status === "SYNCED")

  const filteredRepayments = offlineRepayments.filter((r) => {
    if (statusFilter === "PENDING") return r.status === "PENDING" && !r.synced
    if (statusFilter === "FAILED") return r.status === "FAILED" && !r.synced
    if (statusFilter === "SYNCED") return r.synced || r.status === "SYNCED"
    return true
  })

  const totalQueuedAmount = pendingList.reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const activeSheet = cachedSheets.find((s) => s.centreId === selectedCentreId)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-navy-900 dark:text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Status Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isOnline
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
              }`}
            >
              {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-navy-900 dark:text-white">
                  {isOnline ? "Connection Restored" : "Offline Field Workspace"}
                </h1>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    isOnline
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                  }`}
                >
                  {isOnline ? "Online" : "IndexedDB Local Mode"}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isOnline
                  ? "You are back online. Sync any queued field collections below or return to the live dashboard."
                  : "No internet connection detected. You can continue recording field repayments offline using cached collection sheets."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOnline && (
              <Link
                href="/app/field"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Live Field App
              </Link>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Page
            </button>
          </div>
        </div>

        {/* Offline Repayments Queue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-semibold text-navy-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Offline Repayments Queue ({offlineRepayments.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Stored safely in browser IndexedDB • Unsynced Total:{" "}
                <span className="font-semibold text-navy-900 dark:text-white">
                  LKR {totalQueuedAmount.toLocaleString()}
                </span>
                {syncMessage && (
                  <span className="ml-2 font-medium text-brand-600 dark:text-brand-400">
                    • {syncMessage}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {failedList.length > 0 && isOnline && (
                <button
                  onClick={handleRetryAllFailed}
                  disabled={syncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                  Retry Failed ({failedList.length})
                </button>
              )}

              {syncedList.length > 0 && (
                <button
                  onClick={handleClearSynced}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors"
                >
                  Clear Synced ({syncedList.length})
                </button>
              )}

              {pendingList.length > 0 && (
                <button
                  onClick={handleSyncAll}
                  disabled={!isOnline || syncing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing..." : isOnline ? `Sync All Now (${pendingList.length})` : "Waiting for Connection..."}
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === "ALL"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              All ({offlineRepayments.length})
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === "PENDING"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
              }`}
            >
              Pending ({pendingList.length})
            </button>
            <button
              onClick={() => setStatusFilter("FAILED")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === "FAILED"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40"
              }`}
            >
              Failed ({failedList.length})
            </button>
            <button
              onClick={() => setStatusFilter("SYNCED")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === "SYNCED"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
              }`}
            >
              Synced ({syncedList.length})
            </button>
          </div>

          {filteredRepayments.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              No offline repayments matching the current filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRepayments.map((item) => {
                const isItemSynced = item.synced || item.status === "SYNCED"
                const isItemFailed = item.status === "FAILED" || (Boolean(item.syncError) && !isItemSynced)

                return (
                  <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-navy-900 dark:text-slate-100">
                          {item.memberName || `Loan #${item.loanId.slice(0, 8)}`}
                        </span>
                        {item.centreName && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            • {item.centreName}
                          </span>
                        )}

                        {isItemSynced ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Synced
                          </span>
                        ) : isItemFailed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            <AlertCircle className="w-3 h-3" /> Failed
                            {item.retryCount ? ` (${item.retryCount}x)` : ""}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                            Pending
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 mt-0.5">
                        Recorded {new Date(item.collectedAt).toLocaleTimeString()}
                        {item.method && ` • ${item.method}`}
                      </div>

                      {isItemFailed && item.syncError && (
                        <div className="mt-1 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-1 rounded-md border border-rose-200 dark:border-rose-900/50">
                          Reason: {item.syncError}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        LKR {Number(item.amount).toLocaleString()}
                      </span>

                      {isItemFailed && isOnline && (
                        <button
                          onClick={() => handleRetrySingle(item)}
                          disabled={syncing}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1"
                        >
                          <RotateCw className="w-3 h-3" /> Retry
                        </button>
                      )}

                      <button
                        onClick={() => handleRemovePending(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Cached Centre Collection Sheets */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-navy-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Cached Collection Sheets ({cachedSheets.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Collection sheets opened while online are automatically cached here for offline field entry.
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading cached field data...</div>
          ) : cachedSheets.length === 0 ? (
            <div className="py-10 px-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No cached collection sheets on this device yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Open <strong>My Centres</strong> in the Field Portal while online before heading into the field — your assigned centres and member schedules will be cached automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Centre Selector Tabs */}
              <div className="flex flex-wrap gap-2">
                {cachedSheets.map((sheet) => {
                  const isSelected = sheet.centreId === selectedCentreId
                  const label =
                    centresMap[sheet.centreId] || `Centre ${sheet.centreId.slice(0, 6)}`
                  return (
                    <button
                      key={sheet.centreId}
                      onClick={() => setSelectedCentreId(sheet.centreId)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-brand-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Active Sheet Members & Loans */}
              {activeSheet && Array.isArray(activeSheet.data) && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    Last cached: {new Date(activeSheet.updatedAt).toLocaleString()}
                  </div>

                  {activeSheet.data.map((member: any) =>
                    (member.loans || []).map((loan: any) => {
                      const nextSch = loan.repaymentSchedule?.[0]
                      const dueAmount = nextSch
                        ? Number(nextSch.principalDue) + Number(nextSch.interestDue)
                        : 0
                      const alreadyQueued = pendingList.some((p: any) => p.loanId === loan.id)

                      return (
                        <div
                          key={loan.id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-navy-900 dark:text-white">
                                {member.name}
                              </span>
                              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                {loan.loanNumber || loan.id.slice(0, 8)}
                              </span>
                              {alreadyQueued && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" /> Queued
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Installment Due:{" "}
                              <strong className="text-navy-900 dark:text-slate-200">
                                LKR {dueAmount.toLocaleString()}
                              </strong>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {dueAmount > 0 && (
                              <button
                                onClick={() =>
                                  handleRecordOfflinePayment(
                                    activeSheet.centreId,
                                    member,
                                    loan,
                                    dueAmount
                                  )
                                }
                                className="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium transition-colors"
                              >
                                Collect Full (LKR {dueAmount.toLocaleString()})
                              </button>
                            )}

                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                placeholder="Custom LKR"
                                value={customAmounts[loan.id] || ""}
                                onChange={(e) =>
                                  setCustomAmounts({
                                    ...customAmounts,
                                    [loan.id]: e.target.value,
                                  })
                                }
                                className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-navy-900 dark:text-white outline-none focus:border-brand-500"
                              />
                              <button
                                onClick={() => {
                                  const val = Number(customAmounts[loan.id])
                                  if (val > 0) {
                                    handleRecordOfflinePayment(
                                      activeSheet.centreId,
                                      member,
                                      loan,
                                      val
                                    )
                                    setCustomAmounts({ ...customAmounts, [loan.id]: "" })
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-navy-900 dark:text-slate-100 transition-colors"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Queue
                              </button>
                            </div>

                            {justSavedLoanId === loan.id && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                Saved!
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
