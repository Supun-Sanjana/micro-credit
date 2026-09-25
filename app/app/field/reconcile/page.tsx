"use client"

import { useState } from "react"
import { ShieldCheck, Loader2 } from "lucide-react"

export default function ReconcilePage() {
  const [cash, setCash] = useState("")
  const [bank, setBank] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/field/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          declaredCash: Number(cash),
          declaredBank: Number(bank),
          date: new Date().toISOString()
        })
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Failed to reconcile")
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl p-6 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="w-16 h-16 bg-[#e6f4ea] text-[#137333] rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-[24px] font-serif text-ink-black mb-2">Reconciliation Submitted</h1>
        <p className="text-[15px] text-slate-gray">
          Your End of Day (EOD) totals have been securely recorded. Branch managers will review them shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 pb-24">
      <div className="flex flex-col gap-1 pt-2">
        <h1 className="text-[28px] leading-[1.3] text-ink-black font-serif font-normal" style={{ letterSpacing: '-0.66px' }}>
          End of Day Reconciliation
        </h1>
        <p className="text-[15px] text-slate-gray">
          Declare your physical cash and bank transfer totals for the day.
        </p>
      </div>

      {error && (
        <div className="bg-[#fce8e6] text-[#c5221f] p-4 rounded-xl text-[14px] font-medium border border-[#f9d2ce]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-paper-white rounded-3xl border border-[#ececec] p-6 shadow-subtle-1 space-y-6">
        <div>
          <label className="text-[13px] font-medium text-slate-gray mb-1.5 block uppercase tracking-wide">
            Physical Cash Collected
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-gray font-medium">LKR</span>
            <input 
              type="number"
              required
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              className="w-full bg-mist-gray border border-[#ececec] rounded-xl pl-14 pr-4 py-3 outline-none focus:border-ink-black text-[16px] font-medium"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="text-[13px] font-medium text-slate-gray mb-1.5 block uppercase tracking-wide">
            Bank Transfers (Direct)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-gray font-medium">LKR</span>
            <input 
              type="number"
              required
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full bg-mist-gray border border-[#ececec] rounded-xl pl-14 pr-4 py-3 outline-none focus:border-ink-black text-[16px] font-medium"
              placeholder="0.00"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !cash || !bank}
          className="w-full bg-ink-black text-paper-white py-4 rounded-xl text-[15px] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          Submit Totals
        </button>
      </form>
    </div>
  )
}
