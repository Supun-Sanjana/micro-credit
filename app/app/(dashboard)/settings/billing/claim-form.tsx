"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, Clock, Landmark, Sparkles, ArrowRight } from "lucide-react"
import type { PlanConfig } from "@/lib/plans"

interface ClaimFormProps {
  hasPendingClaim: boolean
  defaultAmount?: number | string
  selectedPlan?: PlanConfig | null
  currentPlanName?: string
  suggestedBankRef?: string
}

export function ClaimForm({
  hasPendingClaim,
  defaultAmount,
  selectedPlan,
  currentPlanName,
  suggestedBankRef,
}: ClaimFormProps) {
  const [amount, setAmount] = useState(
    selectedPlan ? String(selectedPlan.monthlyPrice) : defaultAmount ? String(defaultAmount) : ""
  )
  const [bankReference, setBankReference] = useState("")
  const [paidDate, setPaidDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Sync amount whenever selectedPlan changes
  useEffect(() => {
    if (selectedPlan) {
      setAmount(String(selectedPlan.monthlyPrice))
    }
  }, [selectedPlan])

  // Auto-fill bank reference from invoice if empty
  useEffect(() => {
    if (suggestedBankRef && !bankReference) {
      setBankReference(suggestedBankRef)
    }
  }, [suggestedBankRef, bankReference])

  if (hasPendingClaim) {
    return (
      <div className="rounded-[20px] bg-slate-50/80 border border-border/40 p-6 flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fbe1d1] text-[#5d2a1a]">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-[16px] font-medium text-navy-900">
            A payment claim is currently under review.
          </h4>
          <p className="text-[14px] text-slate-500 mt-1 leading-relaxed">
            Our platform administrators are currently verifying your recent bank transaction. Once approved, your subscription status, selected plan tier, and validity period will update automatically.
          </p>
        </div>
      </div>
    )
  }

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("amount", amount)
      formData.append("bankReference", bankReference)
      formData.append("paidDate", paidDate)
      if (selectedPlan?.id) {
        formData.append("planId", selectedPlan.id)
      }
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
      setLoading(false)
      // Refresh the server component to update the history table
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
      setLoading(false)
    }
  }

  const isUpgrade =
    selectedPlan &&
    currentPlanName &&
    selectedPlan.name.toLowerCase() !== currentPlanName.toLowerCase()

  return (
    <div id="payment-claim-section" className="flex flex-col gap-6 scroll-mt-8">
      {/* Offline Bank Account Details */}
      <div className="bg-[#fdfbf7] border border-[#d9cfc0] rounded-[24px] p-7 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-[#166534]/10 flex items-center justify-center text-[#166534]">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-[17px] font-semibold text-navy-950">
              Verified Bank Deposit Account
            </h4>
            <p className="text-[13px] text-slate-500">
              Transfer or deposit your subscription payment to our official corporate account.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#d9cfc0]/60 text-[13px]">
          <div className="bg-white/80 p-3.5 rounded-xl border border-[#d9cfc0]/40">
            <span className="text-slate-500 uppercase tracking-wider text-[11px] font-semibold block">
              Bank Name
            </span>
            <span className="font-semibold text-navy-900 mt-1 block">Bank of Ceylon (BOC)</span>
          </div>
          <div className="bg-white/80 p-3.5 rounded-xl border border-[#d9cfc0]/40">
            <span className="text-slate-500 uppercase tracking-wider text-[11px] font-semibold block">
              Account Name
            </span>
            <span className="font-semibold text-navy-900 mt-1 block">
              MicroCredit Platform Ltd
            </span>
          </div>
          <div className="bg-white/80 p-3.5 rounded-xl border border-[#d9cfc0]/40">
            <span className="text-slate-500 uppercase tracking-wider text-[11px] font-semibold block">
              Account Number
            </span>
            <span className="font-mono font-bold text-navy-900 mt-1 block tracking-wider">
              0084 1029 8452
            </span>
          </div>
          <div className="bg-white/80 p-3.5 rounded-xl border border-[#d9cfc0]/40">
            <span className="text-slate-500 uppercase tracking-wider text-[11px] font-semibold block">
              Branch & Swift
            </span>
            <span className="font-semibold text-navy-900 mt-1 block">
              Colombo Corporate (BOCELKJA)
            </span>
          </div>
        </div>
      </div>

      {/* Claim Submission Form */}
      <div className="bg-white rounded-[24px] shadow-subtle-3 p-8 border border-border/30">
        <div className="mb-6">
          <h3 className="text-[22px] font-sans font-medium text-navy-900 tracking-tight">
            Submit Payment Claim
          </h3>
          <p className="text-[15px] text-slate-500 mt-1">
            Enter your bank transfer or deposit details to activate, renew, or upgrade your organization subscription.
          </p>
        </div>

        {/* Selected Plan Summary Banner */}
        {selectedPlan && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-[18px] bg-[#166534]/5 border border-[#166534]/20 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#166534]/15 flex items-center justify-center text-[#166534] shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-navy-950 flex items-center gap-2">
                  <span>Selected Tier:</span>
                  <span className="text-[#166534] font-bold">{selectedPlan.name} Plan</span>
                  {isUpgrade && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#166534] text-white">
                      Upgrade
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-slate-500 mt-0.5">
                  {isUpgrade
                    ? `Your organization will be upgraded to ${selectedPlan.name} with ${selectedPlan.maxOfficerSeats} officer seats and ${selectedPlan.maxBranches} branches once verified.`
                    : `Renewing your active subscription on the ${selectedPlan.name} tier.`}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-[18px] font-bold text-navy-950">
                LKR {selectedPlan.monthlyPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[12px] text-slate-500">standard monthly price</div>
            </div>
          </div>
        )}

        {success ? (
          <div className="rounded-[16px] bg-[#e6f4ea] p-5 text-[15px] text-[#137333] font-medium flex items-center gap-3 border border-[#137333]/20">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Payment claim submitted successfully!</p>
              <p className="text-[13px] text-[#137333]/85 mt-0.5">
                Our platform administrators will verify your transaction shortly. Refreshing page...
              </p>
            </div>
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
                <label htmlFor="claim-amount" className="text-[14px] text-navy-900 font-medium ml-1">
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
                  className="bg-[#ffffff] border border-[#ececec] rounded-[16px] p-[14px] text-[15px] text-navy-900 placeholder:text-slate-300 outline-none focus:border-navy-900 transition-colors"
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label htmlFor="claim-bank-ref" className="text-[14px] text-navy-900 font-medium ml-1">
                  Bank Reference / Invoice Number <span className="text-red-500">*</span>
                </label>
                <div className="text-[12px] text-slate-500 ml-1 mt-0">
                  Use the Invoice Number from the proforma invoice as your bank transfer reference
                </div>
                <input
                  id="claim-bank-ref"
                  type="text"
                  required
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                  placeholder="e.g. BOC-TXN-20260912-984"
                  className="bg-[#ffffff] border border-[#ececec] rounded-[16px] p-[14px] text-[15px] text-navy-900 placeholder:text-slate-300 outline-none focus:border-navy-900 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col space-y-2">
                <label htmlFor="claim-paid-date" className="text-[14px] text-navy-900 font-medium ml-1">
                  Paid Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="claim-paid-date"
                  type="date"
                  required
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  className="bg-[#ffffff] border border-[#ececec] rounded-[16px] p-[14px] text-[15px] text-navy-900 outline-none focus:border-navy-900 transition-colors"
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label htmlFor="claim-proof-file" className="text-[14px] text-navy-900 font-medium ml-1">
                  Deposit Slip / Transfer Proof (PDF or Image)
                </label>
                <input
                  id="claim-proof-file"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="bg-[#ffffff] border border-[#ececec] rounded-[16px] p-[10px] text-[15px] text-navy-900 outline-none focus:border-navy-900 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-navy-900 file:text-white hover:file:opacity-90"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center bg-navy-900 text-white rounded-full px-7 py-3 text-[14px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Claim...
                  </>
                ) : (
                  <>
                    <span>Submit Payment Claim</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
