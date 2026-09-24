"use client"

import { useState, useEffect } from "react"
import { cacheCollectionSheet, getCachedCollectionSheet, saveRepaymentOffline } from "@/lib/indexed-db"
import { CheckCircle2, CloudOff, Loader2 } from "lucide-react"

export default function CollectionSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const [centreId, setCentreId] = useState<string | null>(null)
  const [data, setData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const [success, setSuccess] = useState<Record<string, boolean>>({})

  useEffect(() => {
    params.then(p => setCentreId(p.id))
  }, [params])

  useEffect(() => {
    if (!centreId) return

    const loadData = async () => {
      try {
        const online = navigator.onLine
        setIsOffline(!online)

        if (online) {
          const res = await fetch(`/api/field/centres/${centreId}/collection-sheet`)
          if (!res.ok) throw new Error("Failed to fetch")
          const json = await res.json()
          setData(json)
          await cacheCollectionSheet(centreId, json)
        } else {
          // Offline fallback
          const cached = await getCachedCollectionSheet(centreId)
          if (cached) {
            setData(cached.data)
          }
        }
      } catch (err) {
        setIsOffline(true)
        const cached = await getCachedCollectionSheet(centreId)
        if (cached) setData(cached.data)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [centreId])

  const handleSubmit = async (memberId: string, loanId: string) => {
    const amountStr = inputs[loanId]
    const amount = Number(amountStr)
    if (!amount || amount <= 0) return

    setSubmitting(prev => ({ ...prev, [loanId]: true }))

    try {
      if (navigator.onLine) {
        const res = await fetch("/api/field/collect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loanId, amount, notes: "Field Collection" })
        })
        if (!res.ok) throw new Error("Network response was not ok")
      } else {
        throw new Error("Offline")
      }
      setSuccess(prev => ({ ...prev, [loanId]: true }))
    } catch (err) {
      // Save offline
      await saveRepaymentOffline({
        id: crypto.randomUUID(),
        loanId,
        amount,
        centreId: centreId!,
        memberId
      })
      setSuccess(prev => ({ ...prev, [loanId]: true }))
    } finally {
      setSubmitting(prev => ({ ...prev, [loanId]: false }))
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-gray" /></div>

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-24">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] leading-[1.3] text-ink-black font-serif font-normal" style={{ letterSpacing: '-0.66px' }}>
            Collection Sheet
          </h1>
          {isOffline && (
            <span className="flex items-center gap-1.5 bg-[#fce8e6] text-[#c5221f] px-3 py-1 rounded-full text-[13px] font-medium">
              <CloudOff className="w-3.5 h-3.5" /> Offline
            </span>
          )}
        </div>
        <p className="text-[15px] text-slate-gray">
          Today's scheduled collections for Centre {centreId}.
        </p>
      </div>

      {!data || data.length === 0 ? (
        <div className="bg-paper-white rounded-[24px] border border-[#ececec] p-8 text-center text-slate-gray shadow-subtle-1">
          No collections scheduled for today.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((member: any) => (
            <div key={member.id} className="bg-paper-white rounded-[24px] border border-[#ececec] p-6 shadow-subtle-1">
              <h3 className="text-[16px] font-medium text-ink-black mb-4">{member.firstName} {member.lastName}</h3>
              
              <div className="space-y-4">
                {member.loans?.map((loan: any) => {
                  const schedule = loan.repaymentSchedule[0]
                  if (!schedule) return null

                  const isSuccess = success[loan.id]
                  const isSubmitting = submitting[loan.id]

                  return (
                    <div key={loan.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-mist-gray/30 rounded-xl border border-border/40">
                      <div>
                        <div className="text-[13px] text-slate-gray mb-1">Due Amount</div>
                        <div className="text-[16px] font-medium text-ink-black">
                          LKR {Number(schedule.principalDue) + Number(schedule.interestDue)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          placeholder="Amount"
                          disabled={isSuccess || isSubmitting}
                          className="w-32 bg-paper-white border border-[#ececec] rounded-xl px-4 py-2.5 outline-none focus:border-ink-black text-[14px]"
                          value={inputs[loan.id] || ""}
                          onChange={e => setInputs(prev => ({ ...prev, [loan.id]: e.target.value }))}
                        />
                        <button
                          onClick={() => handleSubmit(member.id, loan.id)}
                          disabled={isSuccess || isSubmitting || !inputs[loan.id]}
                          className="bg-ink-black text-paper-white px-5 py-2.5 rounded-xl text-[14px] font-medium disabled:opacity-50 min-w-[100px] flex justify-center"
                        >
                          {isSuccess ? <CheckCircle2 className="w-5 h-5 text-paper-white" /> : isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Collect"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
