import {
  syncSingleRepayment,
  syncAllPendingRepayments,
  retryAllFailedRepayments,
} from "../offline-sync"
import * as indexedDb from "../indexed-db"

// Mock indexed-db module
jest.mock("../indexed-db", () => ({
  getPendingRepayments: jest.fn(),
  getFailedRepayments: jest.fn(),
  markRepaymentSynced: jest.fn(),
  markRepaymentFailed: jest.fn(),
  retryFailedRepayment: jest.fn(),
}))

const globalFetch = global.fetch as jest.Mock

describe("Offline Sync Service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  afterAll(() => {
    global.fetch = globalFetch
  })

  const sampleItem: indexedDb.PendingRepaymentRecord = {
    id: "tx-offline-123",
    loanId: "loan-456",
    scheduleId: "sched-789",
    amount: 250,
    method: "CASH",
    notes: "Field Collection",
    centreId: "centre-1",
    collectedAt: "2026-10-13T10:00:00.000Z",
    synced: false,
    status: "PENDING",
    retryCount: 0,
  }

  describe("syncSingleRepayment", () => {
    it("successfully syncs an item and sends clientTransactionId for idempotency", async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: "rep-1", clientTransactionId: "tx-offline-123" }),
      })

      const result = await syncSingleRepayment(sampleItem)

      expect(result.success).toBe(true)
      expect(result.id).toBe("tx-offline-123")
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/field/collect",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loanId: "loan-456",
            scheduleId: "sched-789",
            amount: 250,
            method: "CASH",
            clientTransactionId: "tx-offline-123", // idempotent identifier
            notes: "Field Collection",
          }),
        })
      )
      expect(indexedDb.markRepaymentSynced).toHaveBeenCalledWith("tx-offline-123")
      expect(indexedDb.markRepaymentFailed).not.toHaveBeenCalled()
    })

    it("marks repayment as failed when server returns 400 validation error", async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Schedule does not belong to this loan" }),
      })

      const result = await syncSingleRepayment(sampleItem)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Schedule does not belong to this loan")
      expect(indexedDb.markRepaymentFailed).toHaveBeenCalledWith(
        "tx-offline-123",
        "Schedule does not belong to this loan"
      )
      expect(indexedDb.markRepaymentSynced).not.toHaveBeenCalled()
    })

    it("marks repayment as failed when fetch throws a network exception", async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Failed to fetch"))

      const result = await syncSingleRepayment(sampleItem)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to fetch")
      expect(indexedDb.markRepaymentFailed).toHaveBeenCalledWith("tx-offline-123", "Failed to fetch")
    })
  })

  describe("syncAllPendingRepayments", () => {
    it("returns zero counts when there are no pending repayments", async () => {
      ;(indexedDb.getPendingRepayments as jest.Mock).mockResolvedValueOnce([])

      const result = await syncAllPendingRepayments()
      expect(result).toEqual({ total: 0, synced: 0, failed: 0, errors: [] })
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it("processes a batch and tracks progress and summaries correctly", async () => {
      const item2 = { ...sampleItem, id: "tx-offline-456" }
      ;(indexedDb.getPendingRepayments as jest.Mock).mockResolvedValueOnce([sampleItem, item2])

      // Item 1 succeeds, Item 2 fails
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({}) })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: async () => ({ error: "Not assigned to this centre" }),
        })

      const progressSpy = jest.fn()
      const result = await syncAllPendingRepayments(progressSpy)

      expect(result.total).toBe(2)
      expect(result.synced).toBe(1)
      expect(result.failed).toBe(1)
      expect(result.errors).toEqual([
        { id: "tx-offline-456", error: "Not assigned to this centre" },
      ])
      expect(progressSpy).toHaveBeenCalledTimes(2)
      expect(indexedDb.markRepaymentSynced).toHaveBeenCalledWith("tx-offline-123")
      expect(indexedDb.markRepaymentFailed).toHaveBeenCalledWith(
        "tx-offline-456",
        "Not assigned to this centre"
      )
    })
  })

  describe("retryAllFailedRepayments", () => {
    it("resets failed records and initiates sync", async () => {
      const failedItem = { ...sampleItem, id: "tx-failed-999", status: "FAILED" as const }
      ;(indexedDb.getFailedRepayments as jest.Mock).mockResolvedValueOnce([failedItem])
      ;(indexedDb.getPendingRepayments as jest.Mock).mockResolvedValueOnce([failedItem])

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })

      const result = await retryAllFailedRepayments()

      expect(indexedDb.retryFailedRepayment).toHaveBeenCalledWith("tx-failed-999")
      expect(result.synced).toBe(1)
    })
  })
})
