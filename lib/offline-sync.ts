import {
  PendingRepaymentRecord,
  getPendingRepayments,
  getFailedRepayments,
  markRepaymentSynced,
  markRepaymentFailed,
  retryFailedRepayment,
} from "./indexed-db"

export interface SyncItemResult {
  id: string
  success: boolean
  error?: string
  status?: number
}

export interface SyncBatchResult {
  total: number
  synced: number
  failed: number
  errors: Array<{ id: string; error: string }>
}

/**
 * Synchronizes a single offline repayment record to the core backend.
 * Uses item.id as clientTransactionId for idempotent processing.
 */
export async function syncSingleRepayment(item: PendingRepaymentRecord): Promise<SyncItemResult> {
  try {
    const res = await fetch("/api/field/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loanId: item.loanId,
        scheduleId: item.scheduleId,
        amount: item.amount,
        method: item.method || "CASH",
        clientTransactionId: item.id, // Idempotency key
        notes: item.notes || `Offline Collection (Synced at ${new Date().toISOString()})`,
      }),
    })

    if (res.ok) {
      await markRepaymentSynced(item.id)
      return { id: item.id, success: true, status: res.status }
    }

    const json = await res.json().catch(() => ({ error: "Sync failed" }))
    const errorMsg = json.error || `Server returned ${res.status}`
    await markRepaymentFailed(item.id, errorMsg)
    return { id: item.id, success: false, error: errorMsg, status: res.status }
  } catch (err: any) {
    const errorMsg = err?.message || "Network communication error"
    await markRepaymentFailed(item.id, errorMsg)
    return { id: item.id, success: false, error: errorMsg }
  }
}

/**
 * Synchronizes all pending (and retrying) offline repayments.
 * Stops cleanly if network connectivity drops midway.
 */
export async function syncAllPendingRepayments(
  onProgress?: (progress: { current: number; total: number; item: PendingRepaymentRecord }) => void
): Promise<SyncBatchResult> {
  const pending = await getPendingRepayments()
  if (pending.length === 0) {
    return { total: 0, synced: 0, failed: 0, errors: [] }
  }

  let synced = 0
  let failed = 0
  const errors: Array<{ id: string; error: string }> = []

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i]
    if (onProgress) {
      onProgress({ current: i + 1, total: pending.length, item })
    }

    const result = await syncSingleRepayment(item)
    if (result.success) {
      synced++
    } else {
      failed++
      errors.push({ id: item.id, error: result.error || "Unknown error" })

      // If user went completely offline, abort the rest of the queue
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        break
      }

      // Small delay between failed retries to prevent network thrashing
      await new Promise((resolve) => setTimeout(resolve, 150))
    }
  }

  return {
    total: pending.length,
    synced,
    failed,
    errors,
  }
}

/**
 * Resets all failed repayments to PENDING state and attempts a new synchronization.
 */
export async function retryAllFailedRepayments(
  onProgress?: (progress: { current: number; total: number; item: PendingRepaymentRecord }) => void
): Promise<SyncBatchResult> {
  const failed = await getFailedRepayments()
  for (const item of failed) {
    await retryFailedRepayment(item.id)
  }
  return syncAllPendingRepayments(onProgress)
}
