"use client"

import { useState } from "react"
import { Loader2, CheckCircle2, Clock } from "lucide-react"

interface ClaimFormProps {
  hasPendingClaim: boolean
  defaultAmount?: number | string
}

export function ClaimForm({ hasPendingClaim, defaultAmount }: ClaimFormProps) {
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : "")
  const [bankReference, setBankReference] = useState("")
  const [paidDate, setPaidDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (hasPendingClaim) {
    return (
      <div className="rounded-[20px] bg-mist-gray/80 border border-border/40 p-6 flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush-peach text-sienna-brown">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-[16px] font-medium text-ink-black">
            A payment claim is currently under review.
          </h4>
          <p className="text-[14px] text-slate-gray mt-1 leading-relaxed">
            Our platform administrators are currently verifying your recent bank transaction. Once approved, your subscription status and validity period will update automatically.
          </p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("amount", amount)
      formData.append("bankReference", bankReference)
      formData.append("paidDate", paidDate)
      if (proofFile) {
        formData.append("proofFile", proofFile)
      }

      const res = await fetch("/api/billing/claim", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit payment claim.")
      }

      setSuccess(true)
      // Spec: "Submits via AJAX to the API, then reloads the page."
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
      setLoading(false)
    }
  }

  return (
    <div className="bg-paper-white rounded-[24px] shadow-subtle-3 p-8 border border-border/30">
      <div className="mb-6">
        <h3 className="text-[22px] font-sans font-medium text-ink-black tracking-tight">
          Submit Payment Claim
        </h3>
        <p className="text-[15px] text-slate-gray mt-1">
          Enter your bank transfer or deposit details to activate or renew your organization subscription.
        </p>
      </div>

      {success ? (
        <div className="rounded-[16px] bg-[#e6f4ea] p-4 text-[15px] text-[#137333] font-medium flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5" />
          <span>Payment claim submitted successfully. Refreshing page...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-[16px] bg-[#fbe1d1] p-4 text-[14px] text-[#5d2a1a] font-medium border border-[#5d2a1a]/10">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col space-y-2">
              <label htmlFor="claim-amount" className="text-[14px] text-ink-black font-medium ml-1">
                Payment Amount (LKR) <span className="text-red-500">*</span>
              </label>
              <input
                id="claim-amount"
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 15000.00"
                className="bg-[#ffffff] border border-[#ececec] rounded-[16px] p-[14px] text-[15px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black transition-colors"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label htmlFor="claim-bank-ref" className="text-[14px] text-ink-black font-medium ml-1">
                Bank Reference / Slip No <span className="text-red-500">*</span>
              </label>
              <input
                id="claim-bank-ref"
                type="text"
                required
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                placeholder="e.g. BOC-TXN-20260912-984"
                className="bg-[#ffffff] border border-[#ececec] rounded-[16px] p-[14px] text-[15px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col space-y-2">
              <label htmlFor="claim-paid-date" className="text-[14px] text-ink-black font-medium ml-1">
                Paid Date <span className="text-red-500">*</span>
              </label>
              <input
                id="claim-paid-date"
                type="date"
                required
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="bg-[#ffffff] border border-[#ececec] rounded-[16px] p-[14px] text-[15px] text-ink-black outline-none focus:border-ink-black transition-colors"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label htmlFor="claim-proof-file" className="text-[14px] text-ink-black font-medium ml-1">
                Proof Document (Optional)
              </label>
              <input
                id="claim-proof-file"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="bg-[#ffffff] border border-[#ececec] rounded-[16px] p-[10px] text-[15px] text-ink-black outline-none focus:border-ink-black transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-ink-black file:text-white hover:file:opacity-90"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center bg-ink-black text-paper-white rounded-full px-6 py-3 text-[14px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Claim...
                </>
              ) : (
                "Submit Payment Claim"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
