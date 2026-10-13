"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function ClaimActionForm({
  claimId,
  initialAction = "APPROVE",
  initialError,
}: {
  claimId: string
  initialAction?: string
  initialError?: string
}) {
  const router = useRouter()
  const [selectedAction, setSelectedAction] = useState(initialAction)
  const [note, setNote] = useState("")
  const [error, setError] = useState(
    initialError === "note_required"
      ? "A verification note is required when rejecting a payment claim."
      : ""
  )
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedAction === "REJECT" && !note.trim()) {
      setError("A verification note is required when rejecting a payment claim.")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      const res = await fetch(`/api/admin/claims/${claimId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: selectedAction,
          note: note.trim() || undefined,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("Claim already processed (409 Conflict). Reloading...")
        }
        throw new Error(data?.error || "Failed to submit verification action")
      }

      router.push("/app/admin/claims")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An error occurred")
      setIsLoading(false)
      if (err.message?.includes("409")) {
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    }
  }

  return (
    <div className="bg-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
      <div className="pb-4 border-b border-[#f2f2f3]">
        <h2 className="text-[20px] font-medium text-navy-900">Verification Action</h2>
        <p className="text-[14px] text-slate-500 mt-0.5">
          Verify this payment claim to activate subscription, or reject if invalid.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        {error && (
          <div className="p-4 rounded-[16px] text-[14px] bg-[#fce8e6] text-[#c5221f] font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="text-[13px] font-medium uppercase tracking-wider text-slate-400 block mb-3">
            Select Action
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`flex items-start gap-3 p-4 rounded-[16px] border cursor-pointer transition-colors ${
                selectedAction === "APPROVE" ? "border-navy-900 bg-slate-50" : "border-[#ececec] hover:border-navy-900"
              }`}
            >
              <input
                type="radio"
                name="action"
                value="APPROVE"
                checked={selectedAction === "APPROVE"}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="mt-1 h-4 w-4 text-navy-900 focus:ring-navy-900"
              />
              <div>
                <div className="text-[15px] font-medium text-navy-900">Approve Claim</div>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Marks claim as VERIFIED, activates organization subscription to ACTIVE, and sets current period end to 30 days from now.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-4 rounded-[16px] border cursor-pointer transition-colors ${
                selectedAction === "REJECT" ? "border-navy-900 bg-slate-50" : "border-[#ececec] hover:border-navy-900"
              }`}
            >
              <input
                type="radio"
                name="action"
                value="REJECT"
                checked={selectedAction === "REJECT"}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="mt-1 h-4 w-4 text-navy-900 focus:ring-navy-900"
              />
              <div>
                <div className="text-[15px] font-medium text-navy-900">Reject Claim</div>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Marks claim as REJECTED. Subscription status is not changed. Requires a verification note.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="claim-note" className="text-[14px] font-medium text-navy-900 block mb-1.5">
            Verification Note — required on reject, recommended on approve
          </label>
          <textarea
            id="claim-note"
            name="note"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Verified deposit with Commercial Bank statement reference #123456... or Invalid slip photo..."
            className="w-full bg-white border border-[#ececec] rounded-[16px] p-3.5 text-[15px] text-navy-900 placeholder:text-slate-300 outline-none focus:border-navy-900 transition-colors"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-navy-900 text-white px-6 py-2.5 text-[15px] font-medium hover:bg-opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Submit Decision"}
          </button>
        </div>
      </form>
    </div>
  )
}
